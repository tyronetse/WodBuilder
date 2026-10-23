import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getAllHistory,
  listWorkouts,
  HistoryEntry,
} from '../src/store';

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatWhen(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        const [all, workouts] = await Promise.all([
          getAllHistory(),
          listWorkouts(),
        ]);
        if (!live) return;
        const map: Record<string, string> = {};
        for (const w of workouts) map[w.id] = w.name;
        setNames(map);
        setEntries(all);
      })();
      return () => {
        live = false;
      };
    }, [])
  );

  if (entries === null) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color="#e10600" size="large" />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.root}>
        <Text style={styles.emptyTitle}>No completed workouts yet</Text>
        <Text style={styles.emptyBody}>
          Finish a workout and it will show up here — every set, rep, and
          weight you logged.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={entries}
        keyExtractor={(e) => `${e.workoutId}-${e.completedAt}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const key = `${item.workoutId}-${item.completedAt}`;
          const open = expanded === key;
          return (
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => setExpanded(open ? null : key)}
              >
                <Text style={styles.cardName}>
                  {names[item.workoutId] ?? 'Deleted workout'}
                </Text>
                <Text style={styles.cardMeta}>
                  {formatWhen(item.completedAt)}
                </Text>
                <Text style={styles.cardMeta}>
                  {formatClock(item.durationSec)} · {item.sets.length} sets
                  {open ? '  ▴' : '  ▾'}
                </Text>
              </TouchableOpacity>
              {open
                ? item.sets.map((s, i) => (
                    <Text key={i} style={styles.setRow}>
                      R{s.round} · {s.name}
                      {s.reps != null ? ` · ${s.reps} reps` : ''}
                      {s.weightLb != null ? ` · ${s.weightLb} lb` : ''}
                    </Text>
                  ))
                : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 16 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardName: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  cardMeta: { color: '#999', fontSize: 14, marginTop: 4 },
  setRow: { color: '#ddd', fontSize: 14, marginTop: 6 },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
  },
  emptyBody: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
});
