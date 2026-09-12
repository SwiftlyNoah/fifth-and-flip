import { encode } from '@/lib/trick';

/** The one hand the walkthrough is built on. 7C AD QH 3S 9S, coin heads. */
export const HAND = [7, 14, 38, 42, 48];
export const COIN = 'H' as const;
export const GOLDEN = encode(HAND, COIN);

export const C7 = 7;
export const CA = 14;
export const CQ = 38;
export const C3 = 42;
export const C9 = 48;

/* --------------------------------------------------------------- geometry */

export const CARD_W = 76;
export const CARD_H = 108;
export const STAGE_W = 470;
export const STAGE_H = 246;

const ROW_Y = 92;

/** Five cards ascending, the way the spectator hands them over. */
export const FIVE_X = [10, 100, 190, 280, 370];
/** Four slots on the table, centred. */
export const SLOT_X = [62, 152, 242, 332];
export const SLOT_Y = ROW_Y;

const HOLD_Y = 4;
const HOLD_SCALE = 0.6;

export interface Spot {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  ring: boolean;
}

const spot = (x: number, y: number, scale = 1, opacity = 1, ring = false): Spot => ({
  x,
  y,
  scale,
  opacity,
  ring,
});

/** Where each of the five cards sits on a given step. */
export function positions(step: number): Record<number, Spot> {
  const five = {
    [C7]: spot(FIVE_X[0], ROW_Y),
    [CA]: spot(FIVE_X[1], ROW_Y),
    [CQ]: spot(FIVE_X[2], ROW_Y),
    [C3]: spot(FIVE_X[3], ROW_Y),
    [C9]: spot(FIVE_X[4], ROW_Y),
  };

  // 1: number the cards
  if (step <= 1) return five;

  // 2, 3: the nine of spades lifts out of the row
  if (step <= 3) return { ...five, [C9]: spot(FIVE_X[4], ROW_Y - 52, 1, 1, true) };

  const parked = spot(14, HOLD_Y, HOLD_SCALE, 0.45);

  // 4: the lowest shown card drops into slot 2, the rest wait above
  if (step === 4) {
    return {
      [C7]: spot(SLOT_X[1], ROW_Y, 1, 1, true),
      [CA]: spot(230, HOLD_Y, HOLD_SCALE),
      [CQ]: spot(290, HOLD_Y, HOLD_SCALE),
      [C3]: spot(350, HOLD_Y, HOLD_SCALE),
      [C9]: parked,
    };
  }

  const laid = {
    [CQ]: spot(SLOT_X[0], ROW_Y),
    [C7]: spot(SLOT_X[1], ROW_Y),
    [CA]: spot(SLOT_X[2], ROW_Y),
    [C3]: spot(SLOT_X[3], ROW_Y),
    [C9]: parked,
  };

  // 5 to 9: the finished row, with the odd card spotlit as the magician reads it
  if (step === 5) return laid;
  if (step === 6) return { ...laid, [C7]: spot(SLOT_X[1], ROW_Y, 1, 1, true) };
  if (step === 7) {
    return {
      ...laid,
      [CQ]: spot(SLOT_X[0], ROW_Y - 14),
      [CA]: spot(SLOT_X[2], ROW_Y - 14),
      [C3]: spot(SLOT_X[3], ROW_Y - 14),
    };
  }
  if (step <= 9) return laid;

  // 10: the row recedes upward and the fifth card lands centre stage
  return {
    [CQ]: spot(150, HOLD_Y, HOLD_SCALE, 0.45),
    [C7]: spot(210, HOLD_Y, HOLD_SCALE, 0.45),
    [CA]: spot(270, HOLD_Y, HOLD_SCALE, 0.45),
    [C3]: spot(330, HOLD_Y, HOLD_SCALE, 0.45),
    [C9]: spot((STAGE_W - CARD_W) / 2, ROW_Y, 1, 1, true),
  };
}

export interface Step {
  side: 'Assistant' | 'Magician';
  n: number;
  title: string;
  /** one sentence, and one sentence only */
  line: string;
  figure: 'values' | 'sum' | 'blocks' | 'slots' | 'perms' | 'read-slot' | 'read-perm' | 'start' | 'u' | 'checkpoints';
}

export const STEPS: Step[] = [
  {
    side: 'Assistant',
    n: 1,
    title: 'Number the cards',
    line: 'Clubs are their rank, diamonds add 13, hearts add 26, spades add 39.',
    figure: 'values',
  },
  {
    side: 'Assistant',
    n: 2,
    title: 'Which card to hide',
    line: 'They add to 149, and 149 mod 5 is 4, so hide the card four up from the lowest.',
    figure: 'sum',
  },
  {
    side: 'Assistant',
    n: 3,
    title: 'Find m',
    line: 'Take u = 48 minus 4 = 44, and read off the block of five it lands in.',
    figure: 'blocks',
  },
  {
    side: 'Assistant',
    n: 4,
    title: 'Place the lowest card',
    line: 'Heads keeps the lowest card in the front half of the row, and m of six or more pushes it to slot 2.',
    figure: 'slots',
  },
  {
    side: 'Assistant',
    n: 5,
    title: 'Spell out the rest',
    line: '8 mod 6 is 2, which spells M L H, so the other three go middle, low, high.',
    figure: 'perms',
  },
  {
    side: 'Magician',
    n: 1,
    title: 'Read the slot',
    line: 'The lowest card of the four is in slot 2, so the coin was heads and m is six or more.',
    figure: 'read-slot',
  },
  {
    side: 'Magician',
    n: 2,
    title: 'Read the order',
    line: 'The other three run middle, low, high, which is 2, so m = 6 + 2 = 8.',
    figure: 'read-perm',
  },
  {
    side: 'Magician',
    n: 3,
    title: 'Find the start',
    line: 'The four cards on the table add to 101, and 5 minus the remainder 1 gives start = 4.',
    figure: 'start',
  },
  {
    side: 'Magician',
    n: 4,
    title: 'Rebuild u',
    line: 'u = 5 times 8, plus 4, is 44: the forty-fourth card still left in the deck.',
    figure: 'u',
  },
  {
    side: 'Magician',
    n: 5,
    title: 'Call it',
    line: 'All four checkpoints 7, 13, 36 and 39 are at or below 44, so add four: card 48, the nine of spades, and heads.',
    figure: 'checkpoints',
  },
];
