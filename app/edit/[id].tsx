import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getWorkout, updateWorkoutCsv } from '../../src/store';
import { parseWorkoutCSV } from '../../src/csv';
import { findUnknownExercises } from '../../src/exercises';

export default function EditCsv() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [original, setOriginal] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const w = await getWorkout(id);
      if (w) {
        setOriginal(w.csv);
        setText(w.csv);
      } else {
        router.back();
      }
    })();
  }, [id]);

  const clearNotices = () => {
    setError(null);
    setWarning(null);
  };

  const onReset = () => {
    setText(original ?? '');
    setConfirmSave(false);
    clearNotices();
  };

  const onSave = async () => {
    if (saving) return;
    clearNotices();
    let names: string[];
    try {
      const def = parseWorkoutCSV(text);
      names = def.exercises.map((e) => e.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid CSV.');
      setConfirmSave(false);
      return;
    }
    const unknown = findUnknownExercises(names);
    if (unknown.length > 0 && !confirmSave) {
      setWarning(
        `No video for: ${unknown.join(', ')} — the timer still works, with a placeholder card. Tap Save again to keep them.`,
      );
      setConfirmSave(true);
      return;
    }
    setSaving(true);
    const res = await updateWorkoutCsv(id, text);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      setConfirmSave(false);
      return;
    }
    router.back();
  };

  if (original === null) {
    return (
      <View style={styles.root}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  const dirty = text !== original;

  return (
    <View style={styles.root}>
      <TextInput
        style={styles.editor}
        value={text}
        onChangeText={(t) => {
          setText(t);
          setConfirmSave(false);
          clearNotices();
        }}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {warning ? <Text style={styles.warning}>{warning}</Text> : null}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.ghostButton, !dirty && styles.disabled]}
          onPress={onReset}
          disabled={!dirty}
        >
          <Text style={[styles.ghostText, !dirty && styles.disabledText]}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.ghostButton]} onPress={() => router.back()}>
          <Text style={styles.ghostText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, (!dirty || saving) && styles.disabled]}
          onPress={onSave}
          disabled={!dirty || saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      {!dirty ? (
        <Text style={styles.hint}>No changes yet — edit the CSV above, then Save.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 16 },
  loading: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
  editor: {
    flex: 1,
    backgroundColor: '#141414',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  error: { color: '#ff6b60', fontSize: 14, marginTop: 10, lineHeight: 20 },
  warning: { color: '#ffcc00', fontSize: 14, marginTop: 10, lineHeight: 20 },
  row: { flexDirection: 'row', marginTop: 12, gap: 10 },
  button: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  ghostButton: { borderWidth: 1, borderColor: '#555' },
  ghostText: { color: '#ccc', fontSize: 16, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#4cd964' },
  saveText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  disabled: { opacity: 0.35 },
  disabledText: { color: '#777' },
  hint: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
