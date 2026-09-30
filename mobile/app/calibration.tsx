import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';

const MOTORS = [
  { id: 0, label: 'M1', band: '80–500 Hz', desc: 'Voicing · F0 · Nasals', color: '#C0392B' },
  { id: 1, label: 'M2', band: '500–1500 Hz', desc: 'F1 · Back vowel F2', color: '#E67E22' },
  { id: 2, label: 'M3', band: '1500–3500 Hz', desc: 'Front vowel F2 · F3', color: '#27AE60' },
  { id: 3, label: 'M4', band: '3500–8000 Hz', desc: 'Fricatives · /s/ /ʃ/ /f/', color: '#2980B9' },
];

type StaircaseState = {
  intensity: number;
  direction: 'up' | 'down';
  consecutiveCorrect: number;
  trials: { intensity: number; correct: boolean }[];
  reversals: number[];
  done: boolean;
  threshold: number | null;
};

function initStaircase(): StaircaseState {
  return {
    intensity: 80,
    direction: 'down',
    consecutiveCorrect: 0,
    trials: [],
    reversals: [],
    done: false,
    threshold: null,
  };
}

function stepStaircase(state: StaircaseState, correct: boolean): StaircaseState {
  const s = { ...state };
  const step = s.reversals.length < 4 ? 10 : 5;

  s.trials = [...s.trials, { intensity: s.intensity, correct }];

  if (correct) {
    s.consecutiveCorrect += 1;
    if (s.consecutiveCorrect >= 2) {
      if (s.direction === 'up') s.reversals = [...s.reversals, s.intensity];
      s.direction = 'down';
      s.intensity = Math.max(5, s.intensity - step);
      s.consecutiveCorrect = 0;
    }
  } else {
    if (s.direction === 'down') s.reversals = [...s.reversals, s.intensity];
    s.direction = 'up';
    s.intensity = Math.min(100, s.intensity + step);
    s.consecutiveCorrect = 0;
  }

  if (s.reversals.length >= 8) {
    const last6 = s.reversals.slice(-6);
    s.threshold = Math.round(last6.reduce((a, b) => a + b, 0) / last6.length);
    s.done = true;
  }

  return s;
}

