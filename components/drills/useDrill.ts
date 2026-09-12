'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  getHistory,
  getSeed,
  getServerHistory,
  getServerSeed,
  getServerWindows,
  getWindows,
  nextQuestion,
  record,
  removeAttempt,
  resetDrill,
  restoreAttempt,
  subscribeSlot,
  subscribeWindows,
} from '@/lib/practice';
import { type Attempt, type DrillId, type Role, summarise } from '@/lib/stats';
import { useDrillTimer } from './useDrillTimer';

/**
 * One drill's state: the seed the current question is derived from, the live
 * clock, and the persisted attempt history for this role and drill.
 */
export function useDrill(role: Role, drill: DrillId) {
  const subscribe = useMemo(() => subscribeSlot(role, drill), [role, drill]);
  const seed = useSyncExternalStore(subscribe, getSeed(role, drill), getServerSeed);
  const history = useSyncExternalStore(subscribe, getHistory(role, drill), getServerHistory);
  const windows = useSyncExternalStore(subscribeWindows, getWindows, getServerWindows);
  const timer = useDrillTimer();

  const submit = useCallback(
    (correct: boolean) => {
      const ms = timer.stop();
      const attempt: Attempt = { correct, ms, at: Date.now() };
      record(role, drill, attempt);
      return attempt;
    },
    [role, drill, timer],
  );

  const next = useCallback(() => {
    timer.restart();
    nextQuestion(role, drill);
  }, [role, drill, timer]);

  const reset = useCallback(() => resetDrill(role, drill), [role, drill]);

  const remove = useCallback((index: number) => removeAttempt(role, drill, index), [role, drill]);

  const restore = useCallback(
    (index: number, attempt: Attempt) => restoreAttempt(role, drill, index, attempt),
    [role, drill],
  );

  const summary = useMemo(() => summarise(history.attempts, windows), [history, windows]);

  return { seed, next, timer, record: submit, reset, remove, restore, history, summary };
}
