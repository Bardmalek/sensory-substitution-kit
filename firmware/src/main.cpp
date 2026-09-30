/*
  Sensory Substitution Device — Phase 1 Firmware
  MAX9814 Analog Microphone Version
  ------------------------------------------------
  Hardware:
    - ESP32 DevKit
    - MAX9814 analog microphone
    - 4x coin vibration motors via ULN2803A driver

  Wiring:
    MAX9814 → ESP32
      VDD  → 3.3V
      GND  → GND
      OUT  → GPIO 34  (analog input only pin)
      GAIN → leave unconnected (default 60dB)
      AR   → leave unconnected

    ULN2803A → ESP32
      IN1  → GPIO 16  (motor 1 — 80–500 Hz)
      IN2  → GPIO 17  (motor 2 — 500–1500 Hz)
      IN3  → GPIO 18  (motor 3 — 1500–3500 Hz)
      IN4  → GPIO 19  (motor 4 — 3500–4000 Hz)

    ULN2803A → Motors
      OUT1–OUT4 → negative wire of each motor
      COM pin   → motor supply positive (flyback diode common)
      Other motor wire → motor supply positive
      ESP32 GND and motor supply GND must be connected
*/

#include <Arduino.h>
#include <arduinoFFT.h>

// ─── Analog mic config ────────────────────────────────────────────────────────
#define MIC_PIN         34
#define SAMPLE_RATE     8000
#define FFT_SAMPLES     512

// ─── Motor pins ───────────────────────────────────────────────────────────────
#define MOTOR_1_PIN     16
#define MOTOR_2_PIN     17
#define MOTOR_3_PIN     18
#define MOTOR_4_PIN     19

#define PWM_CHANNEL_1   0
#define PWM_CHANNEL_2   1
#define PWM_CHANNEL_3   2
#define PWM_CHANNEL_4   3
#define PWM_FREQ        1000
#define PWM_RESOLUTION  8

// ─── FFT buffers ──────────────────────────────────────────────────────────────
double vReal[FFT_SAMPLES];
double vImag[FFT_SAMPLES];
ArduinoFFT<double> FFT = ArduinoFFT<double>(vReal, vImag, FFT_SAMPLES, SAMPLE_RATE);

// ─── Smoothing ────────────────────────────────────────────────────────────────
#define SMOOTH_ALPHA    0.3f
float smoothed[4] = {0, 0, 0, 0};

// ─── Sampling timing ──────────────────────────────────────────────────────────
unsigned long sampleInterval = 1000000 / SAMPLE_RATE;

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("SensorySub — MAX9814 analog mic version booting...");

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  ledcSetup(PWM_CHANNEL_1, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_2, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_3, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_4, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR_1_PIN, PWM_CHANNEL_1);
  ledcAttachPin(MOTOR_2_PIN, PWM_CHANNEL_2);
  ledcAttachPin(MOTOR_3_PIN, PWM_CHANNEL_3);
  ledcAttachPin(MOTOR_4_PIN, PWM_CHANNEL_4);

  ledcWrite(PWM_CHANNEL_1, 0);
  ledcWrite(PWM_CHANNEL_2, 0);
  ledcWrite(PWM_CHANNEL_3, 0);
  ledcWrite(PWM_CHANNEL_4, 0);

  Serial.println("Ready. Listening...");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

bool readMicFrame() {
  unsigned long startTime = micros();
  for (int i = 0; i < FFT_SAMPLES; i++) {
    int raw = analogRead(MIC_PIN);
    vReal[i] = (double)(raw - 2048) / 2048.0;
    vImag[i] = 0.0;
    while (micros() - startTime < (unsigned long)(i + 1) * sampleInterval);
  }
  return true;
}

float getBandEnergy(float freqLow, float freqHigh) {
  float resolution = (float)SAMPLE_RATE / FFT_SAMPLES;
  int binLow  = (int)(freqLow  / resolution);
  int binHigh = (int)(freqHigh / resolution);
  binHigh = min(binHigh, FFT_SAMPLES / 2 - 1);
  float energy = 0;
  for (int i = binLow; i <= binHigh; i++) {
    energy += vReal[i];
  }
  return energy / (binHigh - binLow + 1);
}

uint8_t energyToPWM(float energy, float noiseFloor, float ceiling) {
  if (energy <= noiseFloor) return 0;
  float normalised = (energy - noiseFloor) / (ceiling - noiseFloor);
  normalised = constrain(normalised, 0.0f, 1.0f);
  normalised = sqrt(normalised);
  return (uint8_t)(normalised * 255);
}

// ─── Main loop ────────────────────────────────────────────────────────────────
void loop() {
  if (!readMicFrame()) {
    Serial.println("Mic read failed — check wiring");
    delay(100);
    return;
  }

  FFT.windowing(FFTWindow::Hann, FFTDirection::Forward);
  FFT.compute(FFTDirection::Forward);
  FFT.complexToMagnitude();

  float e1 = getBandEnergy(80,   500);
  float e2 = getBandEnergy(500,  1500);
  float e3 = getBandEnergy(1500, 3500);
  float e4 = getBandEnergy(3500, 4000);

  uint8_t pwm1 = energyToPWM(e1, 0.002f, 0.08f);
  uint8_t pwm2 = energyToPWM(e2, 0.002f, 0.06f);
  uint8_t pwm3 = energyToPWM(e3, 0.001f, 0.04f);
  uint8_t pwm4 = energyToPWM(e4, 0.001f, 0.03f);

  smoothed[0] = SMOOTH_ALPHA * pwm1 + (1 - SMOOTH_ALPHA) * smoothed[0];
  smoothed[1] = SMOOTH_ALPHA * pwm2 + (1 - SMOOTH_ALPHA) * smoothed[1];
  smoothed[2] = SMOOTH_ALPHA * pwm3 + (1 - SMOOTH_ALPHA) * smoothed[2];
  smoothed[3] = SMOOTH_ALPHA * pwm4 + (1 - SMOOTH_ALPHA) * smoothed[3];

  ledcWrite(PWM_CHANNEL_1, (uint8_t)smoothed[0]);
  ledcWrite(PWM_CHANNEL_2, (uint8_t)smoothed[1]);
  ledcWrite(PWM_CHANNEL_3, (uint8_t)smoothed[2]);
  ledcWrite(PWM_CHANNEL_4, (uint8_t)smoothed[3]);

  Serial.printf("M1:%.4f M2:%.4f M3:%.4f M4:%.4f | PWM: %d %d %d %d\n",
    e1, e2, e3, e4,
    (uint8_t)smoothed[0], (uint8_t)smoothed[1],
    (uint8_t)smoothed[2], (uint8_t)smoothed[3]);
}
