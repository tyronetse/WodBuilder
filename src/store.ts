// Local persistence: the WOD library and per-workout session history.
// Backed by AsyncStorage so it works on web today and native tomorrow.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseWorkoutCSV } from './csv';
import { estimateTotalSec } from './engine';

export interface StoredWorkout {
  id: string;
  name: string;
  rounds: number;
  exerciseCount: number;
  estSec: number;
  createdAt: number;
  lastDoneAt?: number;
  csv: string;
}

export interface SetLog {
  name: string;
  round: number;
  reps?: number;
  weightLb?: number;
}

export interface SessionLog {
  completedAt: number;
  durationSec: number;
  sets: SetLog[];
}

const WORKOUTS_KEY = 'wodbuilder.workouts.v1';
const HISTORY_KEY = 'wodbuilder.history.v1';

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function listWorkouts(): Promise<StoredWorkout[]> {
  const items = await readJSON<StoredWorkout[]>(WORKOUTS_KEY, []);
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getWorkout(id: string): Promise<StoredWorkout | null> {
  const items = await listWorkouts();
  return items.find((w) => w.id === id) ?? null;
}

export async function saveWorkout(csv: string): Promise<StoredWorkout> {
  const def = parseWorkoutCSV(csv); // throws on bad input
  const workout: StoredWorkout = {
    id: Date.now().toString(36),
    name: def.name,
    rounds: def.rounds,
    exerciseCount: def.exercises.length,
    estSec: estimateTotalSec(def),
    createdAt: Date.now(),
    csv,
  };
  const items = await listWorkouts();
  items.unshift(workout);
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(items));
  return workout;
}

export async function deleteWorkout(id: string): Promise<void> {
  const items = await listWorkouts();
  await AsyncStorage.setItem(
    WORKOUTS_KEY,
    JSON.stringify(items.filter((w) => w.id !== id)),
  );
}

export async function renameWorkout(id: string, name: string): Promise<void> {
  const clean = name.trim();
  if (!clean) return;
  const items = await listWorkouts();
  const w = items.find((x) => x.id === id);
  if (w) {
    w.name = clean;
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(items));
  }
}

export async function logSession(
  workoutId: string,
  sets: SetLog[],
  durationSec: number,
): Promise<void> {
  const history = await readJSON<Record<string, SessionLog[]>>(HISTORY_KEY, {});
  const entry: SessionLog = { completedAt: Date.now(), durationSec, sets };
  history[workoutId] = [entry, ...(history[workoutId] ?? [])].slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  const items = await listWorkouts();
  const w = items.find((x) => x.id === workoutId);
  if (w) {
    w.lastDoneAt = Date.now();
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(items));
  }
}

export async function getHistory(workoutId: string): Promise<SessionLog[]> {
  const history = await readJSON<Record<string, SessionLog[]>>(HISTORY_KEY, {});
  return history[workoutId] ?? [];
}
