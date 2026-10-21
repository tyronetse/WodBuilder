// Workout sounds, generated live with WebAudio — no audio files to ship.
//
// Why WebAudio: iOS Safari refuses to play audio that a timer started
// unless the page's audio was unlocked by a tap first (the old <audio>
// element fired from the countdown interval, so the end-of-rest beep was
// silently blocked — worst case, since that's when the phone is down).
// Here a shared AudioContext is created/resumed on the first pointer tap
// anywhere in the app; once running, timer-fired beeps play reliably.
//
// Sounds: start of an exercise = two rising beeps ("go"); end of an
// exercise = the four-beep alarm, last beep pitched higher (same signature
// as Tyrone's Body Beast pages). Rest periods end by flowing straight
// into the next exercise, so the start cue IS the end-of-rest signal.

import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_KEY = 'wodbuilder.soundEnabled';
let soundEnabled = true;

export async function loadSoundEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SOUND_KEY);
    if (raw !== null) soundEnabled = raw === '1';
  } catch {
    // storage is a nice-to-have; default to on
  }
  return soundEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export async function setSoundEnabled(v: boolean): Promise<void> {
  soundEnabled = v;
  try {
    await AsyncStorage.setItem(SOUND_KEY, v ? '1' : '0');
  } catch {
    // ignore
  }
}

// ---- WebAudio engine (web only; a no-op elsewhere) ----

let actx: AudioContext | null = null;
let unlockHooked = false;

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!actx) actx = new AC();
    return actx;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') {
    void c.resume().catch(() => {});
  }
}

// Attach one-time tap listeners so the first touch anywhere in the app
// creates/resumes the context inside a real user gesture.
function hookUnlock(): void {
  if (unlockHooked || typeof document === 'undefined') return;
  unlockHooked = true;
  const onTap = () => unlockAudio();
  document.addEventListener('pointerdown', onTap);
  document.addEventListener('touchend', onTap);
}

function beep(
  c: AudioContext,
  freq: number,
  at: number,
  dur: number,
  peak = 0.5
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  gain.gain.setValueAtTime(peak, at + Math.max(0.01, dur - 0.02));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function play(pattern: Array<[freq: number, offset: number, dur: number]>): void {
  if (!isSoundEnabled()) return;
  hookUnlock();
  const c = getCtx();
  if (!c) return;
  unlockAudio();
  try {
    const t0 = c.currentTime + 0.02;
    for (const [freq, off, dur] of pattern) beep(c, freq, t0 + off, dur);
  } catch {
    // audio is a nice-to-have; never break the workout over it
  }
}

/** Start of an exercise: two rising beeps — "go". */
export function playStartSound(): void {
  play([
    [880, 0, 0.12],
    [1318, 0.18, 0.22],
  ]);
}

/** End of an exercise: four beeps, the last pitched higher. */
export function playEndSound(): void {
  play([
    [1568, 0, 0.14],
    [1568, 0.22, 0.14],
    [1568, 0.44, 0.14],
    [2093, 0.66, 0.32],
  ]);
}

/** Back-compat wrapper for existing call sites. */
export function useTimerEndSound(): () => void {
  return playEndSound;
}

// Hook the unlock listeners as soon as this module loads in the browser,
// so the very first tap (e.g. opening a workout) unlocks audio. The
// function self-guards for non-browser environments (static export).
hookUnlock();
