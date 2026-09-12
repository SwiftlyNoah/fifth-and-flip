'use client';

import { useMemo, useState } from 'react';
import { PlayingCard } from '@/components/Card';
import { DrillShell, Hit, NextButton, NumberRow, Working } from './DrillShell';
import { useDrill } from './useDrill';
import { useKeys } from './useKeys';
import type { Role } from '@/lib/stats';
import { N, isJoker, nameOf, rankOf, shortOf, suitOf } from '@/lib/trick';
import { rngFrom } from '@/lib/random';

export function ValuesDrill({ role }: { role: Role }) {
  const d = useDrill(role, 'values');
  const [answer, setAnswer] = useState<number | null>(null);

  const card = useMemo(() => 1 + Math.floor(rngFrom(d.seed)() * N), [d.seed]);
  const truth = card % 5;
  const closed = answer !== null;

  function submit(k: number) {
    if (closed) return;
    setAnswer(k);
    d.record(k === truth);
  }

  function next() {
    setAnswer(null);
    d.next();
  }

  useKeys((key) => {
    if (!closed && /^[0-4]$/.test(key)) {
      submit(Number(key));
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
          What is this card&rsquo;s number <strong className="text-chalk">mod 5</strong>? Rank remainder, plus 0 for
          clubs, 3 for diamonds, 1 for hearts, 4 for spades. Black joker is 53, red is 54.
        </>
      }
      timer={d.timer}
      verdict={closed ? { ok: answer === truth, text: answer === truth ? 'Correct.' : `No - it is ${truth}.` } : null}
      summary={d.summary}
      attempts={d.history.attempts}
      onReset={d.reset}
      onRemoveAttempt={d.remove}
      onRestoreAttempt={d.restore}
      footer={
        closed ? (
          <>
            <Working>
              {isJoker(card) ? (
                <div>
                  {nameOf(card)} = <Hit>{card}</Hit>, and {card} mod 5 = <Hit>{truth}</Hit>
                </div>
              ) : (
                <div>
                  {shortOf(card)} = {rankOf(card) + 1} + {13 * suitOf(card)} = <Hit>{card}</Hit>, and {card} mod 5 ={' '}
                  <Hit>{truth}</Hit>
                </div>
              )}
            </Working>
            <NextButton onClick={next} label="Next card" />
          </>
        ) : null
      }
    >
      <PlayingCard value={card} />
      <NumberRow lo={0} hi={4} onPick={submit} disabled={closed} selected={answer} reveal={closed ? truth : null} />
    </DrillShell>
  );
}
