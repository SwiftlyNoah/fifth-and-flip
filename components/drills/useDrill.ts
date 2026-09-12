'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  getHistory,
  getSeed,
  getServerHistory,
  getServerSeed,
  nextQuestion,
  record,
  resetDrill,
  subscribeSlot,
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

  const summary = useMemo(() => summarise(history.attempts), [history]);

  return { seed, next, timer, record: submit, reset, history, summary };
}
