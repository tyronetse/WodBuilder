// Turns a parsed workout into a flat, timed phase sequence the player walks
// through: work -> rest -> work -> rest ... -> round rest -> ... -> done.

import { WorkoutDefinition } from './csv';
import { getVideoForExercise } from './exercises';

export type Phase =
  | {
      kind: 'work';
      round: number;
      exerciseIndex: number;
      name: string;
      durationSec: number;
      targetReps?: number;
      targetWeightLb?: number;
      video: any | null;
    }
  | { kind: 'rest'; durationSec: number; nextName: string }
  | { kind: 'roundRest'; durationSec: number; nextRound: number }
  | { kind: 'done' };

export function buildPhases(w: WorkoutDefinition): Phase[] {
  const phases: Phase[] = [];
  for (let r = 1; r <= w.rounds; r++) {
    w.exercises.forEach((ex, i) => {
      phases.push({
        kind: 'work',
        round: r,
        exerciseIndex: i,
        name: ex.name,
        durationSec: ex.durationSec,
        targetReps: ex.targetReps,
        targetWeightLb: ex.targetWeightLb,
        video: getVideoForExercise(ex.name),
      });
      if (i < w.exercises.length - 1) {
        phases.push({
          kind: 'rest',
          durationSec: ex.restSec,
          nextName: w.exercises[i + 1].name,
        });
      }
    });
    if (r < w.rounds) {
      phases.push({ kind: 'roundRest', durationSec: w.restBetweenRoundsSec, nextRound: r + 1 });
    }
  }
  phases.push({ kind: 'done' });
  return phases;
}

export function estimateTotalSec(w: WorkoutDefinition): number {
  const perRound = w.exercises.reduce((s, e) => s + e.durationSec + e.restSec, 0);
  return perRound * w.rounds + w.restBetweenRoundsSec * Math.max(0, w.rounds - 1);
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
