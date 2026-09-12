'use client';

import { type ReactNode, useState, useSyncExternalStore } from 'react';
import { Delta } from './Delta';
import { HistoryChart } from './HistoryChart';
import { Sparkline } from './Sparkline';
import { WindowEditor } from './WindowEditor';
import { getServerWindows, getWindows, setWindows, subscribeWindows } from '@/lib/practice';
import { type Attempt, type Summary, formatMs, formatPct } from '@/lib/stats';

function Tile({
  label,
  note,
  value,
  valueTone = 'brass',
  delta,
  sub,
  subDelta,
}: {
  label: string;
  note?: string;
  value: string;
  valueTone?: 'brass' | 'good' | 'bad';
  delta?: ReactNode;
  sub: ReactNode;
  subDelta?: ReactNode;
}) {
  const tone = valueTone === 'good' ? 'text-good' : valueTone === 'bad' ? 'text-bad' : 'text-brass';

  return (
    <div className="min-w-[5.5rem]">
      <div className="text-[0.68rem] uppercase tracking-[0.08em] text-chalk-dim">
        {label}
        {note ? <span className="ml-1 tracking-normal normal-case opacity-70">{note}</span> : null}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-[family-name:var(--font-mono)] text-[0.95rem] font-semibold tabular-nums ${tone}`}>
          {value}
        </span>
        {delta}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-[family-name:var(--font-mono)] text-[0.78rem] tabular-nums text-chalk-dim">{sub}</span>
        {subDelta}
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
  const windows = useSyncExternalStore(subscribeWindows, getWindows, getServerWindows);
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // The widest window the history can fill twice over, so the trend line is
  // smooth once there is enough to smooth. Early on, the tightest one.
  const ascending = [...windows].sort((a, b) => a - b);
  const rolling = Math.max(3, ascending.filter((w) => w * 2 <= summary.n).pop() ?? ascending[0]);

  return (
    <section className="mt-5 border-t border-felt-line pt-4" aria-label="Practice statistics">
      <div className="flex flex-wrap gap-x-7 gap-y-4">
        <Tile
          label="Last"
          value={formatMs(summary.last?.ms ?? null)}
          valueTone={summary.last ? (summary.last.correct ? 'good' : 'bad') : 'brass'}
          sub={summary.last ? (summary.last.correct ? 'correct' : 'wrong') : '—'}
        />

        {summary.windows.map((w) => (
          <Tile
            key={w.size}
            label={`Last ${w.size}`}
            note={w.count > 0 && w.count < w.size ? `n=${w.count}` : undefined}
            value={formatMs(w.avgMs)}
            delta={<Delta value={w.deltaMs} better="lower" flatBelow={100} format={formatMs} />}
            sub={formatPct(w.accuracy)}
            subDelta={
              <Delta
                value={w.deltaAccuracy}
                better="higher"
                flatBelow={0.5}
                format={(v) => `${Math.round(v)}pt`}
              />
            }
          />
        ))}

        <Tile
          label="Overall"
          note={summary.n ? `n=${summary.n}` : undefined}
          value={formatMs(summary.avgAll)}
          sub={formatPct(summary.accuracyAll)}
        />

        <Tile label="Best" value={formatMs(summary.best)} sub="correct only" />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <WindowEditor windows={windows} onChange={setWindows} />

        <div className="flex items-end gap-4">
          <button
            type="button"
            className="flex flex-col items-end gap-0.5 rounded text-[0.75rem] text-chalk-dim hover:text-chalk disabled:opacity-50"
            aria-expanded={expanded}
            disabled={summary.n < 2}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? null : <Sparkline attempts={attempts} />}
            <span className="underline decoration-dotted underline-offset-2">
              {expanded ? 'Hide the history' : 'Show the history'}
            </span>
          </button>

          {confirming ? (
            <div className="flex items-center gap-2 text-[0.75rem]">
              <span className="text-chalk-dim">Clear this drill?</span>
              <button
                type="button"
                className="btn !min-h-0 border-bad !px-2 !py-0.5 !text-[0.75rem] text-bad hover:!bg-bad/15"
                onClick={() => {
                  onReset();
                  setConfirming(false);
                  setExpanded(false);
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
              className="text-[0.75rem] text-chalk-dim underline decoration-dotted underline-offset-2 hover:text-chalk disabled:no-underline disabled:opacity-40"
              onClick={() => setConfirming(true)}
              disabled={summary.n === 0}
            >
              Reset this drill
            </button>
          )}
        </div>
      </div>

      {expanded ? <HistoryChart attempts={attempts} rolling={rolling} /> : null}
    </section>
  );
}
