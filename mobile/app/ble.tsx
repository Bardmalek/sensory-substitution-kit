import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';

type Device = { id: string; name: string; rssi: number };

const BAND_COLORS = ['#C0392B', '#E67E22', '#27AE60', '#2980B9'];
const BAND_LABELS = ['80–500', '500–1.5k', '1.5k–3.5k', '3.5k–8k'];

export default function BLEScreen() {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [motorValues, setMotorValues] = useState([0, 0, 0, 0]);
  const scanAnim = useRef(new Animated.Value(0)).current;

  const animateScan = () => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  };

  const startScan = () => {
    setScanning(true);
    setDevices([]);
    animateScan();
    setTimeout(() => {
      setDevices([{ id: '1', name: 'SENSORYSUB-01', rssi: -52 }]);
      setScanning(false);
      scanAnim.stopAnimation();
    }, 2000);
  };

  const connect = (_device: Device) => {
    setConnected(true);
    setInterval(() => {
      setMotorValues([
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 200),
        Math.floor(Math.random() * 120),
      ]);
    }, 280);
  };

  return (
    <View style={styles.container}>

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>DEVICE</Text>
        <View style={[styles.connBadge, connected && styles.connBadgeOn]}>
          <Text style={[styles.connBadgeText, connected && styles.connBadgeTextOn]}>
            {connected ? '● CONNECTED' : '○ OFFLINE'}
          </Text>
        </View>
      </View>

      {!connected ? (
        <>
          {/* Scan button */}
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnActive]}
            onPress={startScan}
            disabled={scanning}>
            <Animated.Text style={[
              styles.scanBtnSymbol,
              {
                opacity: scanAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0.3, 1],
                })
              }
            ]}>
              {scanning ? '◎' : '○'}
            </Animated.Text>
            <Text style={styles.scanBtnText}>
              {scanning ? 'SCANNING' : 'SCAN FOR DEVICES'}
            </Text>
          </TouchableOpacity>

          {/* Device list */}
          {devices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FOUND</Text>
              {devices.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.deviceRow}
                  onPress={() => connect(d)}>
                  <View>
                    <Text style={styles.deviceName}>{d.name}</Text>
                    <Text style={styles.deviceRssi}>RSSI {d.rssi} dBm</Text>
                  </View>
                  <Text style={styles.connectSymbol}>⌥ connect</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          {/* Device info */}
          <View style={styles.deviceInfoRow}>
            <Text style={styles.deviceInfoName}>SENSORYSUB-01</Text>
            <Text style={styles.deviceInfoDetail}>ESP32 · 4ch · 16kHz</Text>
          </View>

          <View style={styles.divider} />

          {/* Motor meters */}
          <Text style={styles.sectionLabel}>MOTOR OUTPUT</Text>
          {motorValues.map((val, i) => (
            <View key={i} style={styles.meterRow}>
              <View style={styles.meterMeta}>
                <Text style={[styles.meterMotor, { color: BAND_COLORS[i] }]}>M{i + 1}</Text>
                <Text style={styles.meterBand}>{BAND_LABELS[i]} Hz</Text>
              </View>
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${(val / 255) * 100}%`,
                      backgroundColor: BAND_COLORS[i],
                    },
                  ]}
                />
                {/* Tick marks */}
                {[25, 50, 75].map((t) => (
                  <View
                    key={t}
                    style={[styles.meterTick, { left: `${t}%` as any }]}
                  />
                ))}
              </View>
              <Text style={styles.meterVal}>{val.toString().padStart(3, '0')}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>16k</Text>
              <Text style={styles.statLabel}>SAMPLE RATE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>512</Text>
              <Text style={styles.statLabel}>FFT SIZE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>32ms</Text>
              <Text style={styles.statLabel}>FRAME</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>MOTORS</Text>
            </View>
          </View>
        </>
      )}
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
    marginBottom: 28,
  },
  screenTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 4,
  },
  connBadge: {
    borderWidth: 0.5,
    borderColor: '#222',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  connBadgeOn: {
    borderColor: '#1a3a1a',
  },
  connBadgeText: {
    fontSize: 9,
    color: '#333',
    letterSpacing: 2,
    fontWeight: '600',
  },
  connBadgeTextOn: {
    color: '#27AE60',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#222',
    borderRadius: 4,
    padding: 18,
    marginBottom: 24,
  },
  scanBtnActive: {
    borderColor: '#2980B9',
  },
  scanBtnSymbol: {
    fontSize: 18,
    color: '#2980B9',
  },
  scanBtnText: {
    fontSize: 11,
    color: '#555',
    letterSpacing: 3,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    color: '#2a2a2a',
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#151515',
  },
  deviceName: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 3,
  },
  deviceRssi: {
    fontSize: 10,
    color: '#333',
    letterSpacing: 1,
  },
  connectSymbol: {
    fontSize: 11,
    color: '#2980B9',
    letterSpacing: 1,
  },
  deviceInfoRow: {
    marginBottom: 20,
  },
  deviceInfoName: {
    fontSize: 15,
    color: '#e0e0e0',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  deviceInfoDetail: {
    fontSize: 10,
    color: '#333',
    letterSpacing: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#151515',
    marginVertical: 20,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  meterMeta: {
    width: 72,
  },
  meterMotor: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  meterBand: {
    fontSize: 8,
    color: '#2a2a2a',
    letterSpacing: 0.5,
  },
  meterTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#151515',
    borderRadius: 1,
    overflow: 'visible',
    position: 'relative',
  },
  meterFill: {
    height: '100%',
    borderRadius: 1,
  },
  meterTick: {
    position: 'absolute',
    top: -2,
    width: 0.5,
    height: 7,
    backgroundColor: '#1a1a1a',
  },
  meterVal: {
    fontSize: 11,
    color: '#2a2a2a',
    fontFamily: 'monospace' as any,
    letterSpacing: 1,
    width: 30,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace' as any,
    fontWeight: '500',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 7,
    color: '#2a2a2a',
    letterSpacing: 1.5,
  },
  statDivider: {
    width: 0.5,
    height: 28,
    backgroundColor: '#151515',
  },
});
