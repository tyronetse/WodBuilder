// Timer-end alarm: four beeps, the last pitched higher.
// Pre-rendered in assets/audio/timer-end.mp3; played with a plain web Audio
// element. (Native note: when this app moves to iOS via EAS, swap this for
// expo-audio's useAudioPlayer — one file to change.)

import { useRef } from 'react';

const TIMER_END_URL: string = require('../assets/audio/timer-end.mp3');

export function useTimerEndSound(): () => void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  return () => {
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
