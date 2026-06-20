// useTimer — a countdown (or count-up) timer driven by a 1-second interval.
//
// For timed exams it counts down from `initialSeconds` and invokes `onExpire`
// exactly once when it reaches zero. The hook is pause/resume aware and reports
// the live remaining seconds so the store can persist it for resume-after-refresh.

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  /** When false the timer does not run (e.g. untimed practice mode). */
  active: boolean;
  /** Called once when the countdown hits zero. */
  onExpire?: () => void;
  /** Called every tick with the new remaining value (for persistence). */
  onTick?: (remaining: number) => void;
}

export function useTimer({ initialSeconds, active, onExpire, onTick }: UseTimerOptions) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [paused, setPaused] = useState(false);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);

  // Keep the latest callbacks without restarting the interval.
  useEffect(() => {
    onExpireRef.current = onExpire;
    onTickRef.current = onTick;
  }, [onExpire, onTick]);

  // Re-seed when the configured duration changes (e.g. a new exam starts).
  useEffect(() => {
    setRemaining(initialSeconds);
    expiredRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (!active || paused) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          window.clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current?.();
          }
          onTickRef.current?.(0);
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [active, paused]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  const reset = useCallback(
    (seconds: number) => {
      expiredRef.current = false;
      setRemaining(seconds);
    },
    [],
  );

  return { remaining, paused, pause, resume, reset, setRemaining };
}
