/**
 * The Fifth Card & the Coin - the encoding scheme, ported verbatim from
 * prototype.html. This module is pure: no React, no DOM, no browser globals.
 *
 * DO NOT "clean up" the algorithm. It is exhaustively verified by
 * lib/trick.test.ts. A tidier version that fails the round trip is worthless.
 *
 * Invariants that must always hold:
 *   u in [1, 50]        m in [0, 9]        candidates(shown).length === 10
 */

export const N = 54;
export const BLACK_JOKER = 53;
export const RED_JOKER = 54;

export const SUIT_LETTERS = ['C', 'D', 'H', 'S'] as const;
export const SUIT_GLYPHS = ['♣', '♦', '♥', '♠'] as const;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'] as const;

/** The six orderings of the three non-lowest shown cards. */
export const PERMS: readonly (readonly number[])[] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

/** Human-readable spelling of each permutation, indexed by m mod 6. */
export const CODE = ['L M H', 'L H M', 'M L H', 'M H L', 'H L M', 'H M L'] as const;

export type Coin = 'H' | 'T';

/* ---------------------------------------------------------------- naming */

export const isJoker = (v: number): boolean => v === BLACK_JOKER || v === RED_JOKER;
export const rankOf = (v: number): number => (v - 1) % 13;
export const suitOf = (v: number): number => Math.floor((v - 1) / 13);

export const nameOf = (v: number): string =>
  v === BLACK_JOKER ? 'black joker' : v === RED_JOKER ? 'red joker' : RANKS[rankOf(v)] + SUIT_GLYPHS[suitOf(v)];

export const shortOf = (v: number): string =>
  v === BLACK_JOKER ? 'BJ' : v === RED_JOKER ? 'RJ' : RANKS[rankOf(v)] + SUIT_GLYPHS[suitOf(v)];

export const isRed = (v: number): boolean =>
  v === RED_JOKER || (!isJoker(v) && (suitOf(v) === 1 || suitOf(v) === 2));

/** The block of five that u lands in, e.g. 44 -> "41-45". */
export const blockOf = (u: number): string =>
  `${5 * Math.floor((u - 1) / 5) + 1}–${5 * (Math.floor((u - 1) / 5) + 1)}`;

export const coinName = (c: Coin): string => (c === 'H' ? 'heads' : 'tails');

/* ------------------------------------------------------------ the scheme */

/** start = 5 - (sum of shown mod 5), where a remainder of 0 means 5. */
export function startPos(shown: readonly number[]): number {
  const s = shown.reduce((a, b) => a + b, 0) % 5;
  return s === 0 ? 5 : 5 - s;
}

/** cp[k] = shown[k] - k, for the four shown cards in ascending order. */
export function checkpoints(shown: readonly number[]): number[] {
  return [...shown].sort((a, b) => a - b).map((a, k) => a - k);
}

/**
 * The ten cards that could be hidden behind this particular four: every fifth
 * survivor of the deck, starting at `start`.
 */
export function candidates(shown: readonly number[]): number[] {
  const set = new Set(shown);
  const un: number[] = [];
  for (let c = 1; c <= N; c++) if (!set.has(c)) un.push(c);
  const out: number[] = [];
  for (let p = startPos(shown); p <= un.length; p += 5) out.push(un[p - 1]);
  return out;
}

export interface Encoded {
  /** sum of all five mod 5: which card (from the bottom, 0-indexed) is hidden */
  i: number;
  hidden: number;
  /** the four shown cards, ascending */
  shown: number[];
  /** which of the ten candidates the hidden card is, 0-9 */
  m: number;
  /** the hidden card's position among the 50 survivors, 1-50 */
  u: number;
  /** slot the lowest shown card occupies, 1-4 */
  pos: number;
  /** the four cards in the order they go on the table */
  layout: number[];
  /** the ten cards that could have been hidden behind `shown` */
  cands: number[];
  /** sum of the four shown cards */
  S: number;
  start: number;
}

