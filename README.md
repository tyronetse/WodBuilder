# WodBuilder

Build-a-workout app: paste a workout CSV, get a timed WOD with AI demo videos,
per-exercise timers, rep/weight logging, and a shareable result card.
Expo (React Native) — runs on web today, iPhone via EAS Build tomorrow.

Live: https://tyronetse.github.io/WodBuilder

## The workout CSV format

```csv
# workout: Full Body HIIT
# rounds: 2
# rest_between_rounds_sec: 120
exercise,duration_sec,rest_sec,target_reps,target_weight_lb
Kettlebell Goblet Squat,45,30,12,35
Pull-Up,45,30,8,
```

- Lines starting with `#` are workout setup: `workout`, `rounds`, `rest_between_rounds_sec`.
- Header row: `exercise`, `duration_sec`, `rest_sec` required; `target_reps`, `target_weight_lb` optional.
- The `exercise` name must match the video library in `src/exercises.ts`
  (case-insensitive). Unknown names still work — the timer runs with a placeholder card,
  and the importer flags them.
- Ask Muse: "I have [equipment], give me a WodBuilder CSV: 10 exercises, 2 rounds,
  45s work / 30s rest" — paste the result into **+ New WOD from CSV**.

## Local development

```sh
npm install
npx expo start --web
```

## Deploy to GitHub Pages

```sh
npm install        # once
npm run deploy     # builds the web app and pushes dist/ to the gh-pages branch
```

Then in the repo: **Settings → Pages → Deploy from a branch → gh-pages → / (root)**.
The site serves from `https://tyronetse.github.io/WodBuilder`.

## Adding exercise videos

1. Drop the mp4 into `assets/videos/` (1280×720 H.264, ~10s, kebab-case name).
2. Add one line to `VIDEO_MAP` in `src/exercises.ts`.
3. The CSV `exercise` name must match the map key.

## Project layout

- `app/` — screens (Expo Router): library home, CSV importer, workout player
- `src/csv.ts` — CSV parser · `src/engine.ts` — phase/timer engine
- `src/exercises.ts` — canonical exercise → video map · `src/store.ts` — local library + history
- `assets/videos/` — 32 bundled AI demo videos · `assets/audio/` — timer-end alarm
