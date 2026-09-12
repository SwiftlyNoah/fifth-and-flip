'use client';

import { useMemo, useState } from 'react';
import { Hand } from '@/components/Card';
import { DrillShell, Given, Hit, NextButton, NumberRow, Working } from './DrillShell';
import { useDrill } from './useDrill';
import { useKeys } from './useKeys';
import { blockOf, dealHand, encode, shortOf } from '@/lib/trick';
import { rngFrom } from '@/lib/random';

export function FindMDrill() {
  const d = useDrill('A', 'findm');
  const [answer, setAnswer] = useState<number | null>(null);

  const e = useMemo(() => encode(dealHand(rngFrom(d.seed)), 'H'), [d.seed]);
  const closed = answer !== null;

  function submit(k: number) {
    if (closed) return;
    setAnswer(k);
    d.record(k === e.m);
  }

  function next() {
    setAnswer(null);
    d.next();
  }

  useKeys((key) => {
    if (!closed && /^[0-9]$/.test(key)) submit(Number(key));
    else if (closed && key === 'Enter') next();
  });

  return (
    <DrillShell
      prompt={
        <>
          You have already worked out that <strong className="text-chalk">this card</strong> is the one to hide, and the
          hide index is given. Take <code className="tick">u</code> = its number minus <code className="tick">i</code>,
          then say which block of five <code className="tick">u</code> lands in.
        </>
      }
      timer={d.timer}
      verdict={closed ? { ok: answer === e.m, text: answer === e.m ? 'Correct.' : `No - m is ${e.m}.` } : null}
      summary={d.summary}
      attempts={d.history.attempts}
      onReset={d.reset}
      footer={
        closed ? (
          <>
            <Working>
              <div>
                <span className="lbl">u</span> {shortOf(e.hidden)} = {e.hidden}, so u = {e.hidden} &minus; {e.i} ={' '}
                <Hit>{e.u}</Hit>
              </div>
              <div>
                <span className="lbl">block</span> {e.u} sits in {blockOf(e.u)} &rarr; m = <Hit>{e.m}</Hit>
              </div>
            </Working>
            <NextButton onClick={next} />
          </>
        ) : null
      }
    >
      <div className="flex flex-wrap items-start gap-x-7 gap-y-4">
        <div>
          <div className="mb-1.5 text-[0.8rem] text-chalk-dim">Going face up</div>
          <Hand values={e.shown} size="sm" />
        </div>
        <div>
          <div className="mb-1.5 text-[0.8rem] text-chalk-dim">Hiding</div>
          <Hand values={[e.hidden]} size="sm" />
        </div>
      </div>
      <Given>i = {e.i}</Given>
      <NumberRow lo={0} hi={9} onPick={submit} disabled={closed} selected={answer} reveal={closed ? e.m : null} />
    </DrillShell>
  );
}
