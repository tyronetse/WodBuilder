// Parser for the WodBuilder workout CSV format.
//
//   # workout: Full Body HIIT
//   # rounds: 2
//   # rest_between_rounds_sec: 120
//   exercise,duration_sec,rest_sec,target_reps,target_weight_lb
//   Kettlebell Goblet Squat,45,30,12,35
//
// Lines starting with # are workout setup (key: value). The first other line
// is the header; exercise, duration_sec and rest_sec are required,
// target_reps and target_weight_lb are optional.

export interface WorkoutExercise {
  name: string;
  durationSec: number;
  restSec: number;
  targetReps?: number;
  targetWeightLb?: number;
}

export interface WorkoutDefinition {
  name: string;
  rounds: number;
  restBetweenRoundsSec: number;
  exercises: WorkoutExercise[];
}

function splitCSVRow(row: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function num(raw: string | undefined, col: string, lineNo: number): number {
  const v = Number((raw ?? '').trim());
  if (!Number.isFinite(v) || v < 0) {
    throw new Error(`Line ${lineNo}: "${col}" must be a positive number.`);
  }
  return v;
}

export function parseWorkoutCSV(text: string): WorkoutDefinition {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const meta: Record<string, string> = {};
  const rows: string[] = [];
  for (const line of lines) {
    if (line.startsWith('#')) {
      const body = line.slice(1).trim();
      const idx = body.indexOf(':');
      if (idx > 0) {
        meta[body.slice(0, idx).trim().toLowerCase()] = body.slice(idx + 1).trim();
      }
      continue;
    }
    rows.push(line);
  }

  if (rows.length < 2) {
    throw new Error('CSV needs a header row plus at least one exercise row.');
  }

  const header = splitCSVRow(rows[0]).map((h) => h.trim().toLowerCase());
  for (const need of ['exercise', 'duration_sec', 'rest_sec']) {
    if (!header.includes(need)) throw new Error(`Missing required column: ${need}`);
  }
  const ix = (name: string) => header.indexOf(name);

  const exercises: WorkoutExercise[] = [];
  for (let i = 1; i < rows.length; i++) {
    const lineNo = i + 1;
    const cols = splitCSVRow(rows[i]);
    const name = (cols[ix('exercise')] ?? '').trim();
    if (!name) continue;
    const ex: WorkoutExercise = {
      name,
      durationSec: num(cols[ix('duration_sec')], 'duration_sec', lineNo),
      restSec: num(cols[ix('rest_sec')], 'rest_sec', lineNo),
    };
    if (ix('target_reps') >= 0 && (cols[ix('target_reps')] ?? '').trim() !== '') {
      ex.targetReps = num(cols[ix('target_reps')], 'target_reps', lineNo);
    }
    if (ix('target_weight_lb') >= 0 && (cols[ix('target_weight_lb')] ?? '').trim() !== '') {
      ex.targetWeightLb = num(cols[ix('target_weight_lb')], 'target_weight_lb', lineNo);
    }
    exercises.push(ex);
  }

  if (exercises.length === 0) throw new Error('No exercises found in the CSV.');

  const rounds = meta['rounds'] ? parseInt(meta['rounds'], 10) : 1;
  const restBetween = meta['rest_between_rounds_sec']
    ? parseInt(meta['rest_between_rounds_sec'], 10)
    : 60;
  if (!Number.isFinite(rounds) || rounds < 1) throw new Error('# rounds must be 1 or more.');

  return {
    name: meta['workout'] || 'Untitled WOD',
    rounds,
    restBetweenRoundsSec: Number.isFinite(restBetween) && restBetween >= 0 ? restBetween : 60,
    exercises,
  };
}
