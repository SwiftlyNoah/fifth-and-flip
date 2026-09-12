'use client';

import { useMemo, useState } from 'react';
import { Hand } from '@/components/Card';
import { DrillShell, Given, Hit, NextButton, Working } from './DrillShell';
import { CardPicker, EMPTY_PICK, type Pick, pickValue } from './CardPicker';
import { useDrill } from './useDrill';
import { useKeys } from './useKeys';
import { cardFrom, dealHand, encode, flipCoin, nameOf, shortOf } from '@/lib/trick';
import { rngFrom } from '@/lib/random';

export function FindCardDrill() {
  const d = useDrill('M', 'findcard');
  const [pick, setPick] = useState<Pick>(EMPTY_PICK);
  const [closed, setClosed] = useState(false);

  const e = useMemo(() => {
    const rnd = rngFrom(d.seed);
    const hand = dealHand(rnd);
    return encode(hand, flipCoin(rnd));
  }, [d.seed]);
  const value = pickValue(pick);
  const ok = value === e.hidden;

  function submit() {
    if (closed || value === null) return;
    setClosed(true);
    d.record(value === e.hidden);
  }

  function next() {
    setPick(EMPTY_PICK);
    setClosed(false);
    d.next();
  }

  useKeys((key) => {
    if (key !== 'Enter') return false;
    if (closed) {
      next();
      return true;
    }
    if (value !== null) {
      submit();
      return true;
    }
    return false;
  });

  const cf = cardFrom(e.shown, e.m);
  const passed = cf.cps.filter((c) => cf.u >= c).length;

  return (
    <DrillShell
      prompt={
        <>
          You have already read <code className="tick">m</code> off the row. Now turn it into a card: add the four
          numbers for <code className="tick">start</code>, get <code className="tick">u</code>, then push it past the
          checkpoints.
        </>
      }
      timer={d.timer}
      verdict={
        closed
          ? { ok, text: ok ? `Correct - the ${nameOf(e.hidden)}.` : `No - it was the ${nameOf(e.hidden)}.` }
          : null
      }
      summary={d.summary}
      attempts={d.history.attempts}
      onReset={d.reset}
      footer={
        closed ? (
          <>
            <Working>
              <div>
                <span className="lbl">start</span> {e.shown.join(' + ')} = {e.S}, mod 5 = {e.S % 5} &rarr; start ={' '}
                <Hit>{e.start}</Hit>
              </div>
              <div>
                <span className="lbl">u</span> 5&times;{e.m} + {e.start} = <Hit>{cf.u}</Hit>
              </div>
              <div>
                <span className="lbl">checkpoints</span> {cf.cps.join(', ')} &rarr; {cf.u} passes {passed} &rarr;{' '}
                {cf.u} + {passed} = <Hit>{cf.h}</Hit> = <Hit>{shortOf(cf.h)}</Hit>
              </div>
            </Working>
            <NextButton onClick={next} />
          </>
        ) : null
      }
    >
      <Hand values={e.shown} size="sm" />
      <Given>m = {e.m}</Given>
      <CardPicker pick={pick} onChange={setPick} disabled={closed} />
      <div className="mt-3.5">
        <button type="button" className="btn btn-go" onClick={submit} disabled={closed || value === null}>
          Name it
        </button>
      </div>
    </DrillShell>
  );
}
