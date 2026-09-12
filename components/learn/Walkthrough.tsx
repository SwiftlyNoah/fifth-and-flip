'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PlayingCard } from '@/components/Card';
import { Figure } from './Figures';
import {
  CARD_H,
  CARD_W,
  HAND,
  SLOT_X,
  SLOT_Y,
  STAGE_H,
  STAGE_W,
  STEPS,
  positions,
} from './steps';

const LAST = STEPS.length;

export function Walkthrough() {
  const [step, setStep] = useState(1);
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, left: 16 });

  // The stage is laid out in fixed design pixels, then scaled to fit and
  // centred in whatever width it is given.
  useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const measure = () => {
      const w = node.clientWidth;
      const scale = Math.min(1, (w - 32) / STAGE_W);
      setFit({ scale, left: Math.max(16, (w - STAGE_W * scale) / 2) });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    measure();
    return () => ro.disconnect();
  }, []);

  const go = useCallback((n: number) => setStep(Math.min(LAST, Math.max(1, n))), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setStep((s) => Math.min(LAST, s + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep((s) => Math.max(1, s - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setStep(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setStep(LAST);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const spots = positions(step);
  const current = STEPS[step - 1];
  const spring = reduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 340, damping: 34, mass: 0.85 };

  return (
    <div>
      {/* ------------------------------------------------------------ stage */}
      <div
        ref={wrapRef}
        className="w-full overflow-hidden rounded-md border border-felt-line bg-felt-deep"
        style={{ height: STAGE_H * fit.scale + 32 }}
      >
        <div
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${fit.scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            marginTop: 16,
            marginLeft: fit.left,
          }}
        >
          {/* empty slot outlines, while the row is being built */}
          <AnimatePresence>
            {step === 4
              ? SLOT_X.map((x, k) => (
                  <motion.div
                    key={`ghost-${k}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: k === 1 ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    className="card-face card-ghost absolute"
                    style={{ left: x, top: SLOT_Y, width: CARD_W, height: CARD_H }}
                  >
                    slot {k + 1}
                  </motion.div>
                ))
              : null}
          </AnimatePresence>

          {/* slot numbers, once there is a row */}
          <AnimatePresence>
            {step >= 4 && step <= 9
              ? SLOT_X.map((x, k) => (
                  <motion.div
                    key={`n-${k}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    className={`absolute text-center font-[family-name:var(--font-mono)] text-[0.72rem] ${
                      (step === 4 || step === 6) && k === 1 ? 'text-brass' : 'text-chalk-dim'
                    }`}
                    style={{ left: x, top: SLOT_Y + CARD_H + 8, width: CARD_W }}
                  >
                    {k + 1}
                  </motion.div>
                ))
              : null}
          </AnimatePresence>

          {/* the five cards. Each one is a single element that travels. */}
          {HAND.map((v) => {
            const s = spots[v];
            return (
              <motion.div
                key={v}
                className="absolute top-0 left-0"
                style={{ transformOrigin: 'top left' }}
                initial={false}
                animate={{ x: s.x, y: s.y, scale: s.scale, opacity: s.opacity }}
                transition={spring}
              >
                <div className={s.ring ? 'rounded-[6px] ring-2 ring-brass ring-offset-2 ring-offset-felt-deep' : ''}>
                  <PlayingCard value={v} size="lg" />
                </div>
                <AnimatePresence>
                  {step <= 3 ? (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.06 * HAND.indexOf(v) }}
                      className="mt-2 text-center font-[family-name:var(--font-mono)] text-[0.85rem] text-brass"
                      style={{ width: CARD_W }}
                    >
                      {v}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------ panel */}
      <div className="mt-5 min-h-[12.5rem]">
        <div className="flex items-baseline gap-2.5">
          <span
            className={`rounded px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.09em] ${
              current.side === 'Assistant' ? 'bg-brass/20 text-brass' : 'bg-chalk/15 text-chalk'
            }`}
          >
            {current.side}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[0.76rem] text-chalk-dim">
            step {current.n} of 5
          </span>
        </div>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold leading-tight text-stock">
          {current.title}
        </h2>
        <p className="mt-1 max-w-[58ch] text-chalk">{current.line}</p>

        <AnimatePresence mode="wait">
          <Figure key={current.figure} kind={current.figure} />
        </AnimatePresence>
      </div>

      {/* --------------------------------------------------------- controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" role="group" aria-label="Steps">
          {STEPS.map((s, k) => (
            <button
              key={k}
              type="button"
              aria-label={`${s.side} step ${s.n}: ${s.title}`}
              aria-current={k + 1 === step ? 'step' : undefined}
              onClick={() => go(k + 1)}
              className="group grid h-6 w-4 place-items-center"
            >
              <span
                className={`block rounded-full transition-all ${
                  k + 1 === step
                    ? 'h-2.5 w-2.5 bg-brass'
                    : k + 1 < step
                      ? 'h-1.5 w-1.5 bg-chalk-dim group-hover:bg-chalk'
                      : 'h-1.5 w-1.5 bg-felt-line group-hover:bg-chalk-dim'
                } ${s.side === 'Magician' && k === 5 ? 'ml-2' : ''}`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={() => go(step - 1)} disabled={step === 1}>
            Back
          </button>
          {step < LAST ? (
            <button type="button" className="btn btn-go" onClick={() => go(step + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => go(1)}>
              Start over
            </button>
          )}
        </div>
      </div>

      {step === LAST ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          className="inset mt-6"
        >
          <p className="text-[0.95rem] text-chalk">
            That is the whole method. Ten steps, five each side, and the pair of you only ever needs one of them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/?role=A#trainer" className="btn btn-go no-underline">
              Drill the assistant side
            </Link>
            <Link href="/?role=M#trainer" className="btn no-underline">
              Drill the magician side
            </Link>
            <Link href="/reference" className="btn no-underline">
              Crib sheet
            </Link>
          </div>
        </motion.div>
      ) : null}

      <p className="mt-5 text-[0.78rem] text-chalk-dim">
        Arrow keys step through. The hand is always the same one, so the numbers are worth memorising.
      </p>
    </div>
  );
}
