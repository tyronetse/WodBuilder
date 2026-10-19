import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { listWorkouts, deleteWorkout, StoredWorkout } from '../src/store';
import { formatClock } from '../src/engine';

function lastDoneLabel(ts?: number): string {
  if (!ts) return 'Not done yet';
  const d = new Date(ts);
  return `Last done ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export default function Library() {
  const [items, setItems] = useState<StoredWorkout[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(() => {
    (async () => setItems(await listWorkouts()))();
  }, []);
  useFocusEffect(refresh);

  const onDelete = async (id: string) => {
    if (confirmDelete === id) {
      await deleteWorkout(id);
      setConfirmDelete(null);
      refresh();
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((cur) => (cur === id ? null : cur)), 3000);
    }
  };

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.newButton} onPress={() => router.push('/new')}>
        <Text style={styles.newButtonText}>+ New WOD from CSV</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptyBody}>
            Ask Muse for a workout CSV built around your equipment, paste it in, and it lands here with demo videos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(w) => w.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.id } })}
              >
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.rounds} {item.rounds === 1 ? 'round' : 'rounds'} · {item.exerciseCount} exercises · ~{formatClock(item.estSec)}
                </Text>
                <Text style={styles.cardMetaDim}>{lastDoneLabel(item.lastDoneAt)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
                <Text style={styles.deleteText}>{confirmDelete === item.id ? 'Sure?' : '✕'}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 16 },
  newButton: {
    backgroundColor: '#e10600',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  newButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyBody: { color: '#999', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  list: { paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardMain: { flex: 1, padding: 16 },
  cardName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardMeta: { color: '#ccc', fontSize: 14, marginBottom: 2 },
  cardMetaDim: { color: '#777', fontSize: 13 },
  deleteButton: { justifyContent: 'center', paddingHorizontal: 18 },
  deleteText: { color: '#e10600', fontSize: 18, fontWeight: 'bold' },
});
