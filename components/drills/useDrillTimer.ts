'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A live clock for one open question. It starts when the question renders,
 * freezes on `stop()` (which returns the elapsed milliseconds for the attempt
 * record), and is rewound by `restart()` when the next question is dealt.
 *
 * Every state change happens in an event handler, never in an effect.
 */
export function useDrillTimer() {
  const startRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  // A ref write, not a state update: this only marks the starting instant.
  useEffect(() => {
    startRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (startRef.current === 0) startRef.current = performance.now();
      setElapsed(performance.now() - startRef.current);
    }, 67);
    return () => window.clearInterval(id);
  }, [running]);

  const stop = useCallback(() => {
    if (startRef.current === 0) startRef.current = performance.now();
    const ms = performance.now() - startRef.current;
    setElapsed(ms);
    setRunning(false);
    return ms;
  }, []);

  const restart = useCallback(() => {
    startRef.current = performance.now();
    setElapsed(0);
    setRunning(true);
  }, []);

  return { elapsed, running, stop, restart };
}
