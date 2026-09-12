'use client';

import { useState } from 'react';
import { Sparkline } from './Sparkline';
import { type Attempt, type Summary, formatMs, formatPct } from '@/lib/stats';

function Stat({
  label,
  value,
  tone = 'normal',
  note,
}: {
  label: string;
  value: string;
  tone?: 'normal' | 'good' | 'bad';
  note?: string;
}) {
  const colour = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-brass';
  return (
    <div className="min-w-[4.5rem]">
      <div className="text-[0.68rem] uppercase tracking-[0.08em] text-chalk-dim">{label}</div>
      <div className={`font-[family-name:var(--font-mono)] text-[0.95rem] font-semibold tabular-nums ${colour}`}>
        {value}
        {note ? <span className="ml-1 text-[0.7rem] font-normal opacity-80">{note}</span> : null}
      </div>
    </div>
  );
}

export function StatsPanel({
  summary,
  attempts,
  onReset,
}: {
  summary: Summary;
  attempts: readonly Attempt[];
  onReset: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const improving = summary.delta !== null && summary.delta < 0;
  const slipping = summary.delta !== null && summary.delta > 0;

  return (
    <section
      className="mt-5 border-t border-felt-line pt-4"
      aria-label="Practice statistics"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          <Stat
            label="Last"
            value={formatMs(summary.last?.ms ?? null)}
            tone={summary.last ? (summary.last.correct ? 'good' : 'bad') : 'normal'}
          />
          <Stat
            label="Last 5"
            value={formatMs(summary.avg5)}
            note={
              summary.delta === null
                ? undefined
                : improving
                  ? `▾ ${formatMs(Math.abs(summary.delta))}`
                  : slipping
                    ? `▴ ${formatMs(Math.abs(summary.delta))}`
                    : undefined
            }
            tone={improving ? 'good' : slipping ? 'bad' : 'normal'}
          />
          <Stat label="Last 12" value={formatMs(summary.avg12)} />
          <Stat label="Overall" value={formatMs(summary.avgAll)} note={summary.n ? `n=${summary.n}` : undefined} />
          <Stat label="Accuracy" value={formatPct(summary.accuracyAll)} />
          <Stat label="Last 12 acc." value={formatPct(summary.accuracy12)} />
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Sparkline attempts={attempts} />
          {confirming ? (
            <div className="flex items-center gap-2 text-[0.75rem]">
              <span className="text-chalk-dim">Clear this drill?</span>
              <button
                type="button"
                className="btn !min-h-0 !px-2 !py-0.5 !text-[0.75rem] border-bad text-bad hover:!bg-bad/15"
                onClick={() => {
                  onReset();
                  setConfirming(false);
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn !min-h-0 !px-2 !py-0.5 !text-[0.75rem]"
                onClick={() => setConfirming(false)}
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="text-[0.75rem] text-chalk-dim underline decoration-dotted underline-offset-2 hover:text-chalk disabled:opacity-40 disabled:no-underline"
              onClick={() => setConfirming(true)}
              disabled={summary.n === 0}
            >
              Reset this drill
            </button>
          )}
        </div>
      </div>

      {improving ? (
        <p className="mt-3 text-[0.78rem] text-good">
          Your last five are {formatMs(Math.abs(summary.delta!))} faster than your overall average.
        </p>
      ) : null}
    </section>
  );
}
