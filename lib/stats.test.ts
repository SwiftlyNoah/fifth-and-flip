import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_WINDOWS,
  MAX_WINDOWS,
  WINDOW_MAX,
  WINDOW_MIN,
  type Attempt,
  appendAttempt,
  deleteAttemptAt,
  insertAttemptAt,
  normaliseWindows,
  readHistory,
  rollingAverage,
  summarise,
  summariseWindow,
  writeHistory,
} from './stats';

/** ms values in, attempts out. A negative value marks a wrong answer. */
function attempts(...values: number[]): Attempt[] {
  return values.map((v, i) => ({ correct: v > 0, ms: Math.abs(v), at: 1000 + i }));
}

describe('window summaries', () => {
  it('averages the trailing window and compares it with the one before', () => {
    // prior three average 6000, current three average 3000
    const w = summariseWindow(attempts(5000, 6000, 7000, 2000, 3000, 4000), 3);
    expect(w.count).toBe(3);
    expect(w.avgMs).toBe(3000);
    expect(w.prevCount).toBe(3);
    expect(w.deltaMs).toBe(-3000);
  });

  it('reports accuracy for the window and the change in percentage points', () => {
    // prior four: one wrong (75%), current four: three wrong (25%)
    const w = summariseWindow(attempts(1000, 1000, 1000, -1000, -1000, -1000, 1000, -1000), 4);
    expect(w.accuracy).toBe(25);
    expect(w.deltaAccuracy).toBe(-50);
  });

  it('withholds the delta until the earlier window is full, so it is like for like', () => {
    const short = summariseWindow(attempts(1000, 2000, 3000, 4000, 5000), 3);
    expect(short.count).toBe(3);
    expect(short.prevCount).toBe(2);
    expect(short.deltaMs).toBeNull();
    expect(short.deltaAccuracy).toBeNull();

    const full = summariseWindow(attempts(1000, 2000, 3000, 4000, 5000, 6000), 3);
    expect(full.prevCount).toBe(3);
    expect(full.deltaMs).toBe(3000);
  });

  it('still averages a window that is not full yet', () => {
    const w = summariseWindow(attempts(2000, 4000), 50);
    expect(w.count).toBe(2);
    expect(w.avgMs).toBe(3000);
    expect(w.deltaMs).toBeNull();
  });

  it('handles an empty history', () => {
    const w = summariseWindow([], 12);
    expect(w).toMatchObject({ count: 0, avgMs: null, accuracy: null, deltaMs: null });
  });
});

describe('summarise', () => {
  const history = attempts(9000, -8000, 7000, 6000, -5000, 4000);

  it('keeps wrong answers in the timing averages and reports accuracy apart', () => {
    const s = summarise(history, [3]);
    expect(s.n).toBe(6);
    expect(s.avgAll).toBe(6500);
    expect(s.accuracyAll).toBeCloseTo((100 * 4) / 6);
    // the fastest *correct* attempt, not the fastest attempt
    expect(s.best).toBe(4000);
  });

  it('produces one entry per requested window, in the order given', () => {
    const s = summarise(history, [2, 3, 50]);
    expect(s.windows.map((w) => w.size)).toEqual([2, 3, 50]);
    expect(s.windows[0].avgMs).toBe(4500);
    expect(s.windows[2].count).toBe(6);
  });

  it('is empty but well formed with no attempts', () => {
    const s = summarise([], [5, 12]);
    expect(s).toMatchObject({ n: 0, last: null, avgAll: null, accuracyAll: null, best: null });
    expect(s.windows).toHaveLength(2);
  });
});

describe('rollingAverage', () => {
  it('grows into the window, then slides', () => {
    expect(rollingAverage(attempts(1000, 3000, 5000, 7000), 2)).toEqual([1000, 2000, 4000, 6000]);
  });

  it('gives one value per attempt', () => {
    expect(rollingAverage(attempts(1, 2, 3, 4, 5), 3)).toHaveLength(5);
  });
});

describe('normaliseWindows', () => {
  it('rounds, dedupes and sorts', () => {
    expect(normaliseWindows([12, 5.4, 12, 50])).toEqual([5, 12, 50]);
  });

  it('drops anything out of range or not a number', () => {
    expect(normaliseWindows([1, 5, WINDOW_MAX + 1, 'x', null, 12])).toEqual([5, 12]);
    expect(normaliseWindows([WINDOW_MIN, WINDOW_MAX])).toEqual([WINDOW_MIN, WINDOW_MAX]);
  });

  it('caps how many windows the bar will show', () => {
    expect(normaliseWindows([2, 3, 4, 5, 6, 7, 8, 9])).toHaveLength(MAX_WINDOWS);
  });

  it('falls back to the defaults rather than leaving the bar empty', () => {
    expect(normaliseWindows([])).toEqual([...DEFAULT_WINDOWS]);
    expect(normaliseWindows('nonsense')).toEqual([...DEFAULT_WINDOWS]);
    expect(normaliseWindows(undefined)).toEqual([...DEFAULT_WINDOWS]);
  });
});

/* ---------------------------------------------- the storage-backed helpers */

/** Just enough of the Storage interface for lib/stats to run under node. */
function fakeStorage() {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
  };
}

const hadWindow = 'window' in globalThis;

describe('editing a stored history', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: fakeStorage() },
      configurable: true,
      writable: true,
    });
    writeHistory('A', 'lay', { v: 1, attempts: attempts(1000, 2000, 3000, 4000) });
  });

  afterAll(() => {
    if (!hadWindow) Reflect.deleteProperty(globalThis, 'window');
  });

  it('drops the attempt at the given position and keeps the order', () => {
    const next = deleteAttemptAt('A', 'lay', 1);
    expect(next.attempts.map((a) => a.ms)).toEqual([1000, 3000, 4000]);
    // and it is actually persisted, not just returned
    expect(readHistory('A', 'lay').attempts.map((a) => a.ms)).toEqual([1000, 3000, 4000]);
  });

  it('leaves the history alone for an index that is not there', () => {
    for (const index of [-1, 4, 99, 1.5, NaN]) {
      expect(deleteAttemptAt('A', 'lay', index).attempts).toHaveLength(4);
    }
  });

  it('puts one back exactly where it was, which is what undo needs', () => {
    const before = readHistory('A', 'lay').attempts;
    const removed = before[2];
    deleteAttemptAt('A', 'lay', 2);
    const restored = insertAttemptAt('A', 'lay', 2, removed);
    expect(restored.attempts).toEqual(before);
  });

  it('clamps an out-of-range insert to the ends rather than dropping it', () => {
    const [one] = attempts(9000);
    expect(insertAttemptAt('A', 'lay', -5, one).attempts[0].ms).toBe(9000);
    expect(insertAttemptAt('A', 'lay', 99, one).attempts.at(-1)?.ms).toBe(9000);
  });

  it('keeps each drill and role separate', () => {
    appendAttempt('M', 'call', { correct: true, ms: 7000, at: 1 });
    deleteAttemptAt('A', 'lay', 0);
    expect(readHistory('A', 'lay').attempts).toHaveLength(3);
    expect(readHistory('M', 'call').attempts).toHaveLength(1);
  });
});
