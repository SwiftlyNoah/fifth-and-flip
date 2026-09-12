'use client';

import { useState } from 'react';
import { MAX_WINDOWS, WINDOW_MAX, WINDOW_MIN } from '@/lib/stats';

/**
 * Which trailing windows the bar reports on. A display preference, so it is
 * shared by every drill and both roles.
 */
export function WindowEditor({
  windows,
  onChange,
}: {
  windows: readonly number[];
  onChange: (next: number[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const full = windows.length >= MAX_WINDOWS;

  function add() {
    const value = Math.round(Number(draft));
    if (!Number.isFinite(value) || !draft.trim()) {
      setError(`A number between ${WINDOW_MIN} and ${WINDOW_MAX}.`);
      return;
    }
    if (value < WINDOW_MIN || value > WINDOW_MAX) {
      setError(`Between ${WINDOW_MIN} and ${WINDOW_MAX}.`);
      return;
    }
    if (windows.includes(value)) {
      setError('Already shown.');
      return;
    }
    onChange([...windows, value]);
    setDraft('');
    setError(null);
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.75rem]">
      <span className="text-chalk-dim">Windows</span>

      {windows.map((size) => (
        <span
          key={size}
          className="inline-flex items-center gap-1 rounded border border-felt-line bg-black/20 py-0.5 pr-1 pl-2 font-[family-name:var(--font-mono)] text-chalk"
        >
          {size}
          <button
            type="button"
            className="grid h-5 w-5 place-items-center rounded text-chalk-dim hover:text-bad disabled:opacity-30 disabled:hover:text-chalk-dim"
            aria-label={`Stop showing the last ${size}`}
            disabled={windows.length === 1}
            onClick={() => onChange(windows.filter((w) => w !== size))}
          >
            &times;
          </button>
        </span>
      ))}

      {adding ? (
        <span className="inline-flex items-center gap-1">
          <input
            className="field !w-16 !px-2 !py-0.5 !text-[0.75rem]"
            type="number"
            min={WINDOW_MIN}
            max={WINDOW_MAX}
            inputMode="numeric"
            autoFocus
            aria-label="Window size"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              } else if (e.key === 'Escape') {
                setAdding(false);
                setDraft('');
                setError(null);
              }
            }}
          />
          <button type="button" className="btn !min-h-0 !px-2 !py-0.5 !text-[0.75rem]" onClick={add}>
            Add
          </button>
          <button
            type="button"
            className="grid h-6 w-6 place-items-center text-chalk-dim hover:text-chalk"
            aria-label="Cancel"
            onClick={() => {
              setAdding(false);
              setDraft('');
              setError(null);
            }}
          >
            &times;
          </button>
        </span>
      ) : (
        <button
          type="button"
          className="rounded border border-dashed border-felt-line px-2 py-0.5 text-chalk-dim hover:border-brass hover:text-chalk disabled:opacity-40 disabled:hover:border-felt-line disabled:hover:text-chalk-dim"
          disabled={full}
          onClick={() => setAdding(true)}
          title={full ? `Six windows is the most the bar will show` : undefined}
        >
          + add
        </button>
      )}

      {error ? <span className="text-bad">{error}</span> : null}
    </div>
  );
}
