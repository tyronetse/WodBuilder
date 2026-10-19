// Canonical exercise library. The `exercise` column of an imported CSV must
// match one of these names (case-insensitive) for its demo video to play.
// Videos live in assets/videos/ and are bundled with the app.

const VIDEO_MAP: Record<string, any> = {
  'Bicep Curl': require('../assets/videos/bicep-curl.mp4'),
  'Bicycle Crunch': require('../assets/videos/bicycle-crunch.mp4'),
  'Burpees': require('../assets/videos/burpees.mp4'),
  'Calf Raise': require('../assets/videos/calf-raise.mp4'),
  'Chin-Up': require('../assets/videos/chin-up.mp4'),
  'Crunch': require('../assets/videos/crunch.mp4'),
  'Decline Push-Up': require('../assets/videos/decline-push-up.mp4'),
  'Diamond Push-Up': require('../assets/videos/diamond-push-up.mp4'),
  'Dumbbell Row': require('../assets/videos/dumbbell-row.mp4'),
  'Jump Squat': require('../assets/videos/jump-squat.mp4'),
  'Lunge': require('../assets/videos/lunge.mp4'),
  'Military Push-Up': require('../assets/videos/military-push-up.mp4'),
  'Mountain Climbers': require('../assets/videos/mountain-climbers.mp4'),
  'Plank': require('../assets/videos/plank.mp4'),
  'Pull-Up': require('../assets/videos/pull-up.mp4'),
  'Reverse Grip Chin-Up': require('../assets/videos/reverse-grip-chin-up.mp4'),
  'Shoulder Press': require('../assets/videos/shoulder-press.mp4'),
  'Side Plank': require('../assets/videos/side-plank.mp4'),
  'Squat': require('../assets/videos/squat.mp4'),
  'Standard Push-Up': require('../assets/videos/standard-push-up.mp4'),
  'Tricep Extension': require('../assets/videos/tricep-extension.mp4'),
  'Wide Grip Pull-Up': require('../assets/videos/wide-grip-pull-up.mp4'),
  'Wide Push-Up': require('../assets/videos/wide-push-up.mp4'),
  'Concept2 Row': require('../assets/videos/concept2-row.mp4'),
  'Kettlebell Goblet Squat': require('../assets/videos/kettlebell-goblet-squat.mp4'),
  'Dumbbell Floor Press': require('../assets/videos/dumbbell-floor-press.mp4'),
  'Box Step-Up': require('../assets/videos/box-step-up.mp4'),
  'Barbell Deadlift': require('../assets/videos/barbell-deadlift.mp4'),
  'Two-Hand Kettlebell Swing': require('../assets/videos/two-hand-kettlebell-swing.mp4'),
  'Dumbbell Push Press': require('../assets/videos/dumbbell-push-press.mp4'),
  'Farmer Carry': require('../assets/videos/farmer-carry.mp4'),
  'Plank Shoulder Taps': require('../assets/videos/plank-shoulder-taps.mp4'),
};

export const EXERCISE_NAMES: string[] = Object.keys(VIDEO_MAP);

function canonical(name: string): string | null {
  const want = name.trim().toLowerCase();
  return EXERCISE_NAMES.find((n) => n.toLowerCase() === want) ?? null;
}

/** Bundled demo video for an exercise name, or null when the name is unknown. */
export function getVideoForExercise(name: string): any | null {
  const key = canonical(name);
  return key ? VIDEO_MAP[key] : null;
}

/** Exercise names from a CSV that have no video in the library. */
export function findUnknownExercises(names: string[]): string[] {
  return names.filter((n) => canonical(n) === null);
}
