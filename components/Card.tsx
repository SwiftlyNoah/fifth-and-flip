'use client';

import { motion } from 'motion/react';
import { RANKS, SUIT_GLYPHS, isJoker, isRed, nameOf, rankOf, suitOf } from '@/lib/trick';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZES: Record<
  CardSize,
  { w: number; h: number; rank: number; suit: number; jokerSuit: number; index: number | null }
> = {
  xs: { w: 34, h: 48, rank: 0.9, suit: 0.78, jokerSuit: 0.36, index: null },
  sm: { w: 42, h: 60, rank: 1.1, suit: 0.95, jokerSuit: 0.44, index: null },
  md: { w: 58, h: 82, rank: 1.48, suit: 1.3, jokerSuit: 0.58, index: 0.5 },
  lg: { w: 76, h: 108, rank: 1.9, suit: 1.68, jokerSuit: 0.72, index: 0.6 },
};

/** The small mirrored rank-over-suit index in the corners of a real card. */
function Index({ value, size, corner }: { value: number; size: CardSize; corner: 'tl' | 'br' }) {
  const s = SIZES[size];
  if (s.index === null || isJoker(value)) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute flex flex-col items-center leading-[1.05]"
      style={{
        fontSize: `${s.index}rem`,
        ...(corner === 'tl'
          ? { top: '4px', left: '5px' }
          : { bottom: '4px', right: '5px', transform: 'rotate(180deg)' }),
      }}
    >
      <span>{RANKS[rankOf(value)]}</span>
      <span style={{ fontSize: '0.9em' }}>{SUIT_GLYPHS[suitOf(value)]}</span>
    </span>
  );
}

function Face({ value, size }: { value: number; size: CardSize }) {
  const s = SIZES[size];
  const joker = isJoker(value);

  return (
    <>
      <Index value={value} size={size} corner="tl" />
      <span
        style={{ fontSize: `${joker ? s.rank * 0.9 : s.rank}rem` }}
        className="block tracking-tight"
      >
        {joker ? '★' : RANKS[rankOf(value)]}
      </span>
      <span
        style={{
          fontSize: `${joker ? s.jokerSuit : s.suit}rem`,
          marginTop: joker ? '0.32em' : '0.06em',
          letterSpacing: joker ? '0.08em' : undefined,
          lineHeight: 1,
        }}
        className={joker ? 'font-[family-name:var(--font-mono)] font-semibold' : 'block'}
      >
        {joker ? 'JOKER' : SUIT_GLYPHS[suitOf(value)]}
      </span>
      <Index value={value} size={size} corner="br" />
    </>
  );
}

export interface PlayingCardProps {
  value: number;
  size?: CardSize;
  /** Shared-layout id so the same card element travels between positions. */
  layoutId?: string;
  className?: string;
  dimmed?: boolean;
  picked?: boolean;
}

/** A static card face. */
export function PlayingCard({
  value,
  size = 'md',
  layoutId,
  className = '',
  dimmed = false,
  picked = false,
}: PlayingCardProps) {
  const s = SIZES[size];

  return (
    <motion.div
      layoutId={layoutId}
      layout={layoutId ? undefined : false}
      transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.7 }}
      style={{ width: s.w, height: s.h, opacity: dimmed ? 0.32 : 1 }}
      data-card={value}
      className={`card-face ${isRed(value) ? 'is-red' : ''} ${picked ? 'is-picked' : ''} ${className}`}
      aria-label={nameOf(value)}
      role="img"
    >
      <Face value={value} size={size} />
    </motion.div>
  );
}

export interface CardButtonProps extends Omit<PlayingCardProps, 'layoutId'> {
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}

/** A tappable card face. Tap target is at least 44px wide at size md and up. */
export function CardButton({
  value,
  size = 'md',
  className = '',
  picked = false,
  onClick,
  disabled = false,
  pressed,
}: CardButtonProps) {
  const s = SIZES[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={nameOf(value)}
      aria-pressed={pressed}
      style={{ width: s.w, height: s.h }}
      data-card={value}
      className={`card-face ${isRed(value) ? 'is-red' : ''} ${picked ? 'is-picked' : ''} ${className}`}
    >
      <Face value={value} size={size} />
    </button>
  );
}

/** The dashed outline of an empty slot. */
export function GhostCard({
  label,
  size = 'md',
  onClick,
}: {
  label: string;
  size?: CardSize;
  onClick?: () => void;
}) {
  const s = SIZES[size];
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      style={{ width: s.w, height: s.h }}
      className="card-face card-ghost"
    >
      {label}
    </Tag>
  );
}

/** A fanned hand of cards. */
export function Hand({
  values,
  size = 'md',
  className = '',
}: {
  values: readonly number[];
  size?: CardSize;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-2 ${className}`}>
      {values.map((v) => (
        <PlayingCard key={v} value={v} size={size} />
      ))}
    </div>
  );
}

/** The four-card row as it sits on the table, with slot numbers beneath. */
export function CardRow({
  layout,
  size = 'md',
  layoutIdPrefix,
  className = '',
  highlightSlot,
}: {
  layout: readonly number[];
  size?: CardSize;
  layoutIdPrefix?: string;
  className?: string;
  highlightSlot?: number;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-2 ${className}`}>
      {layout.map((c, k) => (
        <div key={c} className="flex flex-col items-center gap-1.5">
          <PlayingCard
            value={c}
            size={size}
            layoutId={layoutIdPrefix ? `${layoutIdPrefix}-${c}` : undefined}
          />
          <span
            className={`font-[family-name:var(--font-mono)] text-[0.72rem] ${
              highlightSlot === k + 1 ? 'text-brass' : 'text-chalk-dim'
            }`}
          >
            {k + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
