'use client';

import { useMemo, useState } from 'react';
import { CardButton } from '@/components/Card';
import { DrillShell, Hit, NextButton, Working } from './DrillShell';
import { useDrill } from './useDrill';
import { useKeys } from './useKeys';
import { dealHand, nameOf, shortOf } from '@/lib/trick';
import { rngFrom } from '@/lib/random';

export function HideDrill() {
  const d = useDrill('A', 'hide');
  const [answer, setAnswer] = useState<number | null>(null);

  const hand = useMemo(() => dealHand(rngFrom(d.seed)), [d.seed]);
  const total = hand.reduce((a, b) => a + b, 0);
  const i = total % 5;
  const closed = answer !== null;

  function submit(k: number) {
    if (closed) return;
    setAnswer(k);
    d.record(k === i);
  }

  function next() {
    setAnswer(null);
    d.next();
  }

  useKeys((key) => {
    if (!closed && /^[1-5]$/.test(key)) {
      submit(Number(key) - 1);
      return true;
    }
    if (closed && key === 'Enter') {
      next();
      return true;
    }
    return false;
  });

  return (
    <DrillShell
      prompt={
        <>
          Which of these five does the assistant hide? Add all five numbers, take mod 5, then count up from the lowest
          card starting at zero.
        </>
      }
      timer={d.timer}
      verdict={
        closed
          ? { ok: answer === i, text: answer === i ? 'Correct.' : `No - it is the ${nameOf(hand[i])}.` }
          : null
      }
      summary={d.summary}
      attempts={d.history.attempts}
      onReset={d.reset}
      onRemoveAttempt={d.remove}
      onRestoreAttempt={d.restore}
      footer={
        closed ? (
          <>
            <Working>
              <div>
                {hand.join(' + ')} = <Hit>{total}</Hit>, mod 5 = <Hit>{i}</Hit> &rarr; {i} up from the bottom &rarr;{' '}
                <Hit>{shortOf(hand[i])}</Hit>
              </div>
            </Working>
            <NextButton onClick={next} />
          </>
        ) : null
      }
    >
      <div className="flex flex-wrap gap-2">
        {hand.map((c, k) => (
          <CardButton
            key={c}
            value={c}
            disabled={closed && k !== i}
            picked={closed && k === i}
            onClick={() => submit(k)}
          />
        ))}
      </div>
    </DrillShell>
  );
}
