'use client';

import type { ReactNode } from 'react';
import { Clock } from './Clock';
import { StatsPanel } from './StatsPanel';
import type { Attempt, Summary } from '@/lib/stats';

export interface Verdict {
  ok: boolean;
  text: string;
}

export function DrillShell({
  prompt,
  timer,
  verdict,
  children,
  footer,
  summary,
  attempts,
  onReset,
  onRemoveAttempt,
  onRestoreAttempt,
}: {
  prompt: ReactNode;
  timer: { elapsed: number; running: boolean };
  verdict: Verdict | null;
  children: ReactNode;
  footer?: ReactNode;
  summary: Summary;
  attempts: readonly Attempt[];
  onReset: () => void;
  onRemoveAttempt: (index: number) => void;
  onRestoreAttempt: (index: number, attempt: Attempt) => void;
}) {
  return (
    <div className="rounded-b-md border border-t-0 border-felt-line bg-felt-deep p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="max-w-[62ch] text-[0.93rem] text-chalk-dim">{prompt}</p>
        <Clock ms={timer.elapsed} running={timer.running} />
      </div>

      {children}

      <div
        className="mt-4 min-h-[1.6em] font-[family-name:var(--font-display)] text-[1.15rem] font-semibold"
        role="status"
        aria-live="polite"
      >
        {verdict ? (
          <span className={verdict.ok ? 'text-good' : 'text-bad'}>{verdict.text}</span>
        ) : null}
      </div>

      {footer}

      <StatsPanel
        summary={summary}
        attempts={attempts}
        onReset={onReset}
        onRemoveAttempt={onRemoveAttempt}
        onRestoreAttempt={onRestoreAttempt}
      />
    </div>
  );
}

/** The collapsible step-by-step numbers. This reveal is the teaching surface. */
export function Working({ children }: { children: ReactNode }) {
  return (
    <details className="mt-3 text-[0.88rem]" open>
      <summary className="cursor-pointer text-[0.86rem] text-brass marker:text-brass">
        Show the working
      </summary>
      <div className="worktable mt-2.5 inset">{children}</div>
    </details>
  );
}

export function WorkLine({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div>
      {label ? <span className="lbl">{label}</span> : null} {children}
    </div>
  );
}

export function Hit({ children }: { children: ReactNode }) {
  return <span className="hit">{children}</span>;
}

export function NextButton({ onClick, label = 'Next hand' }: { onClick: () => void; label?: string }) {
  // Focus lands here so the keyboard path carries on, but without the scroll
  // jump autoFocus would cause at the bottom of a tall drill.
  const focus = (node: HTMLButtonElement | null) => node?.focus({ preventScroll: true });

  return (
    <div className="mt-3">
      <button type="button" className="btn btn-go" onClick={onClick} ref={focus}>
        {label} <span className="ml-2 text-[0.75rem] opacity-70">&crarr;</span>
      </button>
    </div>
  );
}

/** 0-9 (or 0-4) answer buttons. The matching number key also answers. */
export function NumberRow({
  lo,
  hi,
  onPick,
  disabled = false,
  selected,
  reveal,
}: {
  lo: number;
  hi: number;
  onPick: (k: number) => void;
  disabled?: boolean;
  selected?: number | null;
  /** the right answer, highlighted once the question is closed */
  reveal?: number | null;
}) {
  const ks: number[] = [];
  for (let k = lo; k <= hi; k++) ks.push(k);

  return (
    <div className="mt-3.5 flex flex-wrap gap-1.5">
      {ks.map((k) => (
        <button
          key={k}
          type="button"
          className={`btn btn-mono ${
            reveal === k ? '!border-good !text-good !opacity-100 !bg-good/10' : ''
          }`}
          aria-pressed={selected === k ? true : undefined}
          disabled={disabled}
          onClick={() => onPick(k)}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

export function Given({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3.5 font-[family-name:var(--font-mono)] text-[0.95rem] text-brass">{children}</p>
  );
}
