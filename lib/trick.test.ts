import { describe, expect, it } from 'vitest';
import {
  BLACK_JOKER,
  N,
  RED_JOKER,
  type Coin,
  candidates,
  cardFrom,
  decode,
  encode,
  parseHand,
  readRow,
  shortOf,
  startPos,
} from './trick';

/** Deterministic xorshift so a failure is reproducible. */
function rng(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

function deal(rnd: () => number): number[] {
  const s = new Set<number>();
  while (s.size < 5) s.add(1 + Math.floor(rnd() * N));
  return [...s].sort((a, b) => a - b);
}

const ROUNDS = 200_000;

describe('round trip', () => {
  it(`decodes ${ROUNDS.toLocaleString('en-US')} random hands back to the hidden card and the coin`, () => {
    const rnd = rng(0x5eed1);
    const failures: string[] = [];

    for (let n = 0; n < ROUNDS; n++) {
      const hand = deal(rnd);
      const coin: Coin = rnd() < 0.5 ? 'H' : 'T';
      const e = encode(hand, coin);
      const got = decode(e.layout);

      if (got.hidden !== e.hidden || got.coin !== coin) {
        failures.push(
          `hand ${hand.join(',')} coin ${coin}: layout ${e.layout.join(',')} ` +
            `expected ${e.hidden}/${coin} got ${got.hidden}/${got.coin}`,
        );
        if (failures.length > 5) break;
      }
    }

    expect(failures).toEqual([]);
  });

  it('keeps u in [1,50] and m in [0,9] across the same run', () => {
    const rnd = rng(0x5eed2);
    let uMin = Infinity;
    let uMax = -Infinity;
    let mMin = Infinity;
    let mMax = -Infinity;

    for (let n = 0; n < ROUNDS; n++) {
      const hand = deal(rnd);
      const e = encode(hand, rnd() < 0.5 ? 'H' : 'T');
      if (e.u < uMin) uMin = e.u;
      if (e.u > uMax) uMax = e.u;
      if (e.m < mMin) mMin = e.m;
      if (e.m > mMax) mMax = e.m;
      // the layout is always a permutation of the four shown cards
      expect([...e.layout].sort((a, b) => a - b)).toEqual(e.shown);
    }

    expect(uMin).toBeGreaterThanOrEqual(1);
    expect(uMax).toBeLessThanOrEqual(50);
    expect(mMin).toBeGreaterThanOrEqual(0);
    expect(mMax).toBeLessThanOrEqual(9);
  });
});

describe('the menu of ten', () => {
  /**
   * Built independently of lib/trick: strike the four shown cards out of the
   * deck, renumber the survivors 1-50, and take every fifth one from `start`.
   */
  function menu(shown: readonly number[]): number[] {
    const survivors: number[] = [];
    for (let c = 1; c <= N; c++) if (!shown.includes(c)) survivors.push(c);
    expect(survivors).toHaveLength(50);
    const out: number[] = [];
    for (let p = startPos(shown); p <= 50; p += 5) out.push(survivors[p - 1]);
    return out;
  }

  it('has exactly ten entries and its m-th entry is the hidden card', () => {
    const rnd = rng(0x5eed3);
    for (let n = 0; n < 20_000; n++) {
      const hand = deal(rnd);
      const e = encode(hand, rnd() < 0.5 ? 'H' : 'T');
      const ten = menu(e.shown);
      expect(ten).toHaveLength(10);
      expect(ten[e.m]).toBe(e.hidden);
      // and the shipped helper agrees with the independent construction
      expect(candidates(e.shown)).toEqual(ten);
      // reading the row back lands on the same entry
      expect(cardFrom(e.shown, readRow(e.layout).m).h).toBe(ten[e.m]);
    }
  });

  it('gives a ten-entry menu for all 316,251 four-card subsets of the deck', () => {
    let subsets = 0;
    const shown = [0, 0, 0, 0];
    for (let a = 1; a <= N; a++) {
      shown[0] = a;
      for (let b = a + 1; b <= N; b++) {
        shown[1] = b;
        for (let c = b + 1; c <= N; c++) {
          shown[2] = c;
          for (let d = c + 1; d <= N; d++) {
            shown[3] = d;
            subsets++;
            if (candidates(shown).length !== 10) {
              throw new Error(`menu was not ten for ${shown.join(',')}`);
            }
          }
        }
      }
    }
    expect(subsets).toBe(316_251);
  });
});

describe('golden case', () => {
  const hand = parseHand('7C AD QH 3S 9S')!;

  it('parses to 7, 14, 38, 42, 48', () => {
    expect(hand).toEqual([7, 14, 38, 42, 48]);
  });

  it('lays out Q♥ 7♣ A♦ 3♠ on heads', () => {
    const e = encode(hand, 'H');
    expect(e.layout.map(shortOf).join(' ')).toBe('Q♥ 7♣ A♦ 3♠');
    expect(e.i).toBe(4);
    expect(e.hidden).toBe(48);
    expect(e.u).toBe(44);
    expect(e.m).toBe(8);
    expect(e.pos).toBe(2);
    expect(decode(e.layout)).toMatchObject({ hidden: 48, coin: 'H', m: 8 });
  });

  it('lays out Q♥ A♦ 3♠ 7♣ on tails', () => {
    const e = encode(hand, 'T');
    expect(e.layout.map(shortOf).join(' ')).toBe('Q♥ A♦ 3♠ 7♣');
    expect(e.pos).toBe(4);
    expect(decode(e.layout)).toMatchObject({ hidden: 48, coin: 'T', m: 8 });
  });

  it('walks the magician back to 9♠ through start, u and the checkpoints', () => {
    const e = encode(hand, 'H');
    expect(e.S).toBe(101);
    expect(e.start).toBe(4);
    const cf = cardFrom(e.shown, 8);
    expect(cf.cps).toEqual([7, 13, 36, 39]);
    expect(cf.u).toBe(44);
    expect(cf.h).toBe(48);
  });
});

describe('parseHand', () => {
  it('takes both jokers and a written-out ten', () => {
    expect(parseHand('BJ RJ 10C 10D 10H')).toEqual([10, 23, 36, BLACK_JOKER, RED_JOKER]);
  });

  it('rejects duplicates, short hands and nonsense', () => {
    expect(parseHand('7C 7C QH 3S 9S')).toBeNull();
    expect(parseHand('7C AD QH 3S')).toBeNull();
    expect(parseHand('7C AD QH 3S ZZ')).toBeNull();
  });
});
