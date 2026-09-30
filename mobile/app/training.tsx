import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';

const PHASES = [
  {
    id: 1,
    label: 'P1',
    title: 'Spectral anchors',
    desc: 'M1 vs M4 only — maximum contrast. Narrowband noise bursts. 2-AFC.',
    sounds: [
      { sym: '◼', name: 'Silence', note: 'All motors off · reference baseline', motors: [0, 0, 0, 0] },
      { sym: '●', name: '/m/', note: 'Nasal murmur ~250 Hz · M1 dominant', motors: [90, 20, 5, 0] },
      { sym: '○', name: '/s/', note: 'Alveolar fricative ~6–7 kHz · M4 dominant', motors: [0, 0, 15, 100] },
    ],
  },
  {
    id: 2,
    label: 'P2',
    title: 'Corner vowels',
    desc: 'Most spectrally distinct English vowels. /ɑ/ /i/ /u/ established first.',
    sounds: [
      { sym: '/ɑ/', name: '"father"', note: 'High F1 · low F2 → M1+M2 dominant', motors: [65, 80, 15, 0] },
      { sym: '/i/', name: '"feet"', note: 'Low F1 · very high F2 → M1+M3', motors: [35, 25, 90, 0] },
      { sym: '/u/', name: '"boot"', note: 'Low F1 · low F2 → M1+M2 (back)', motors: [45, 65, 10, 0] },
      { sym: '/ʃ/', name: '"ship"', note: 'Post-alveolar · centroid ~3.5 kHz', motors: [0, 10, 55, 85] },
    ],
  },
  {
    id: 3,
    label: 'P3',
    title: 'Natural sounds',
    desc: 'Bridge from artificial to ecological stimuli. Instruments → vowels → consonant manner.',
    sounds: [
      { sym: '♩', name: 'Kick drum', note: 'Sub-bass ~60–200 Hz · M1 maximum', motors: [100, 30, 5, 0] },
      { sym: '♪', name: 'Hi-hat', note: '6–12 kHz sustained · M4 dominant', motors: [0, 0, 20, 100] },
      { sym: '/r/', name: '"red"', note: 'Very low F3 ~1650 Hz · English /r/ cue', motors: [55, 65, 80, 0] },
      { sym: '/b/', name: '"bat"', note: 'Voicing bar + low F2 locus', motors: [80, 35, 20, 0] },
    ],
  },
  {
    id: 4,
    label: 'P4',
    title: 'Minimal pairs',
    desc: 'Hardest distinctions. Voiced vs unvoiced. Confusion matrix analysis required.',
    sounds: [
      { sym: '/s/·/z/', name: 'Voicing pair', note: 'Identical M4 · only M1 differs', motors: [0, 0, 35, 75] },
      { sym: '/b/·/p/', name: 'VOT pair', note: 'Transient low-freq energy difference', motors: [70, 35, 35, 0] },
      { sym: '/ð/·/θ/', name: 'Dental pair', note: 'Near-chance expected · flag in matrix', motors: [0, 5, 20, 60] },
    ],
  },
];

const MOTOR_COLORS = ['#C0392B', '#E67E22', '#27AE60', '#2980B9'];
const MOTOR_LABELS = ['M1', 'M2', 'M3', 'M4'];

