'use client';

import type { Attempt } from '@/lib/stats';

const W = 168;
const H = 34;
const PAD = 4;

/** The last ~24 attempt times. Wrong answers are marked, not hidden. */
export function Sparkline({ attempts }: { attempts: readonly Attempt[] }) {
  const recent = attempts.slice(-24);

  if (recent.length < 2) {
    return (
      <div
        className="flex items-center text-[0.72rem] text-chalk-dim"
        style={{ width: W, height: H }}
      >
        {recent.length === 0 ? 'no attempts yet' : 'one attempt so far'}
      </div>
    );
  }

  const times = recent.map((a) => a.ms);
  const lo = Math.min(...times);
  const hi = Math.max(...times);
  const span = hi - lo || 1;

  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (recent.length - 1);
  const y = (ms: number) => H - PAD - ((ms - lo) / span) * (H - 2 * PAD);

  const path = recent.map((a, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(a.ms).toFixed(1)}`).join(' ');

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Times for the last ${recent.length} attempts, ${recent.filter((a) => !a.correct).length} of them wrong`}
      className="overflow-visible"
    >
      <path d={path} fill="none" stroke="var(--color-chalk-dim)" strokeWidth="1.25" strokeLinejoin="round" strokeOpacity="0.7" />
      {recent.map((a, i) =>
        a.correct ? (
          <circle key={i} cx={x(i)} cy={y(a.ms)} r={1.6} fill="var(--color-brass)" />
        ) : (
          <g key={i} stroke="var(--color-bad)" strokeWidth="1.4" strokeLinecap="round">
            <line x1={x(i) - 2.6} y1={y(a.ms) - 2.6} x2={x(i) + 2.6} y2={y(a.ms) + 2.6} />
            <line x1={x(i) - 2.6} y1={y(a.ms) + 2.6} x2={x(i) + 2.6} y2={y(a.ms) - 2.6} />
          </g>
        ),
      )}
    </svg>
  );
}
