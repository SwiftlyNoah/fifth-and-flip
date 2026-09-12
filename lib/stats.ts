/**
 * Per-role, per-drill attempt history, persisted to localStorage.
 *
 * Every read is wrapped: a corrupt or stale payload degrades to an empty
 * history rather than throwing. The key carries a schema version, so a future
 * shape change simply starts a fresh history instead of crashing on old data.
 */

export const STATS_VERSION = 1;
const PREFIX = 'faf';

export type Role = 'A' | 'M';
export type DrillId =
  | 'values'
  | 'hide'
  | 'findm'
  | 'lay'
  | 'readrow'
  | 'findcard'
  | 'call';

export interface Attempt {
  correct: boolean;
  ms: number;
  at: number;
}

export interface History {
  v: number;
  attempts: Attempt[];
}

/** Keep histories bounded so localStorage never grows without limit. */
const MAX_ATTEMPTS = 400;

export const keyFor = (role: Role, drill: DrillId): string =>
  `${PREFIX}:v${STATS_VERSION}:${role}:${drill}`;

const EMPTY: History = { v: STATS_VERSION, attempts: [] };

function isAttempt(a: unknown): a is Attempt {
  if (typeof a !== 'object' || a === null) return false;
  const o = a as Record<string, unknown>;
  return typeof o.correct === 'boolean' && typeof o.ms === 'number' && typeof o.at === 'number'
    && Number.isFinite(o.ms) && o.ms >= 0;
}

export function readHistory(role: Role, drill: DrillId): History {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(keyFor(role, drill));
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    const o = parsed as Record<string, unknown>;
    if (o.v !== STATS_VERSION || !Array.isArray(o.attempts)) return EMPTY;
    return { v: STATS_VERSION, attempts: o.attempts.filter(isAttempt) };
  } catch {
    return EMPTY;
  }
}

export function writeHistory(role: Role, drill: DrillId, history: History): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed: History = {
      v: STATS_VERSION,
      attempts: history.attempts.slice(-MAX_ATTEMPTS),
    };
    window.localStorage.setItem(keyFor(role, drill), JSON.stringify(trimmed));
  } catch {
    /* private mode, quota, disabled storage: practising still works, it just
       will not be remembered. */
  }
}

export function appendAttempt(role: Role, drill: DrillId, attempt: Attempt): History {
  const prev = readHistory(role, drill);
  const next: History = { v: STATS_VERSION, attempts: [...prev.attempts, attempt].slice(-MAX_ATTEMPTS) };
  writeHistory(role, drill, next);
  return next;
}

export function clearDrill(role: Role, drill: DrillId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(role, drill));
  } catch {
    /* ignore */
  }
}

export function clearAll(): void {
  if (typeof window === 'undefined') return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:`)) doomed.push(k);
    }
    doomed.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/* ---------------------------------------------------------------- derived */

export interface Summary {
  n: number;
  last: Attempt | null;
  /** mean ms over the most recent 5 attempts, correct or not */
  avg5: number | null;
  avg12: number | null;
  avgAll: number | null;
  /** 0-100, or null with no attempts */
  accuracyAll: number | null;
  accuracy12: number | null;
  /** avg5 minus avgAll in ms: negative means the last five were faster */
  delta: number | null;
  best: number | null;
}

const mean = (xs: number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Timing averages deliberately include wrong answers: a fast wrong call is
 * not a fast drill. Accuracy is reported separately alongside.
 */
export function summarise(attempts: readonly Attempt[]): Summary {
  const n = attempts.length;
  if (n === 0) {
    return {
      n: 0, last: null, avg5: null, avg12: null, avgAll: null,
      accuracyAll: null, accuracy12: null, delta: null, best: null,
    };
  }

  const ms = attempts.map((a) => a.ms);
  const last5 = ms.slice(-5);
  const last12 = ms.slice(-12);
  const avg5 = mean(last5);
  const avgAll = mean(ms);
  const recent12 = attempts.slice(-12);

  return {
    n,
    last: attempts[n - 1],
    avg5,
    avg12: mean(last12),
    avgAll,
    accuracyAll: (100 * attempts.filter((a) => a.correct).length) / n,
    accuracy12: (100 * recent12.filter((a) => a.correct).length) / recent12.length,
    delta: avg5 !== null && avgAll !== null && n >= 5 ? avg5 - avgAll : null,
    best: Math.min(...attempts.filter((a) => a.correct).map((a) => a.ms), Infinity) === Infinity
      ? null
      : Math.min(...attempts.filter((a) => a.correct).map((a) => a.ms)),
  };
}

export const formatMs = (ms: number | null): string =>
  ms === null || !Number.isFinite(ms) ? '—' : `${(ms / 1000).toFixed(1)}s`;

export const formatPct = (p: number | null): string =>
  p === null || !Number.isFinite(p) ? '—' : `${Math.round(p)}%`;