export default function CalibrationScreen() {
  const [currentMotor, setCurrentMotor] = useState(0);
  const [staircase, setStaircase] = useState<StaircaseState>(initStaircase());
  const [thresholds, setThresholds] = useState<(number | null)[]>([null, null, null, null]);
  const [pulsing, setPulsing] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  const motor = MOTORS[currentMotor];

  const triggerPulse = () => {
    setPulsing(true);
    setWaitingForResponse(false);
    ringOpacity.setValue(1);
    ringScale.setValue(1);

    Animated.parallel([
      Animated.timing(ringScale, { toValue: 2.2, duration: 500, useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      setPulsing(false);
      setWaitingForResponse(true);
    });
  };

  useEffect(() => {
    const t = setTimeout(triggerPulse, 700);
    return () => clearTimeout(t);
  }, [currentMotor]);

  const handleResponse = (felt: boolean) => {
    if (!waitingForResponse) return;
    setWaitingForResponse(false);

    const updated = stepStaircase(staircase, felt);
    setStaircase(updated);

    if (updated.done) {
      const t = [...thresholds];
      t[currentMotor] = updated.threshold;
      setThresholds(t);

      if (currentMotor < 3) {
        setTimeout(() => {
          setCurrentMotor((m) => m + 1);
          setStaircase(initStaircase());
        }, 1200);
      } else {
        setTimeout(() => setAllDone(true), 1200);
      }
    } else {
      setTimeout(triggerPulse, 500);
    }
  };

  if (allDone) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>CALIBRATE</Text>
          <Text style={styles.headerTag}>COMPLETE</Text>
        </View>

        <Text style={styles.completeSub}>
          Vibrotactile detection thresholds established.{'\n'}
          4 motors · 2-up/1-down staircase · 70.7% criterion
        </Text>

        <View style={styles.divider} />

        {MOTORS.map((m, i) => (
          <View key={m.id} style={styles.resultRow}>
            <View style={styles.resultLeft}>
              <Text style={[styles.resultMotor, { color: m.color }]}>{m.label}</Text>
              <View>
                <Text style={styles.resultBand}>{m.band}</Text>
                <Text style={styles.resultDesc}>{m.desc}</Text>
              </View>
            </View>
            <View style={styles.resultRight}>
              <Text style={[styles.resultThreshold, { color: m.color }]}>
                {thresholds[i] ?? '--'}
              </Text>
              <Text style={styles.resultUnit}>% PWM</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.noteText}>
          These thresholds will scale motor output during training sessions.
          Share with your neuroscience collaborator for the pilot study baseline.
        </Text>

        <TouchableOpacity
          style={styles.recalibBtn}
          onPress={() => {
            setCurrentMotor(0);
            setStaircase(initStaircase());
            setThresholds([null, null, null, null]);
            setAllDone(false);
          }}>
          <Text style={styles.recalibText}>↺  RECALIBRATE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>CALIBRATE</Text>
        <Text style={styles.headerTag}>
          {currentMotor + 1} / 4
        </Text>
      </View>

      {/* Motor progress strip */}
      <View style={styles.progressStrip}>
        {MOTORS.map((m, i) => (
          <View
            key={m.id}
            style={[
              styles.progressSegment,
              {
                backgroundColor: i < currentMotor
                  ? m.color
                  : i === currentMotor
                  ? m.color
                  : '#151515',
                opacity: i === currentMotor ? 1 : i < currentMotor ? 0.4 : 1,
              }
            ]}
          />
        ))}
      </View>

      {/* Current motor */}
      <View style={styles.motorSection}>
        <Text style={[styles.motorLabel, { color: motor.color }]}>{motor.label}</Text>
        <Text style={styles.motorBand}>{motor.band}</Text>
        <Text style={styles.motorDesc}>{motor.desc}</Text>
      </View>

      <View style={styles.divider} />

      {/* Pulse area */}
      <View style={styles.pulseArea}>
        <View style={styles.pulseRingContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: motor.color,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              }
            ]}
          />
          <View style={[
            styles.pulseCore,
            { backgroundColor: pulsing ? motor.color : '#111' }
          ]} />
        </View>
        <Text style={styles.pulseStatus}>
          {pulsing
            ? '— pulse —'
            : waitingForResponse
            ? 'respond'
            : '···'}
        </Text>
      </View>

      {/* Intensity readout */}
      <View style={styles.intensityRow}>
        <Text style={styles.intensityLabel}>INTENSITY</Text>
        <Text style={[styles.intensityValue, { color: motor.color }]}>
          {staircase.intensity.toString().padStart(3, '0')}
        </Text>
        <Text style={styles.intensityUnit}>/ 100</Text>
      </View>

      <View style={styles.divider} />

      {/* Response buttons */}
      <View style={styles.responseRow}>
        <TouchableOpacity
          style={[styles.responseBtn, !waitingForResponse && styles.responseBtnDisabled]}
          onPress={() => handleResponse(true)}
          disabled={!waitingForResponse}>
          <Text style={styles.responseBtnSymbol}>↑</Text>
          <Text style={styles.responseBtnText}>FELT IT</Text>
        </TouchableOpacity>

        <View style={styles.responseDivider} />

        <TouchableOpacity
          style={[styles.responseBtn, !waitingForResponse && styles.responseBtnDisabled]}
          onPress={() => handleResponse(false)}
          disabled={!waitingForResponse}>
          <Text style={styles.responseBtnSymbol}>↓</Text>
          <Text style={styles.responseBtnText}>NOTHING</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Reversal tracker */}
      <View style={styles.reversalRow}>
        <Text style={styles.reversalLabel}>REVERSALS</Text>
        <View style={styles.reversalTrack}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.reversalSeg,
                { backgroundColor: i < staircase.reversals.length ? motor.color : '#151515' }
              ]}
            />
          ))}
        </View>
        <Text style={styles.reversalCount}>
          {staircase.reversals.length} / 8
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 4,
  },
  headerTag: {
    fontSize: 10,
    color: '#333',
    letterSpacing: 2,
  },
  progressStrip: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 24,
  },
  progressSegment: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  motorSection: {
    marginBottom: 20,
  },
  motorLabel: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  motorBand: {
    fontSize: 13,
    color: '#444',
    letterSpacing: 1,
    marginBottom: 2,
  },
  motorDesc: {
    fontSize: 10,
    color: '#2a2a2a',
    letterSpacing: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#151515',
    marginVertical: 20,
  },
  pulseArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseRingContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  pulseCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pulseStatus: {
    fontSize: 10,
    color: '#2a2a2a',
    letterSpacing: 3,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  intensityLabel: {
    fontSize: 9,
    color: '#2a2a2a',
    letterSpacing: 3,
    flex: 1,
  },
  intensityValue: {
    fontSize: 32,
    fontFamily: 'monospace' as any,
    fontWeight: '300',
    letterSpacing: 2,
  },
  intensityUnit: {
    fontSize: 11,
    color: '#2a2a2a',
    letterSpacing: 1,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  responseBtnDisabled: {
    opacity: 0.15,
  },
  responseBtnSymbol: {
    fontSize: 20,
    color: '#555',
  },
  responseBtnText: {
    fontSize: 9,
    color: '#333',
    letterSpacing: 3,
    fontWeight: '600',
  },
  responseDivider: {
    width: 0.5,
    height: 40,
    backgroundColor: '#151515',
  },
  reversalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reversalLabel: {
    fontSize: 9,
    color: '#2a2a2a',
    letterSpacing: 3,
  },
  reversalTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  reversalSeg: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  reversalCount: {
    fontSize: 10,
    color: '#2a2a2a',
    fontFamily: 'monospace' as any,
    letterSpacing: 1,
  },
  completeSub: {
    fontSize: 11,
    color: '#333',
    letterSpacing: 0.5,
    lineHeight: 18,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#111',
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resultMotor: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    width: 28,
  },
  resultBand: {
    fontSize: 12,
    color: '#555',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resultDesc: {
    fontSize: 9,
    color: '#2a2a2a',
    letterSpacing: 0.5,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultThreshold: {
    fontSize: 24,
    fontFamily: 'monospace' as any,
    fontWeight: '300',
  },
  resultUnit: {
    fontSize: 8,
    color: '#2a2a2a',
    letterSpacing: 2,
  },
  noteText: {
    fontSize: 10,
    color: '#2a2a2a',
    lineHeight: 17,
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  recalibBtn: {
    borderWidth: 0.5,
    borderColor: '#1a1a1a',
    borderRadius: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recalibText: {
    fontSize: 10,
    color: '#333',
    letterSpacing: 3,
    fontWeight: '600',
  },
});
