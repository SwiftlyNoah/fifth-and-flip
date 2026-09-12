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
const MAX_ATTEMPTS = 1200;

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


/* -------------------------------------------------------- the windows */

/**
 * Which trailing windows the stats bar reports on. This is a display
 * preference, shared across every drill and both roles, not part of any
 * drill's history.
 */
export const DEFAULT_WINDOWS: readonly number[] = [5, 12, 50];
export const WINDOW_MIN = 2;
export const WINDOW_MAX = 500;
export const MAX_WINDOWS = 6;

const WINDOWS_KEY = `${PREFIX}:v${STATS_VERSION}:windows`;

/** Whole numbers, in range, unique, ascending, and never empty. */
export function normaliseWindows(input: unknown): number[] {
  if (!Array.isArray(input)) return [...DEFAULT_WINDOWS];
  const cleaned = input
    .filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    .map((x) => Math.round(x))
    .filter((x) => x >= WINDOW_MIN && x <= WINDOW_MAX);
  const unique = [...new Set(cleaned)].sort((a, b) => a - b).slice(0, MAX_WINDOWS);
  return unique.length > 0 ? unique : [...DEFAULT_WINDOWS];
}

export function readWindows(): number[] {
  if (typeof window === 'undefined') return [...DEFAULT_WINDOWS];
  try {
    const raw = window.localStorage.getItem(WINDOWS_KEY);
    return raw ? normaliseWindows(JSON.parse(raw)) : [...DEFAULT_WINDOWS];
  } catch {
    return [...DEFAULT_WINDOWS];
  }
}

export function writeWindows(windows: readonly number[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WINDOWS_KEY, JSON.stringify(windows));
  } catch {
    /* the preference just will not be remembered */
  }
}

/* ---------------------------------------------------------------- derived */

export interface WindowSummary {
  size: number;
  /** how many attempts the window actually has, which may be short of `size` */
  count: number;
  avgMs: number | null;
  /** 0-100 */
  accuracy: number | null;
  /** how many attempts sit in the comparison window immediately before it */
  prevCount: number;
  /** this window minus the one before it, in ms: negative is faster */
  deltaMs: number | null;
  /** this window minus the one before it, in percentage points */
  deltaAccuracy: number | null;
}

export interface Summary {
  n: number;
  last: Attempt | null;
  avgAll: number | null;
  /** 0-100, or null with no attempts */
  accuracyAll: number | null;
  best: number | null;
  windows: WindowSummary[];
}

const mean = (xs: readonly number[]): number | null =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;

const accuracyOf = (xs: readonly Attempt[]): number | null =>
  xs.length === 0 ? null : (100 * xs.filter((a) => a.correct).length) / xs.length;

/**
 * One trailing window, measured against the window of the same size
 * immediately before it. The comparison only happens once that earlier window
 * is full, so it is always like for like.
 */
export function summariseWindow(attempts: readonly Attempt[], size: number): WindowSummary {
  const n = attempts.length;
  const cut = Math.max(0, n - size);
  const current = attempts.slice(cut);
  const previous = attempts.slice(Math.max(0, cut - size), cut);
  const comparable = previous.length >= size;

  const avgMs = mean(current.map((a) => a.ms));
  const prevAvgMs = comparable ? mean(previous.map((a) => a.ms)) : null;
  const accuracy = accuracyOf(current);
  const prevAccuracy = comparable ? accuracyOf(previous) : null;

  return {
    size,
    count: current.length,
    avgMs,
    accuracy,
    prevCount: previous.length,
    deltaMs: avgMs !== null && prevAvgMs !== null ? avgMs - prevAvgMs : null,
    deltaAccuracy: accuracy !== null && prevAccuracy !== null ? accuracy - prevAccuracy : null,
  };
}

/**
 * Timing averages deliberately include wrong answers: a fast wrong call is
 * not a fast drill. Accuracy is reported separately alongside.
 */
export function summarise(attempts: readonly Attempt[], windows: readonly number[]): Summary {
  const n = attempts.length;
  const correctTimes = attempts.filter((a) => a.correct).map((a) => a.ms);

  return {
    n,
    last: n === 0 ? null : attempts[n - 1],
    avgAll: mean(attempts.map((a) => a.ms)),
    accuracyAll: accuracyOf(attempts),
    best: correctTimes.length === 0 ? null : Math.min(...correctTimes),
    windows: windows.map((size) => summariseWindow(attempts, size)),
  };
}

/** A rolling mean over `size` attempts, one value per attempt. */
export function rollingAverage(attempts: readonly Attempt[], size: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < attempts.length; i++) {
    sum += attempts[i].ms;
    if (i >= size) sum -= attempts[i - size].ms;
    out.push(sum / Math.min(i + 1, size));
  }
  return out;
}

export const formatMs = (ms: number | null): string =>
  ms === null || !Number.isFinite(ms) ? '\u2014' : `${(ms / 1000).toFixed(1)}s`;

export const formatPct = (p: number | null): string =>
  p === null || !Number.isFinite(p) ? '\u2014' : `${Math.round(p)}%`;
