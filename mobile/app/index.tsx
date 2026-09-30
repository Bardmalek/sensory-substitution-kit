import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

const BANDS = [
  { label: 'M1', color: '#C0392B', height: 0.4 },
  { label: 'M2', color: '#E67E22', height: 0.6 },
  { label: 'M3', color: '#27AE60', height: 0.75 },
  { label: 'M4', color: '#2980B9', height: 0.3 },
];

function FreqBar({ color, baseHeight }: { color: string; baseHeight: number }) {
  const anim = useRef(new Animated.Value(baseHeight)).current;

  useEffect(() => {
    const pulse = () => {
      const next = Math.max(0.05, Math.min(1, baseHeight + (Math.random() - 0.5) * 0.4));
      Animated.timing(anim, {
        toValue: next,
        duration: 300 + Math.random() * 400,
        useNativeDriver: false,
      }).start(pulse);
    };
    pulse();
  }, []);

  return (
    <View style={{ flex: 1, height: 48, justifyContent: 'flex-end', marginHorizontal: 2 }}>
      <Animated.View
        style={{
          backgroundColor: color,
          opacity: 0.7,
          borderRadius: 1,
          height: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>SENSORYSUB</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDotOff} />
          <Text style={styles.statusPillText}>NO DEVICE</Text>
        </View>
      </View>

      {/* Frequency visualizer */}
      <View style={styles.vizSection}>
        <View style={styles.vizBars}>
          {Array.from({ length: 24 }).map((_, i) => {
            const band = BANDS[Math.floor((i / 24) * 4)];
            return (
              <FreqBar
                key={i}
                color={band.color}
                baseHeight={band.height * (0.5 + Math.random() * 0.5)}
              />
            );
          })}
        </View>
        <View style={styles.vizLabels}>
          <Text style={styles.vizLabel}>80 Hz</Text>
          <Text style={styles.vizLabel}>500</Text>
          <Text style={styles.vizLabel}>1.5k</Text>
          <Text style={styles.vizLabel}>3.5k</Text>
          <Text style={styles.vizLabel}>8k Hz</Text>
        </View>
        <View style={styles.motorLabels}>
          {BANDS.map((b) => (
            <View key={b.label} style={styles.motorLabelItem}>
              <View style={[styles.motorLabelDot, { backgroundColor: b.color }]} />
              <Text style={styles.motorLabelText}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Nav items */}
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/ble')}>
        <View style={styles.navLeft}>
          <Text style={styles.navSymbol}>◌</Text>
          <View>
            <Text style={styles.navTitle}>Device</Text>
            <Text style={styles.navSub}>Connect via Bluetooth LE</Text>
          </View>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.hairline} />

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/calibration')}>
        <View style={styles.navLeft}>
          <Text style={styles.navSymbol}>⊙</Text>
          <View>
            <Text style={styles.navTitle}>Calibrate</Text>
            <Text style={styles.navSub}>Detection threshold per motor</Text>
          </View>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.hairline} />

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/training')}>
        <View style={styles.navLeft}>
          <Text style={styles.navSymbol}>▷</Text>
          <View>
            <Text style={styles.navTitle}>Training</Text>
            <Text style={styles.navSub}>Perceptual learning protocol</Text>
          </View>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Footer meta */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Phase 0 · Proof of concept</Text>
        <Text style={styles.footerText}>4ch · 80–8000 Hz</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  wordmark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDotOff: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#333',
  },
  statusPillText: {
    fontSize: 9,
    color: '#444',
    letterSpacing: 2,
    fontWeight: '600',
  },
  vizSection: {
    marginBottom: 28,
  },
  vizBars: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  vizLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vizLabel: {
    fontSize: 9,
    color: '#333',
    letterSpacing: 0.5,
  },
  motorLabels: {
    flexDirection: 'row',
    gap: 16,
  },
  motorLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  motorLabelDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  motorLabelText: {
    fontSize: 9,
    color: '#444',
    letterSpacing: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#1a1a1a',
    marginBottom: 4,
  },
  hairline: {
    height: 0.5,
    backgroundColor: '#151515',
    marginLeft: 40,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navSymbol: {
    fontSize: 16,
    color: '#333',
    width: 24,
    textAlign: 'center',
  },
  navTitle: {
    fontSize: 15,
    color: '#e0e0e0',
    fontWeight: '500',
    marginBottom: 2,
  },
  navSub: {
    fontSize: 11,
    color: '#3a3a3a',
    letterSpacing: 0.3,
  },
  navArrow: {
    fontSize: 18,
    color: '#2a2a2a',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 9,
    color: '#2a2a2a',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
