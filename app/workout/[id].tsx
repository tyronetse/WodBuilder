import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Share,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useKeepAwake } from 'expo-keep-awake';
import { getWorkout, logSession, SetLog } from '../../src/store';
import { parseWorkoutCSV } from '../../src/csv';
import { buildPhases, formatClock, Phase } from '../../src/engine';
import { useTimerEndSound } from '../../src/audio';

export default function WorkoutPlayer() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [phases, setPhases] = useState<Phase[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [logging, setLogging] = useState(false);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [finished, setFinished] = useState(false);
  const [totalSec, setTotalSec] = useState(0);
  const [confirmStop, setConfirmStop] = useState(false);

  const endsAtRef = useRef(0);
  const phaseRef = useRef<Phase | null>(null);
  const logsRef = useRef<SetLog[]>([]);
  const [logs, setLogs] = useState<SetLog[]>([]);
  const startedAtRef = useRef(Date.now());
  const playEndSound = useTimerEndSound();

  // Load + parse the workout once.
  useEffect(() => {
    (async () => {
      try {
        const stored = await getWorkout(id ?? '');
        if (!stored) {
          setLoadError('Workout not found.');
          return;
        }
        setPhases(buildPhases(parseWorkoutCSV(stored.csv)));
      } catch (e: any) {
        setLoadError(e?.message ?? 'Could not load workout.');
      }
    })();
  }, [id]);

  const phase: Phase | null = phases ? phases[phaseIdx] ?? null : null;
  phaseRef.current = phase;

  // Demo video for work phases (loops muted while the timer runs).
  const workVideo = phase?.kind === 'work' ? phase.video : null;
  const player = useVideoPlayer(workVideo, (p) => {
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    if (workVideo) {
      try {
        player.play();
      } catch {
        /* video is a nice-to-have */
      }
    }
    // Key on the video itself (not phaseIdx): on first load the phases arrive
    // with phaseIdx still 0, so a phaseIdx dep never fires for exercise #1.
  }, [workVideo]);

  // Countdown driver: anchored to a wall-clock end time so it stays accurate.
  useEffect(() => {
    if (!phase || phase.kind === 'done' || logging || finished) return;
    const dur = phase.durationSec;
    endsAtRef.current = Date.now() + dur * 1000;
    setSecondsLeft(dur);
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(t);
        playEndSound();
        const p = phaseRef.current;
        if (p?.kind === 'work') {
          setReps(p.targetReps != null ? String(p.targetReps) : '');
          setWeight(p.targetWeightLb != null ? String(p.targetWeightLb) : '');
          setLogging(true);
        } else {
          advance();
        }
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, logging, phases, finished]);

  const advance = () => {
    setLogging(false);
    setPhaseIdx((i) => {
      const next = i + 1;
      if (phases && next < phases.length && phases[next].kind === 'done') {
        finishWorkout();
      }
      return next;
    });
  };

  const finishWorkout = async () => {
    const secs = Math.round((Date.now() - startedAtRef.current) / 1000);
    setTotalSec(secs);
    try {
      await logSession(id ?? '', logsRef.current, secs);
    } catch {
      /* history is a nice-to-have */
    }
    setFinished(true);
  };

  const submitLog = () => {
    const p = phaseRef.current;
    if (p?.kind === 'work') {
      const entry: SetLog = { name: p.name, round: p.round };
      const r = parseInt(reps.trim(), 10);
      const w = parseFloat(weight.trim());
      if (Number.isFinite(r)) entry.reps = r;
      if (Number.isFinite(w)) entry.weightLb = w;
      logsRef.current = [...logsRef.current, entry];
      setLogs(logsRef.current);
    }
    advance();
  };

  const endWorkEarly = () => {
    endsAtRef.current = Date.now(); // next tick completes the phase
  };

  // Two-tap stop: first tap arms, second tap quits to the library.
  // The arm resets on every phase change so it can't go off by accident.
  useEffect(() => {
    setConfirmStop(false);
  }, [phaseIdx]);

  const onStopPress = () => {
    if (confirmStop) {
      router.replace('/');
    } else {
      setConfirmStop(true);
      setTimeout(() => setConfirmStop(false), 4000);
    }
  };

  const stopButton = (
    <TouchableOpacity style={styles.stopButton} onPress={onStopPress}>
      <Text style={styles.stopText}>
        {confirmStop ? 'Tap again to stop the workout' : 'Stop workout'}
      </Text>
    </TouchableOpacity>
  );

  const shareSummary = async () => {
    const stored = await getWorkout(id ?? '');
    const msg =
      `Just crushed "${stored?.name ?? 'a WOD'}" on WodBuilder: ` +
      `${logsRef.current.length} sets in ${formatClock(totalSec)}.`;
    try {
      await Share.share({ message: msg });
    } catch {
      /* user dismissed */
    }
  };

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }
  if (!phases || !phase) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e10600" />
      </View>
    );
  }

  // ---- Done / summary ----
  if (finished || phase.kind === 'done') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.summary}>
        <Text style={styles.doneTitle}>Workout complete</Text>
        <Text style={styles.doneMeta}>
          {logsRef.current.length} sets · {formatClock(totalSec)}
        </Text>
        {logsRef.current.map((l, i) => (
          <Text key={i} style={styles.logRow}>
            R{l.round} · {l.name}
            {l.reps != null ? ` · ${l.reps} reps` : ''}
            {l.weightLb != null ? ` · ${l.weightLb} lb` : ''}
          </Text>
        ))}
        <TouchableOpacity style={styles.shareButton} onPress={shareSummary}>
          <Text style={styles.shareText}>Share result</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
          <Text style={styles.homeText}>Back to library</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ---- Log reps/weight between work and rest ----
  if (logging && phase.kind === 'work') {
    return (
      <View style={styles.root}>
        <Text style={styles.phaseLabel}>Log it</Text>
        <Text style={styles.exName}>{phase.name}</Text>
        <Text style={styles.targetLine}>
          Round {phase.round}
          {phase.targetReps != null ? ` · target ${phase.targetReps} reps` : ''}
          {phase.targetWeightLb != null ? ` · ${phase.targetWeightLb} lb` : ''}
        </Text>
        <View style={styles.logRow2}>
          <View style={styles.logField}>
            <Text style={styles.logLabel}>Reps</Text>
            <TextInput
              style={styles.logInput}
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.logField}>
            <Text style={styles.logLabel}>Weight (lb)</Text>
            <TextInput
              style={styles.logInput}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor="#666"
            />
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={submitLog}>
          <Text style={styles.primaryText}>Start rest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostButton} onPress={submitLog}>
          <Text style={styles.ghostText}>Skip logging</Text>
        </TouchableOpacity>
        {stopButton}
      </View>
    );
  }

  // ---- Work phase ----
  if (phase.kind === 'work') {
    return (
      <View style={styles.root}>
        <Text style={styles.phaseLabel}>
          Round {phase.round} · Exercise {phase.exerciseIndex + 1}
        </Text>
        <Text style={styles.exName}>{phase.name}</Text>
        {workVideo ? (
          <VideoView
            style={styles.video}
            player={player}
            nativeControls={false}
            contentFit="cover"
            playsInline
          />
        ) : (
          <View style={[styles.video, styles.videoFallback]}>
            <Text style={styles.videoFallbackText}>{phase.name}</Text>
          </View>
        )}
        <Text style={styles.timer}>{formatClock(secondsLeft)}</Text>
        <Text style={styles.targetLine}>
          {phase.targetReps != null ? `${phase.targetReps} reps` : 'AMRAP'}
          {phase.targetWeightLb != null ? ` · ${phase.targetWeightLb} lb` : ''}
        </Text>
        <TouchableOpacity style={styles.ghostButton} onPress={endWorkEarly}>
          <Text style={styles.ghostText}>End set early</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostButton} onPress={advance}>
          <Text style={styles.ghostText}>Skip exercise</Text>
        </TouchableOpacity>
        {stopButton}
      </View>
    );
  }

  // ---- Rest / round-rest phases ----
  const restTitle = phase.kind === 'roundRest' ? `Round ${phase.nextRound} incoming` : 'Rest';
  const restSub =
    phase.kind === 'roundRest' ? 'Catch your breath' : `Next: ${phase.nextName}`;
  return (
    <View style={[styles.root, styles.restRoot]}>
      <Text style={styles.phaseLabel}>{restTitle}</Text>
      <Text style={styles.timer}>{formatClock(secondsLeft)}</Text>
      <Text style={styles.targetLine}>{restSub}</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={advance}>
        <Text style={styles.primaryText}>Skip rest</Text>
      </TouchableOpacity>
      {stopButton}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  error: { color: '#ff6b6b', fontSize: 16 },
  phaseLabel: {
    color: '#e10600', fontSize: 15, fontWeight: 'bold',
    textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 8,
  },
  exName: { color: '#fff', fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#141414' },
  videoFallback: { alignItems: 'center', justifyContent: 'center' },
  videoFallbackText: { color: '#666', fontSize: 18 },
  timer: {
    color: '#fff', fontSize: 96, fontWeight: 'bold', textAlign: 'center',
    marginVertical: 16, fontVariant: ['tabular-nums'],
  },
  targetLine: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  restRoot: { alignItems: 'center' },
  primaryButton: {
    backgroundColor: '#e10600', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  ghostButton: { padding: 14, alignItems: 'center', marginTop: 4 },
  ghostText: { color: '#888', fontSize: 15 },
  stopButton: {
    borderWidth: 1, borderColor: '#e10600', borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 12,
  },
  stopText: { color: '#e10600', fontSize: 15, fontWeight: 'bold' },
  logRow2: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  logField: { flex: 1 },
  logLabel: { color: '#999', fontSize: 14, marginBottom: 6 },
  logInput: {
    backgroundColor: '#141414', color: '#fff', borderRadius: 12,
    padding: 16, fontSize: 22, textAlign: 'center',
  },
  summary: { padding: 20, paddingBottom: 48 },
  doneTitle: { color: '#4cd964', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  doneMeta: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  logRow: { color: '#ddd', fontSize: 15, marginTop: 6 },
  shareButton: {
    backgroundColor: '#e10600', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 28,
  },
  shareText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  homeButton: {
    borderWidth: 1, borderColor: '#444', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 12,
  },
  homeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
