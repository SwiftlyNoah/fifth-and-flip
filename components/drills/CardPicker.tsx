'use client';

import { BLACK_JOKER, RANKS, RED_JOKER, SUIT_GLYPHS } from '@/lib/trick';

export interface Pick {
  rank: number | null;
  suit: number | null;
  joker: number | null;
}

export const EMPTY_PICK: Pick = { rank: null, suit: null, joker: null };

export function pickValue(p: Pick): number | null {
  if (p.joker != null) return p.joker;
  return p.rank != null && p.suit != null ? 13 * p.suit + p.rank + 1 : null;
}

/** Rank, suit, or a joker. Tap targets stay at 44px for one-handed rehearsal. */
export function CardPicker({
  pick,
  onChange,
  disabled = false,
}: {
  pick: Pick;
  onChange: (p: Pick) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3.5 space-y-2">
      <div>
        <div className="mb-1 text-[0.8rem] text-chalk-dim">Rank</div>
        <div className="flex flex-wrap gap-1.5">
          {RANKS.map((r, k) => (
            <button
              key={r}
              type="button"
              className="btn btn-mono"
              disabled={disabled}
              aria-pressed={pick.rank === k}
              onClick={() => onChange({ rank: k, suit: pick.suit, joker: null })}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[0.8rem] text-chalk-dim">Suit</div>
        <div className="flex flex-wrap gap-1.5">
          {SUIT_GLYPHS.map((s, k) => (
            <button
              key={s}
              type="button"
              className="btn btn-mono"
              style={k === 1 || k === 2 ? { color: pick.suit === k ? undefined : '#E58F8F' } : undefined}
              disabled={disabled}
              aria-pressed={pick.suit === k}
              onClick={() => onChange({ rank: pick.rank, suit: k, joker: null })}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[0.8rem] text-chalk-dim">or a joker</div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              [BLACK_JOKER, 'Black joker'],
              [RED_JOKER, 'Red joker'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className="btn"
              disabled={disabled}
              aria-pressed={pick.joker === v}
              onClick={() => onChange({ rank: null, suit: null, joker: v })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CoinPicker({
  coin,
  onChange,
  disabled = false,
}: {
  coin: 'H' | 'T' | null;
  onChange: (c: 'H' | 'T') => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3.5">
      <div className="mb-1 text-[0.8rem] text-chalk-dim">Coin</div>
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['H', 'Heads'],
            ['T', 'Tails'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            className="btn"
            disabled={disabled}
            aria-pressed={coin === v}
            onClick={() => onChange(v)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
