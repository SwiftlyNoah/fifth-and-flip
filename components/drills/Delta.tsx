'use client';

/**
 * A change against the previous window of the same size. Down is good for
 * times, up is good for accuracy, so each caller says which way is better.
 */
export function Delta({
  value,
  better,
  format,
  flatBelow,
}: {
  value: number | null;
  better: 'lower' | 'higher';
  format: (v: number) => string;
  /** changes smaller than this read as no change */
  flatBelow: number;
}) {
  if (value === null || !Number.isFinite(value)) return null;

  if (Math.abs(value) < flatBelow) {
    return <span className="text-[0.7rem] text-chalk-dim/70">level</span>;
  }

  const improving = better === 'lower' ? value < 0 : value > 0;

  return (
    <span className={`text-[0.7rem] tabular-nums ${improving ? 'text-good' : 'text-bad'}`}>
      {value < 0 ? '▾' : '▴'} {format(Math.abs(value))}
    </span>
  );
}
