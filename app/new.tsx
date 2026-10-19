import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { parseWorkoutCSV, WorkoutDefinition } from '../src/csv';
import { findUnknownExercises } from '../src/exercises';
import { saveWorkout } from '../src/store';
import { formatClock, estimateTotalSec } from '../src/engine';
import { SAMPLES } from '../src/sample';

const AI_PROMPT = `Write me a WodBuilder workout CSV with this exact format:

# workout: <workout name>
# rounds: <number>
# rest_between_rounds_sec: <seconds>
exercise,duration_sec,rest_sec,target_reps,target_weight_lb
<one row per exercise, e.g. Kettlebell Goblet Squat,45,30,12,35>

Rules:
- Only use these exercise names: Bicep Curl, Bicycle Crunch, Burpees, Calf Raise, Chin-Up, Crunch, Decline Push-Up, Diamond Push-Up, Dumbbell Row, Jump Squat, Lunge, Military Push-Up, Mountain Climbers, Plank, Pull-Up, Reverse Grip Chin-Up, Shoulder Press, Side Plank, Squat, Standard Push-Up, Tricep Extension, Wide Grip Pull-Up, Wide Push-Up, Concept2 Row, Kettlebell Goblet Squat, Dumbbell Floor Press, Box Step-Up, Barbell Deadlift, Two-Hand Kettlebell Swing, Dumbbell Push Press, Farmer Carry, Plank Shoulder Taps, Single Unders, Double Unders, Box Jump, Broad Jump, Run, Handstand Push-Up, Handstand Box Push-Up, Barbell Bench Press
- Make it a 30-minute full-body HIIT: 2 rounds, 45 seconds work / 30 seconds rest per exercise, 120 seconds rest between rounds
- Include target reps and target weight in pounds where it makes sense
- Reply with only the CSV, no explanations`;

export default function NewWorkout() {
  const params = useLocalSearchParams<{ csv?: string }>();
  const [csv, setCsv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<WorkoutDefinition | null>(null);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const onCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can still select the text manually
    }
  };

  // Accept a pre-built CSV (e.g. from the exercise picker).
  useEffect(() => {
    if (typeof params.csv === 'string' && params.csv.length > 0) {
      setCsv(params.csv);
      setPreview(null);
      setError(null);
    }
  }, [params.csv]);

  const onPreview = () => {
    try {
      const def = parseWorkoutCSV(csv);
      setPreview(def);
      setUnknown(findUnknownExercises(def.exercises.map((e) => e.name)));
      setError(null);
    } catch (e: any) {
      setPreview(null);
      setError(e?.message ?? 'Could not parse that CSV.');
    }
  };

  const onSave = async () => {
    if (!preview) return;
    try {
      await saveWorkout(csv);
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Could not save.');
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Paste your workout CSV</Text>
      <TextInput
        style={styles.input}
        multiline
        value={csv}
        onChangeText={(t) => {
          setCsv(t);
          setPreview(null);
          setError(null);
        }}
        placeholder={'# workout: Full Body HIIT\n# rounds: 2\n# rest_between_rounds_sec: 120\nexercise,duration_sec,rest_sec,target_reps,target_weight_lb\n...'}
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.samplesLabel}>Or start from a sample:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
      >
        {SAMPLES.map((s) => (
          <TouchableOpacity
            key={s.name}
            style={styles.chip}
            onPress={() => {
              setCsv(s.csv);
              setPreview(null);
              setError(null);
            }}
          >
            <Text style={styles.chipName}>{s.name}</Text>
            <Text style={styles.chipBlurb}>{s.blurb}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.previewButton} onPress={onPreview}>
        <Text style={styles.previewText}>Preview</Text>
      </TouchableOpacity>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Don't have a CSV? Ask Muse AI to write one.</Text>
        <Text style={styles.tipBody}>
          Paste the prompt below into Muse (muse.ai), copy the CSV it gives you, and paste it into the
          box above. Edit the workout description to fit your own equipment and goals.
        </Text>
        <Text style={styles.promptBox}>{AI_PROMPT}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={onCopyPrompt}>
          <Text style={styles.copyText}>{copied ? 'Copied ✓' : 'Copy prompt'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {preview ? (
        <View style={styles.card}>
          <Text style={styles.cardName}>{preview.name}</Text>
          <Text style={styles.cardMeta}>
            {preview.rounds} {preview.rounds === 1 ? 'round' : 'rounds'} · {preview.exercises.length} exercises · ~
            {formatClock(estimateTotalSec(preview))} · {preview.restBetweenRoundsSec}s between rounds
          </Text>
          {unknown.length > 0 ? (
            <Text style={styles.warn}>
              No video for: {unknown.join(', ')} — the timer still works, with a placeholder card.
            </Text>
          ) : (
            <Text style={styles.ok}>All {preview.exercises.length} exercises have demo videos.</Text>
          )}
          {preview.exercises.map((e, i) => (
            <Text key={i} style={styles.exRow}>
              {i + 1}. {e.name} — {e.durationSec}s work / {e.restSec}s rest
              {e.targetReps ? ` · ${e.targetReps} reps` : ''}
              {e.targetWeightLb ? ` · ${e.targetWeightLb} lb` : ''}
            </Text>
          ))}
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveText}>Save to library</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  content: { padding: 16, paddingBottom: 48 },
  label: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: {
    backgroundColor: '#141414',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    minHeight: 220,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  samplesLabel: { color: '#999', fontSize: 14, marginTop: 16, marginBottom: 8 },
  chipsContent: { gap: 10, paddingRight: 16 },
  chip: {
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#333',
    borderRadius: 12, padding: 12, minWidth: 140,
  },
  chipName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  chipBlurb: { color: '#888', fontSize: 12, marginTop: 2 },
  previewButton: {
    backgroundColor: '#e10600', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  previewText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#ff6b6b', marginTop: 12, fontSize: 14 },
  card: { backgroundColor: '#141414', borderRadius: 12, padding: 16, marginTop: 16 },
  cardName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  cardMeta: { color: '#ccc', fontSize: 14, marginBottom: 8 },
  warn: { color: '#ffcc00', fontSize: 14, marginBottom: 8 },
  ok: { color: '#4cd964', fontSize: 14, marginBottom: 8 },
  exRow: { color: '#ddd', fontSize: 14, marginTop: 4 },
  saveButton: {
    backgroundColor: '#4cd964', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16,
  },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  tipCard: {
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#333',
    borderRadius: 12, padding: 16, marginTop: 16,
  },
  tipTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  tipBody: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  promptBox: {
    backgroundColor: '#0a0a0a', color: '#ddd', borderRadius: 8, padding: 12,
    fontSize: 12, lineHeight: 18, fontFamily: 'monospace', marginBottom: 12,
  },
  copyButton: {
    backgroundColor: '#333', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  copyText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
