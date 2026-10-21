import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EXERCISE_NAMES } from '../src/exercises';
import { parseWorkoutCSV } from '../src/csv';
import { getWorkout, updateWorkoutCsv } from '../src/store';

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepVal}>
          {value}
          {unit}
        </Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PickExercises() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  // Ordered selection: exercises join the WOD in tap order, and the
  // "Workout order" list below lets the user move them up/down.
  const [order, setOrder] = useState<string[]>([]);
  const [rounds, setRounds] = useState(2);
  const [workSec, setWorkSec] = useState(45);
  const [restSec, setRestSec] = useState(30);
  const [roundRestSec, setRoundRestSec] = useState(120);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  // Two-step flow: step 1 picks exercises, step 2 arranges the workout order.
  const [step, setStep] = useState<1 | 2>(1);
  const [origTargets, setOrigTargets] = useState<
    Record<string, { reps?: number; weight?: number }>
  >({});

  // Edit mode: pre-fill from a saved workout (its exercises in saved order,
  // steppers from its first exercise — per-exercise times still live in the
  // CSV editor for those who want them).
  useEffect(() => {
    if (!params.workoutId) return;
    (async () => {
      const w = await getWorkout(params.workoutId!);
      if (!w) return;
      try {
        const def = parseWorkoutCSV(w.csv);
        setOrder(def.exercises.map((e) => e.name));
        setRounds(def.rounds);
        setRoundRestSec(def.restBetweenRoundsSec);
        if (def.exercises[0]) {
          setWorkSec(def.exercises[0].durationSec);
          setRestSec(def.exercises[0].restSec);
        }
        const targets: Record<string, { reps?: number; weight?: number }> = {};
        for (const e of def.exercises) {
          if (e.targetReps != null || e.targetWeightLb != null) {
            targets[e.name] = { reps: e.targetReps, weight: e.targetWeightLb };
          }
        }
        setOrigTargets(targets);
        setEditingId(w.id);
        setEditingName(def.name);
      } catch {
        // unparseable saved CSV — leave defaults; CSV editor can fix it
      }
    })();
  }, [params.workoutId]);

  const toggle = (name: string) => {
    setOrder((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectAll = () => setOrder([...EXERCISE_NAMES]);
  const clearAll = () => setOrder([]);

  // Nothing left to arrange — fall back to the pick step.
  useEffect(() => {
    if (order.length === 0 && step === 2) setStep(1);
  }, [order.length, step]);

  const move = (index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const generate = () => {
    if (order.length === 0) return;
    const lines = [
      `# workout: ${editingId ? editingName : 'Custom WOD'}`,
      `# rounds: ${rounds}`,
      `# rest_between_rounds_sec: ${roundRestSec}`,
      'exercise,duration_sec,rest_sec,target_reps,target_weight_lb',
      ...order.map((n) => {
        const t = origTargets[n];
        return `${n},${workSec},${restSec},${t?.reps ?? ''},${t?.weight ?? ''}`;
      }),
    ];
    const csv = lines.join('\n');
    if (editingId) {
      updateWorkoutCsv(editingId, csv).then(() => router.back());
    } else {
      router.push({ pathname: '/new', params: { csv } });
    }
  };

  if (step === 2) {
    return (
      <View style={styles.root}>
        {editingId ? (
          <Text style={styles.editingBanner}>
            Editing “{editingName}” — arrange the order, then Save changes.
          </Text>
        ) : null}
        <Text style={styles.orderScreenTitle}>Workout order</Text>
        <Text style={styles.orderScreenSub}>
          {rounds} rounds · {workSec}s work / {restSec}s rest · {roundRestSec}s between rounds
        </Text>
        <FlatList
          data={order}
          keyExtractor={(n) => n}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.orderRow}>
              <Text style={styles.orderNum}>{index + 1}.</Text>
              <Text style={styles.orderName}>{item}</Text>
              <View style={styles.orderBtns}>
                <TouchableOpacity
                  style={[styles.orderBtn, index === 0 && styles.orderBtnDisabled]}
                  onPress={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <Text style={styles.orderBtnText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.orderBtn,
                    index === order.length - 1 && styles.orderBtnDisabled,
                  ]}
                  onPress={() => move(index, 1)}
                  disabled={index === order.length - 1}
                >
                  <Text style={styles.orderBtnText}>↓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.orderBtn}
                  onPress={() => toggle(item)}
                >
                  <Text style={styles.orderBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Text style={styles.backText}>← Back to exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.generateButton} onPress={generate}>
          <Text style={styles.generateText}>
            {editingId ? 'Save changes' : `Generate WOD (${order.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
          <Text style={styles.homeText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {editingId ? (
        <Text style={styles.editingBanner}>
          Editing “{editingName}” — pick exercises, then tap Next to arrange the order.
        </Text>
      ) : null}
      <View style={styles.steppers}>
        <Stepper label="Rounds" value={rounds} unit="" min={1} max={10} step={1} onChange={setRounds} />
        <Stepper label="Work" value={workSec} unit="s" min={10} max={300} step={5} onChange={setWorkSec} />
        <Stepper label="Rest" value={restSec} unit="s" min={0} max={180} step={5} onChange={setRestSec} />
        <Stepper label="Round rest" value={roundRestSec} unit="s" min={0} max={600} step={15} onChange={setRoundRestSec} />
      </View>

      <View style={styles.selectRow}>
        <TouchableOpacity onPress={selectAll}>
          <Text style={styles.selectAction}>Select all</Text>
        </TouchableOpacity>
        <Text style={styles.count}>
          {order.length} of {EXERCISE_NAMES.length} selected
        </Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.selectAction}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={EXERCISE_NAMES}
        keyExtractor={(n) => n}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const checked = order.includes(item);
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
              <View style={[styles.box, checked && styles.boxChecked]}>
                {checked ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <Text style={styles.name}>{item}</Text>
              {checked ? (
                <Text style={styles.orderTag}>#{order.indexOf(item) + 1}</Text>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.generateButton, order.length === 0 && styles.generateDisabled]}
        onPress={() => setStep(2)}
        disabled={order.length === 0}
      >
        <Text style={styles.generateText}>
          Next: Workout order{order.length > 0 ? ` (${order.length})` : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
        <Text style={styles.homeText}>Back to home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 16 },
  editingBanner: {
    color: '#4cd964', fontSize: 14, fontWeight: 'bold', marginBottom: 10,
  },
  steppers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  stepper: {
    backgroundColor: '#141414', borderRadius: 10, padding: 8, flex: 1, minWidth: 100,
  },
  stepperLabel: { color: '#999', fontSize: 12, marginBottom: 4, textAlign: 'center' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    backgroundColor: '#2a2a2a', borderRadius: 8, width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  stepVal: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  selectRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  selectAction: { color: '#e10600', fontSize: 14, fontWeight: 'bold' },
  count: { color: '#888', fontSize: 13 },
  list: { paddingBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  box: {
    width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: '#555',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  boxChecked: { backgroundColor: '#e10600', borderColor: '#e10600' },
  check: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  name: { color: '#fff', fontSize: 16, flex: 1 },
  orderTag: { color: '#e10600', fontSize: 14, fontWeight: 'bold' },
  orderScreenTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  orderScreenSub: { color: '#888', fontSize: 13, marginBottom: 10 },
  backButton: { padding: 12, alignItems: 'center', marginTop: 4 },
  backText: { color: '#e10600', fontSize: 15, fontWeight: 'bold' },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  orderNum: { color: '#888', fontSize: 14, width: 28 },
  orderName: { color: '#fff', fontSize: 15, flex: 1 },
  orderBtns: { flexDirection: 'row', gap: 6 },
  orderBtn: {
    backgroundColor: '#2a2a2a', borderRadius: 8, width: 34, height: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  orderBtnDisabled: { opacity: 0.3 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  generateButton: {
    backgroundColor: '#e10600', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  generateDisabled: { backgroundColor: '#3a3a3a' },
  generateText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  homeButton: { padding: 14, alignItems: 'center', marginTop: 4 },
  homeText: { color: '#888', fontSize: 15 },
});