/** Assistant: five cards plus a coin in, a four-card row out. */
export function encode(hand: readonly number[], coin: Coin): Encoded {
  const h5 = [...hand].sort((a, b) => a - b);
  const i = h5.reduce((a, b) => a + b, 0) % 5;
  const hidden = h5[i];
  const shown = h5.filter((x) => x !== hidden);
  const u = hidden - i;
  const m = Math.floor((u - 1) / 5);
  const pos = coin === 'H' ? (m < 6 ? 1 : 2) : m < 6 ? 3 : 4;
  const rest = shown.slice(1);
  const arr = PERMS[m % 6].map((p) => rest[p]);
  const layout = arr.slice(0, pos - 1).concat([shown[0]], arr.slice(pos - 1));
  return {
    i,
    hidden,
    shown,
    m,
    u,
    pos,
    layout,
    cands: candidates(shown),
    S: shown.reduce((a, b) => a + b, 0),
    start: startPos(shown),
  };
}

export interface RowReading {
  coin: Coin;
  pos: number;
  /** the permutation index, i.e. m mod 6 */
  pv: number;
  m: number;
  shown: number[];
  low: number;
}

/** Magician, steps 1 and 2: read the coin and m straight off the row. */
export function readRow(layout: readonly number[]): RowReading {
  const shown = [...layout].sort((a, b) => a - b);
  const low = shown[0];
  const pos = layout.indexOf(low) + 1;
  const coin: Coin = pos <= 2 ? 'H' : 'T';
  const rest = layout.filter((x) => x !== low);
  const srt = [...rest].sort((a, b) => a - b);
  const pv = PERMS.findIndex((p) => p.join('') === rest.map((x) => srt.indexOf(x)).join(''));
  return { coin, pos, pv, m: (pos === 1 || pos === 3 ? 0 : 6) + pv, shown, low };
}

export interface CardFrom {
  u: number;
  cps: number[];
  /** the hidden card */
  h: number;
}

/** Magician, steps 3 to 5: turn m and the four shown cards into the fifth. */
export function cardFrom(shown: readonly number[], m: number): CardFrom {
  const u = 5 * m + startPos(shown);
  const cps = checkpoints(shown);
  return { u, cps, h: u + cps.filter((c) => u >= c).length };
}

export interface Decoded {
  coin: Coin;
  m: number;
  pos: number;
  hidden: number;
  shown: number[];
}

/** Magician: a four-card row in, the fifth card and the coin out. */
export function decode(layout: readonly number[]): Decoded {
  const r = readRow(layout);
  return { coin: r.coin, m: r.m, pos: r.pos, hidden: cardFrom(r.shown, r.m).h, shown: r.shown };
}

/* ------------------------------------------------------------- utilities */

/** Five distinct cards, ascending. */
export function dealHand(rnd: () => number = Math.random): number[] {
  const s = new Set<number>();
  while (s.size < 5) s.add(1 + Math.floor(rnd() * N));
  return [...s].sort((a, b) => a - b);
}

export function flipCoin(rnd: () => number = Math.random): Coin {
  return rnd() < 0.5 ? 'H' : 'T';
}

/**
 * Parse "7C AD QH 3S 9S" into five ascending card values, or null if that is
 * not five distinct valid cards.
 */
export function parseHand(str: string): number[] | null {
  const toks = str.trim().toUpperCase().replace(/10/g, 'T').split(/[\s,]+/).filter(Boolean);
  if (toks.length !== 5) return null;
  const vals = toks.map((t) => {
    if (t === 'BJ') return BLACK_JOKER;
    if (t === 'RJ') return RED_JOKER;
    if (t.length !== 2) return -1;
    const r = (RANKS as readonly string[]).indexOf(t[0]);
    const s = (SUIT_LETTERS as readonly string[]).indexOf(t[1]);
    return r < 0 || s < 0 ? -1 : 13 * s + r + 1;
  });
  return vals.some((v) => v < 0) || new Set(vals).size !== 5 ? null : vals.sort((a, b) => a - b);
}
