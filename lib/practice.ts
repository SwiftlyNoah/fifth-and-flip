/**
 * The practice session store: one slot per (role, drill), holding the current
 * question seed and a cached view of the persisted attempt history.
 *
 * It is a plain external store so React can read it through
 * useSyncExternalStore. That keeps questions deterministic during render (they
 * are derived from a seed) and keeps localStorage reads out of effects.
 */

import {
  type Attempt,
  type DrillId,
  type History,
  type Role,
  DEFAULT_WINDOWS,
  appendAttempt,
  clearDrill,
  normaliseWindows,
  readHistory,
  readWindows,
  writeWindows,
} from './stats';

const ROLES: Role[] = ['A', 'M'];
const DRILLS: DrillId[] = ['values', 'hide', 'findm', 'lay', 'readrow', 'findcard', 'call'];

type Listener = () => void;

interface Slot {
  seed: number;
  /** null until the first read; kept so getSnapshot returns a stable reference */
  cache: History | null;
  listeners: Set<Listener>;
}

const EMPTY_HISTORY: History = { v: 1, attempts: [] };

/** A seed that is stable for the lifetime of the page but differs per visit. */
function freshSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
}

// Built once at module load, so nothing has to be created during a render.
const SLOTS: Record<string, Slot> = {};
for (const role of ROLES) {
  for (const drill of DRILLS) {
    SLOTS[`${role}:${drill}`] = { seed: freshSeed(), cache: null, listeners: new Set() };
  }
}

const slotOf = (role: Role, drill: DrillId): Slot => SLOTS[`${role}:${drill}`];

function emit(slot: Slot) {
  slot.listeners.forEach((l) => l());
}

/* ------------------------------------------------------------------ seeds */

export function subscribeSlot(role: Role, drill: DrillId) {
  const slot = slotOf(role, drill);
  return (listener: Listener) => {
    slot.listeners.add(listener);
    return () => {
      slot.listeners.delete(listener);
    };
  };
}

export const getSeed = (role: Role, drill: DrillId) => () => slotOf(role, drill).seed;

/** The same seed on every server render, so hydration has nothing to reconcile. */
export const getServerSeed = () => 1;

export function nextQuestion(role: Role, drill: DrillId): void {
  const slot = slotOf(role, drill);
  // xorshift32 on the current seed: no Math.random outside module load
  let s = slot.seed;
  s ^= s << 13;
  s >>>= 0;
  s ^= s >> 17;
  s ^= s << 5;
  slot.seed = (s >>> 0) || 1;
  emit(slot);
}

/* ---------------------------------------------------------------- history */

export const getHistory = (role: Role, drill: DrillId) => () => {
  const slot = slotOf(role, drill);
  if (slot.cache === null) slot.cache = readHistory(role, drill);
  return slot.cache;
};

export const getServerHistory = () => EMPTY_HISTORY;

export function record(role: Role, drill: DrillId, attempt: Attempt): void {
  const slot = slotOf(role, drill);
  slot.cache = appendAttempt(role, drill, attempt);
  emit(slot);
}

export function resetDrill(role: Role, drill: DrillId): void {
  const slot = slotOf(role, drill);
  clearDrill(role, drill);
  slot.cache = EMPTY_HISTORY;
  emit(slot);
}

/** Clears every drill's history. Display preferences are left alone. */
export function resetEverything(): void {
  for (const role of ROLES) {
    for (const drill of DRILLS) {
      clearDrill(role, drill);
      const slot = slotOf(role, drill);
      slot.cache = EMPTY_HISTORY;
      emit(slot);
    }
  }
}

/* ---------------------------------------------------------------- windows */

const SERVER_WINDOWS: number[] = [...DEFAULT_WINDOWS];
let windows: number[] | null = null;
const windowListeners = new Set<Listener>();

export function subscribeWindows(listener: Listener) {
  windowListeners.add(listener);
  return () => {
    windowListeners.delete(listener);
  };
}

export function getWindows(): number[] {
  if (windows === null) windows = readWindows();
  return windows;
}

export const getServerWindows = (): number[] => SERVER_WINDOWS;

export function setWindows(next: readonly number[]): void {
  windows = normaliseWindows([...next]);
  writeWindows(windows);
  windowListeners.forEach((l) => l());
}

/* ------------------------------------------------------------------- role */

const ROLE_KEY = 'faf:v1:role';
let role: Role | null = null;
const roleListeners = new Set<Listener>();

/** ?role= wins, then the last visit, then the assistant. */
function resolveRole(): Role {
  try {
    const q = new URLSearchParams(window.location.search).get('role');
    if (q === 'A' || q === 'M') return q;
    const saved = window.localStorage.getItem(ROLE_KEY);
    if (saved === 'A' || saved === 'M') return saved;
  } catch {
    /* no window, no storage: the assistant it is */
  }
  return 'A';
}

export function subscribeRole(listener: Listener) {
  roleListeners.add(listener);
  return () => {
    roleListeners.delete(listener);
  };
}

export function getRole(): Role {
  if (role === null) role = resolveRole();
  return role;
}

export const getServerRole = (): Role => 'A';

export function setRole(next: Role): void {
  role = next;
  try {
    window.localStorage.setItem(ROLE_KEY, next);
  } catch {
    /* ignore */
  }
  roleListeners.forEach((l) => l());
}
