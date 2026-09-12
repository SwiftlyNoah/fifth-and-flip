'use client';

/** The live question clock, in tenths. */
export function Clock({ ms, running }: { ms: number; running: boolean }) {
  return (
    <span
      className={`font-[family-name:var(--font-mono)] text-[0.95rem] tabular-nums transition-colors ${
        running ? 'text-brass' : 'text-chalk-dim'
      }`}
      aria-live="off"
      aria-label={`Elapsed ${(ms / 1000).toFixed(1)} seconds`}
    >
      {(ms / 1000).toFixed(1)}
      <span className="text-[0.75em] opacity-70">s</span>
    </span>
  );
}
