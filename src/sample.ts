// Sample WODs for the New screen — one tap to load, then preview and save.
// Exercise names must match the canonical library in exercises.ts.

export interface SampleWorkout {
  name: string;
  blurb: string;
  csv: string;
}

const FULL_BODY_HIIT = `# workout: Full Body HIIT
# rounds: 2
# rest_between_rounds_sec: 120
exercise,duration_sec,rest_sec,target_reps,target_weight_lb
Concept2 Row,45,30,,
Kettlebell Goblet Squat,45,30,12,35
Dumbbell Floor Press,45,30,12,50
Box Step-Up,45,30,10,25
Barbell Deadlift,45,30,8,135
Pull-Up,45,30,8,
Two-Hand Kettlebell Swing,45,30,15,35
Dumbbell Push Press,45,30,10,40
Farmer Carry,45,30,,
Plank Shoulder Taps,45,30,20,
`;

const UPPER_BODY_PUMP = `# workout: Upper Body Pump
# rounds: 3
# rest_between_rounds_sec: 90
exercise,duration_sec,rest_sec,target_reps,target_weight_lb
Standard Push-Up,40,20,15,
Dumbbell Row,40,20,12,50
Shoulder Press,40,20,12,40
Bicep Curl,40,20,12,30
Tricep Extension,40,20,12,25
Diamond Push-Up,40,20,10,
Pull-Up,40,20,8,
`;

const LEG_DAY = `# workout: Leg Day
# rounds: 3
# rest_between_rounds_sec: 90
exercise,duration_sec,rest_sec,target_reps,target_weight_lb
Squat,45,20,15,
Lunge,45,20,12,
Jump Squat,30,20,,
Calf Raise,40,20,20,
Kettlebell Goblet Squat,45,20,12,35
Box Step-Up,45,20,10,25
`;

const CORE_CRUSHER = `# workout: Core Crusher
# rounds: 3
# rest_between_rounds_sec: 60
exercise,duration_sec,rest_sec,target_reps,target_weight_lb
Crunch,40,15,20,
Bicycle Crunch,40,15,20,
Plank,40,15,,
Side Plank,30,15,,
Mountain Climbers,40,15,,
Plank Shoulder Taps,40,15,20,
`;

const GAUNTLET_32 = `# workout: The Gauntlet (All 32)
# rounds: 1
# rest_between_rounds_sec: 0
exercise,duration_sec,rest_sec,target_reps,target_weight_lb
Burpees,30,15,,
Squat,30,15,15,
Standard Push-Up,30,15,12,
Dumbbell Row,30,15,10,50
Lunge,30,15,10,
Shoulder Press,30,15,10,40
Concept2 Row,30,15,,
Plank,30,15,,
Kettlebell Goblet Squat,30,15,10,35
Pull-Up,30,15,6,
Dumbbell Floor Press,30,15,10,50
Mountain Climbers,30,15,,
Barbell Deadlift,30,15,6,135
Bicep Curl,30,15,10,30
Box Step-Up,30,15,8,25
Tricep Extension,30,15,10,25
Two-Hand Kettlebell Swing,30,15,12,35
Crunch,30,15,15,
Dumbbell Push Press,30,15,8,40
Calf Raise,30,15,15,
Chin-Up,30,15,6,
Bicycle Crunch,30,15,15,
Jump Squat,30,15,,
Diamond Push-Up,30,15,8,
Farmer Carry,30,15,,
Side Plank,30,15,,
Decline Push-Up,30,15,10,
Reverse Grip Chin-Up,30,15,6,
Military Push-Up,30,15,10,
Wide Grip Pull-Up,30,15,6,
Wide Push-Up,30,15,10,
Plank Shoulder Taps,30,15,15,
`;

export const SAMPLES: SampleWorkout[] = [
  { name: 'Full Body HIIT', blurb: '10 stations · 2 rounds', csv: FULL_BODY_HIIT },
  { name: 'Upper Body Pump', blurb: '7 stations · 3 rounds', csv: UPPER_BODY_PUMP },
  { name: 'Leg Day', blurb: '6 stations · 3 rounds', csv: LEG_DAY },
  { name: 'Core Crusher', blurb: '6 stations · 3 rounds', csv: CORE_CRUSHER },
  { name: 'The Gauntlet', blurb: 'all 32 exercises · 1 round', csv: GAUNTLET_32 },
];
