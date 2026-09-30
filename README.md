# Sensory Substitution Kit

An experimental sound-to-touch system built from an ESP32 vibration controller and an Expo mobile companion. The firmware samples microphone audio, computes an FFT, groups energy into four frequency bands, and drives four vibration motors. The mobile app contains onboarding, calibration, training, and Bluetooth screens.

> Prototype hardware and software. It has not been validated as an assistive or medical device.

## Architecture

```text
MAX9814 microphone → ESP32 ADC → 512-sample FFT → four band energies → PWM → ULN2803A → vibration motors
                                                                  ↕
                                                  Expo mobile companion (prototype)
```

| Part | Stack | Purpose |
| --- | --- | --- |
| `firmware/` | PlatformIO, Arduino, ESP32 | Audio analysis and motor output |
| `mobile/` | Expo, React Native | User interface for setup and training |

## Firmware

Install PlatformIO, connect an ESP32 DevKit, then:

```bash
cd firmware
pio run
pio run --target upload
pio device monitor
```

The MAX9814 output connects to GPIO 34. GPIO 16–19 drive ULN2803A inputs; each motor connects between its driver output and the motor supply positive rail. Connect the ESP32 and motor supply grounds. Use the driver COM pin for flyback diode common. Verify voltage and current against your actual motors and supply before powering them.

At an 8 kHz sample rate, the usable FFT range ends at 4 kHz. The four implemented bands are **80–500**, **500–1500**, **1500–3500**, and **3500–4000 Hz**.

## Mobile app

```bash
cd mobile
npm install
npx expo start
```

The BLE screen is prototype UI; hardware integration should be verified on a device with a development build.
