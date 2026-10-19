// Timer-end alarm: four beeps, the last pitched higher.
// Pre-rendered in assets/audio/timer-end.mp3; played with a plain web Audio
// element. (Native note: when this app moves to iOS via EAS, swap this for
// expo-audio's useAudioPlayer — one file to change.)

import { useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_END_URL: string = require('../assets/audio/timer-end.mp3');

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

export function useTimerEndSound(): () => void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  return () => {
    if (!isSoundEnabled()) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(TIMER_END_URL);
      }
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } catch {
      // audio is a nice-to-have; never break the workout over it
    }
  };
}