export default function TrainingScreen() {
  const [phase, setPhase] = useState(0);
  const [soundIdx, setSoundIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [playing, setPlaying] = useState(false);

  const currentPhase = PHASES[phase];
  const currentSound = currentPhase.sounds[soundIdx];
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;

  const playSound = () => {
    setPlaying(true);
    setTimeout(() => setPlaying(false), 800);
    // TODO: expo-av audio + BLE motor pulse
  };

  const respond = (correct: boolean) => {
    setLastResult(correct ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setTimeout(() => {
      setLastResult(null);
      setSoundIdx((s) => (s + 1) % currentPhase.sounds.length);
    }, 700);
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>TRAINING</Text>
        {accuracy !== null && (
          <Text style={[
            styles.accuracyBadge,
            { color: accuracy >= 80 ? '#27AE60' : accuracy >= 60 ? '#E67E22' : '#C0392B' }
          ]}>
            {accuracy}% ACC
          </Text>
        )}
      </View>

      {/* Phase selector */}
      <View style={styles.phaseStrip}>
        {PHASES.map((p, i) => (
          <TouchableOpacity
            key={p.id}
            style={styles.phaseBtn}
            onPress={() => { setPhase(i); setSoundIdx(0); }}>
            <Text style={[
              styles.phaseBtnText,
              i === phase && styles.phaseBtnTextActive
            ]}>
              {p.label}
            </Text>
            {i === phase && <View style={styles.phaseUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Phase info */}
      <View style={styles.phaseInfo}>
        <Text style={styles.phaseTitle}>{currentPhase.title}</Text>
        <Text style={styles.phaseDesc}>{currentPhase.desc}</Text>
      </View>

      <View style={styles.divider} />

      {/* Current sound */}
      <View style={styles.soundBlock}>
        <Text style={styles.soundSym}>{currentSound.sym}</Text>
        <View style={styles.soundMeta}>
          <Text style={styles.soundName}>{currentSound.name}</Text>
          <Text style={styles.soundNote}>{currentSound.note}</Text>
        </View>
      </View>

      {/* Motor mapping */}
      <View style={styles.motorMap}>
        {currentSound.motors.map((val, i) => (
          <View key={i} style={styles.motorMapItem}>
            <Text style={[styles.motorMapLabel, { color: val > 20 ? MOTOR_COLORS[i] : '#222' }]}>
              {MOTOR_LABELS[i]}
            </Text>
            <View style={styles.motorMapTrack}>
              <View style={[
                styles.motorMapFill,
                {
                  width: `${val}%`,
                  backgroundColor: MOTOR_COLORS[i],
                  opacity: val > 0 ? 1 : 0,
                }
              ]} />
            </View>
            <Text style={[styles.motorMapVal, { color: val > 20 ? '#333' : '#1a1a1a' }]}>
              {val}
            </Text>
          </View>
        ))}
      </View>

      {/* Play */}
      <TouchableOpacity style={styles.playBtn} onPress={playSound}>
        <Text style={styles.playBtnSymbol}>{playing ? '■' : '▷'}</Text>
        <Text style={styles.playBtnText}>{playing ? 'PLAYING' : 'PLAY SOUND'}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Response */}
      {lastResult ? (
        <View style={[
          styles.resultFlash,
          { borderColor: lastResult === 'correct' ? '#27AE60' : '#C0392B' }
        ]}>
          <Text style={[
            styles.resultFlashText,
            { color: lastResult === 'correct' ? '#27AE60' : '#C0392B' }
          ]}>
            {lastResult === 'correct' ? '✓  correct' : '✕  incorrect'}
          </Text>
        </View>
      ) : (
        <View style={styles.responseRow}>
          <TouchableOpacity style={styles.responseBtn} onPress={() => respond(true)}>
            <Text style={styles.responseBtnSymbol}>↑</Text>
            <Text style={styles.responseBtnText}>FELT IT</Text>
          </TouchableOpacity>
          <View style={styles.responseDivider} />
          <TouchableOpacity style={styles.responseBtn} onPress={() => respond(false)}>
            <Text style={styles.responseBtnSymbol}>↓</Text>
            <Text style={styles.responseBtnText}>MISSED</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.divider} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{score.total.toString().padStart(3, '0')}</Text>
          <Text style={styles.statLabel}>TRIALS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{score.correct.toString().padStart(3, '0')}</Text>
          <Text style={styles.statLabel}>CORRECT</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, accuracy !== null && accuracy >= 80 ? { color: '#27AE60' } : {}]}>
            {accuracy !== null ? `${accuracy}%` : '---'}
          </Text>
          <Text style={styles.statLabel}>ACCURACY</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {soundIdx + 1}/{currentPhase.sounds.length}
          </Text>
          <Text style={styles.statLabel}>SOUND</Text>
        </View>
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
  accuracyBadge: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
  },
  phaseStrip: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#151515',
  },
  phaseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative',
  },
  phaseBtnText: {
    fontSize: 10,
    color: '#2a2a2a',
    letterSpacing: 2,
    fontWeight: '600',
  },
  phaseBtnTextActive: {
    color: '#888',
  },
  phaseUnderline: {
    position: 'absolute',
    bottom: -0.5,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: '#888',
  },
  phaseInfo: {
    marginBottom: 20,
  },
  phaseTitle: {
    fontSize: 15,
    color: '#ccc',
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  phaseDesc: {
    fontSize: 10,
    color: '#2a2a2a',
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#151515',
    marginVertical: 16,
  },
  soundBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  soundSym: {
    fontSize: 32,
    color: '#555',
    width: 48,
    textAlign: 'center',
  },
  soundMeta: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  soundNote: {
    fontSize: 10,
    color: '#2a2a2a',
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  motorMap: {
    gap: 8,
    marginBottom: 16,
  },
  motorMapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  motorMapLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    width: 20,
  },
  motorMapTrack: {
    flex: 1,
    height: 2,
    backgroundColor: '#111',
    borderRadius: 1,
    overflow: 'hidden',
  },
  motorMapFill: {
    height: '100%',
    borderRadius: 1,
  },
  motorMapVal: {
    fontSize: 9,
    fontFamily: 'monospace' as any,
    width: 24,
    textAlign: 'right',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: '#1a1a1a',
    borderRadius: 2,
    paddingHorizontal: 16,
  },
  playBtnSymbol: {
    fontSize: 14,
    color: '#444',
  },
  playBtnText: {
    fontSize: 10,
    color: '#333',
    letterSpacing: 3,
    fontWeight: '600',
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  responseBtnSymbol: {
    fontSize: 18,
    color: '#333',
  },
  responseBtnText: {
    fontSize: 9,
    color: '#2a2a2a',
    letterSpacing: 3,
    fontWeight: '600',
  },
  responseDivider: {
    width: 0.5,
    height: 36,
    backgroundColor: '#151515',
  },
  resultFlash: {
    borderWidth: 0.5,
    borderRadius: 2,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resultFlashText: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    color: '#444',
    fontFamily: 'monospace' as any,
    fontWeight: '300',
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 7,
    color: '#1e1e1e',
    letterSpacing: 2,
  },
  statDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: '#151515',
  },
});
