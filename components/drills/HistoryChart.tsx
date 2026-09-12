'use client';

import { useMemo } from 'react';
import { type Attempt, formatMs, formatPct, rollingAverage } from '@/lib/stats';
import { useMeasuredWidth } from './useMeasuredWidth';

const H = 210;
const PAD = { top: 12, right: 10, bottom: 24, left: 46 };

/** 0.5s, 1s, 2s, 5s, 10s, 15s, 30s, 1m, 2m: whatever keeps four tidy gridlines. */
const STEPS = [500, 1000, 2000, 5000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000];

function niceCeiling(maxMs: number, divisions: number): number {
  const target = maxMs / divisions;
  const step = STEPS.find((s) => s >= target) ?? STEPS[STEPS.length - 1];
  return step * divisions;
}

/**
 * The whole history: every attempt as a point, with a rolling average drawn
 * through them. The y axis starts at zero, so a line that sinks across the
 * chart is a real improvement rather than a rescaled one.
 */
export function HistoryChart({
  attempts,
  rolling,
  selected,
  onSelect,
}: {
  attempts: readonly Attempt[];
  rolling: number;
  /** index into `attempts`, or null */
  selected: number | null;
  onSelect: (index: number | null) => void;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>(640);

  const model = useMemo(() => {
    const n = attempts.length;
    if (n < 2) return null;

    const divisions = 4;
    const top = niceCeiling(Math.max(...attempts.map((a) => a.ms)), divisions);
    const roll = rollingAverage(attempts, rolling);

    // The ends worth comparing: at least the rolling window, and a tenth of a
    // long history, but never more than half of it so the two never overlap.
    const span = Math.min(Math.max(rolling, Math.ceil(n / 10)), Math.floor(n / 2));
    const head = attempts.slice(0, span);
    const tail = attempts.slice(n - span);
    const headAvg = head.reduce((a, b) => a + b.ms, 0) / span;
    const tailAvg = tail.reduce((a, b) => a + b.ms, 0) / span;

    return {
      n,
      top,
      roll,
      span,
      headAvg,
      tailAvg,
      shift: (tailAvg - headAvg) / headAvg,
      headAcc: (100 * head.filter((a) => a.correct).length) / span,
      tailAcc: (100 * tail.filter((a) => a.correct).length) / span,
      ticks: Array.from({ length: divisions + 1 }, (_, k) => (top / divisions) * k),
    };
  }, [attempts, rolling]);

  const plotW = Math.max(120, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;

  if (!model) {
    return (
      <div ref={ref} className="inset mt-3 text-[0.8rem] text-chalk-dim">
        Two attempts and the chart appears.
      </div>
    );
  }

  const x = (i: number) => PAD.left + (model.n === 1 ? plotW / 2 : (i * plotW) / (model.n - 1));
  const y = (ms: number) => PAD.top + plotH - (Math.min(ms, model.top) / model.top) * plotH;

  const rollPath = model.roll.map((ms, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(ms).toFixed(1)}`).join(' ');
  const dot = model.n > 160 ? 1.1 : model.n > 60 ? 1.5 : 2;
  const faster = model.shift < -0.02;
  const slower = model.shift > 0.02;

  /** The attempt nearest a pointer, so the whole column is the tap target. */
  const indexAt = (clientX: number, svg: SVGSVGElement) => {
    const box = svg.getBoundingClientRect();
    const t = (clientX - box.left - PAD.left) / plotW;
    return Math.max(0, Math.min(model.n - 1, Math.round(t * (model.n - 1))));
  };

  const step = (by: number) => {
    const from = selected ?? (by > 0 ? -1 : model.n);
    onSelect(Math.max(0, Math.min(model.n - 1, from + by)));
  };

  const picked = selected !== null && selected >= 0 && selected < model.n ? attempts[selected] : null;

  return (
    <div ref={ref} className="mt-3">
      <svg
        width={width}
        height={H}
        tabIndex={0}
        role="group"
        aria-label={`Attempt times over ${model.n} attempts. The first ${model.span} averaged ${formatMs(model.headAvg)} and the last ${model.span} averaged ${formatMs(model.tailAvg)}. Arrow keys pick an attempt.`}
        className="chart-surface touch-none rounded"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
          } else if (e.key === 'Home') {
            e.preventDefault();
            onSelect(0);
          } else if (e.key === 'End') {
            e.preventDefault();
            onSelect(model.n - 1);
          } else if (e.key === 'Escape') {
            onSelect(null);
          }
        }}
      >
        {model.ticks.map((ms) => (
          <g key={ms}>
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={y(ms)}
              y2={y(ms)}
              stroke="var(--color-felt-line)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(ms)}
              textAnchor="end"
              dominantBaseline="middle"
              className="font-[family-name:var(--font-mono)]"
              fontSize="10"
              fill="var(--color-chalk-dim)"
            >
              {formatMs(ms)}
            </text>
          </g>
        ))}

        {/* every attempt */}
        {attempts.map((a, i) =>
          a.correct ? (
            <circle key={i} cx={x(i)} cy={y(a.ms)} r={dot} fill="var(--color-chalk-dim)" fillOpacity="0.65" />
          ) : (
            <g key={i} stroke="var(--color-bad)" strokeWidth="1.3" strokeLinecap="round">
              <line x1={x(i) - 2.4} y1={y(a.ms) - 2.4} x2={x(i) + 2.4} y2={y(a.ms) + 2.4} />
              <line x1={x(i) - 2.4} y1={y(a.ms) + 2.4} x2={x(i) + 2.4} y2={y(a.ms) - 2.4} />
            </g>
          ),
        )}

        {/* the trend */}
        <path d={rollPath} fill="none" stroke="var(--color-brass)" strokeWidth="1.8" strokeLinejoin="round" />

        {picked ? (
          <g>
            <line
              x1={x(selected!)}
              x2={x(selected!)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--color-brass)"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
            <circle
              cx={x(selected!)}
              cy={y(picked.ms)}
              r={5}
              fill="none"
              stroke="var(--color-brass)"
              strokeWidth="1.6"
            />
          </g>
        ) : null}

        <rect
          x={PAD.left - 6}
          y={PAD.top}
          width={plotW + 12}
          height={plotH}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onPointerDown={(e) => {
            e.currentTarget.ownerSVGElement?.focus({ preventScroll: true });
            onSelect(indexAt(e.clientX, e.currentTarget.ownerSVGElement!));
          }}
        />

        <text
          x={PAD.left}
          y={H - 8}
          className="font-[family-name:var(--font-mono)]"
          fontSize="10"
          fill="var(--color-chalk-dim)"
        >
          1
        </text>
        <text
          x={PAD.left + plotW}
          y={H - 8}
          textAnchor="end"
          className="font-[family-name:var(--font-mono)]"
          fontSize="10"
          fill="var(--color-chalk-dim)"
        >
          {model.n}
        </text>
      </svg>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[0.76rem] text-chalk-dim">
        <span>
          <span className="mr-1.5 text-brass">&#9472;</span>
          rolling average of {rolling}
        </span>
        <span>
          <span className="mr-1.5 text-bad">&times;</span>
          wrong answer
        </span>
        <span>
          First {model.span} <span className="font-[family-name:var(--font-mono)]">{formatMs(model.headAvg)}</span> at{' '}
          {formatPct(model.headAcc)} &rarr; last {model.span}{' '}
          <span className="font-[family-name:var(--font-mono)]">{formatMs(model.tailAvg)}</span> at{' '}
          {formatPct(model.tailAcc)}
          {faster || slower ? (
            <span className={faster ? 'text-good' : 'text-bad'}>
              {' '}
              ({Math.abs(Math.round(model.shift * 100))}% {faster ? 'faster' : 'slower'})
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
