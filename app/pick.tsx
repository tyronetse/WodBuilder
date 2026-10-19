import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { EXERCISE_NAMES } from '../src/exercises';

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rounds, setRounds] = useState(2);
  const [workSec, setWorkSec] = useState(45);
  const [restSec, setRestSec] = useState(30);
  const [roundRestSec, setRoundRestSec] = useState(120);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(EXERCISE_NAMES));
  const clearAll = () => setSelected(new Set());

  const generate = () => {
    const names = EXERCISE_NAMES.filter((n) => selected.has(n));
    if (names.length === 0) return;
    const lines = [
      '# workout: Custom WOD',
      `# rounds: ${rounds}`,
      `# rest_between_rounds_sec: ${roundRestSec}`,
      'exercise,duration_sec,rest_sec,target_reps,target_weight_lb',
      ...names.map((n) => `${n},${workSec},${restSec},,`),
    ];
    router.push({ pathname: '/new', params: { csv: lines.join('\n') } });
  };

  return (
    <View style={styles.root}>
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
          {selected.size} of {EXERCISE_NAMES.length} selected
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
          const checked = selected.has(item);
          return (
            <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
              <View style={[styles.box, checked && styles.boxChecked]}>
                {checked ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <Text style={styles.name}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.generateButton, selected.size === 0 && styles.generateDisabled]}
        onPress={generate}
        disabled={selected.size === 0}
      >
        <Text style={styles.generateText}>
          Generate WOD{selected.size > 0 ? ` (${selected.size})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 16 },
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
  name: { color: '#fff', fontSize: 16 },
  generateButton: {
    backgroundColor: '#e10600', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  generateDisabled: { backgroundColor: '#3a3a3a' },
  generateText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
