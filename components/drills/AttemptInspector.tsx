'use client';

import type { Attempt } from '@/lib/stats';
import { formatMs } from '@/lib/stats';

const WHEN = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function StepButton({
  label,
  glyph,
  onClick,
  disabled,
}: {
  label: string;
  glyph: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      className="grid h-8 w-8 place-items-center rounded border border-felt-line text-chalk-dim hover:border-brass hover:text-chalk disabled:opacity-35 disabled:hover:border-felt-line disabled:hover:text-chalk-dim"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {glyph}
    </button>
  );
}

/**
 * What the selected point on the chart actually was, and the chance to drop it.
 * A stray attempt (a phone call mid-question) skews an average for a long
 * time, so removing one is deliberately easy. It is undoable rather than
 * confirmed: a single attempt is small, and cleaning several in a row should
 * not mean six dialogs.
 */
export function AttemptInspector({
  attempts,
  selected,
  onSelect,
  onDelete,
  undo,
  onUndo,
}: {
  attempts: readonly Attempt[];
  selected: number | null;
  onSelect: (index: number | null) => void;
  onDelete: (index: number) => void;
  undo: { index: number; attempt: Attempt } | null;
  onUndo: () => void;
}) {
  const n = attempts.length;
  const picked = selected !== null && selected >= 0 && selected < n ? attempts[selected] : null;

  return (
    <div
      className="inset mt-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-[0.78rem]"
      aria-live="polite"
    >
      {picked === null ? (
        <span className="text-chalk-dim">
          Tap a point to inspect an attempt, or focus the chart and use the arrow keys.
        </span>
      ) : (
        <>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-chalk-dim">Attempt</span>
            <span className="font-[family-name:var(--font-mono)] text-chalk">
              {selected! + 1}
              <span className="text-chalk-dim">/{n}</span>
            </span>
            <span
              className={`font-[family-name:var(--font-mono)] font-semibold ${
                picked.correct ? 'text-good' : 'text-bad'
              }`}
            >
              {formatMs(picked.ms)}
            </span>
            <span className={picked.correct ? 'text-chalk-dim' : 'text-bad'}>
              {picked.correct ? 'correct' : 'wrong'}
            </span>
            <span className="text-chalk-dim">{WHEN.format(new Date(picked.at))}</span>
          </span>

          <span className="flex items-center gap-1.5">
            <StepButton
              label="Previous attempt"
              glyph="‹"
              disabled={selected === 0}
              onClick={() => onSelect(Math.max(0, selected! - 1))}
            />
            <StepButton
              label="Next attempt"
              glyph="›"
              disabled={selected === n - 1}
              onClick={() => onSelect(Math.min(n - 1, selected! + 1))}
            />
            <button
              type="button"
              className="btn !min-h-0 border-bad !px-2.5 !py-1 !text-[0.75rem] text-bad hover:!bg-bad/15"
              onClick={() => onDelete(selected!)}
            >
              Delete this attempt
            </button>
            <button
              type="button"
              className="px-1 text-chalk-dim underline decoration-dotted underline-offset-2 hover:text-chalk"
              onClick={() => onSelect(null)}
            >
              Clear
            </button>
          </span>
        </>
      )}

      {undo ? (
        <span className="flex w-full items-center gap-2 border-t border-felt-line pt-2 text-chalk-dim">
          Removed attempt {undo.index + 1}
          <span className="font-[family-name:var(--font-mono)]">{formatMs(undo.attempt.ms)}</span>
          <button
            type="button"
            className="text-brass underline decoration-dotted underline-offset-2 hover:decoration-solid"
            onClick={onUndo}
          >
            Undo
          </button>
        </span>
      ) : null}
    </div>
  );
}
