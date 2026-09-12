'use client';

import { useMemo, useState } from 'react';
import { CardRow } from '@/components/Card';
import { DrillShell, Hit, NextButton, Working } from './DrillShell';
import { CardPicker, CoinPicker, EMPTY_PICK, type Pick, pickValue } from './CardPicker';
import { useDrill } from './useDrill';
import { useKeys } from './useKeys';
import { CODE, type Coin, cardFrom, coinName, dealHand, encode, flipCoin, nameOf, shortOf } from '@/lib/trick';
import { rngFrom } from '@/lib/random';

export function CallItDrill() {
  const d = useDrill('M', 'call');
  const [pick, setPick] = useState<Pick>(EMPTY_PICK);
  const [coin, setCoin] = useState<Coin | null>(null);
  const [closed, setClosed] = useState(false);

  const { truth, e } = useMemo(() => {
    const rnd = rngFrom(d.seed);
    const hand = dealHand(rnd);
    const truth: Coin = flipCoin(rnd);
    return { truth, e: encode(hand, truth) };
  }, [d.seed]);

  const value = pickValue(pick);
  const ready = value !== null && coin !== null;
  const ok = value === e.hidden && coin === truth;

  function submit() {
    if (closed || !ready) return;
    setClosed(true);
    d.record(value === e.hidden && coin === truth);
  }

  function next() {
    setPick(EMPTY_PICK);
    setCoin(null);
    setClosed(false);
    d.next();
  }

  useKeys((key) => {
    if (closed && key === 'Enter') return next();
    if (closed) return;
    if (key === 'Enter' && ready) submit();
  });

  const cf = cardFrom(e.shown, e.m);
  const passed = cf.cps.filter((c) => cf.u >= c).length;

  return (
    <DrillShell
      prompt={<>Your assistant has laid down this row. Name the hidden card and call the coin.</>}
      timer={d.timer}
      verdict={
        closed
          ? {
              ok,
              text: ok
                ? `Correct - ${nameOf(e.hidden)}, ${coinName(truth)}.`
                : `No - it was the ${nameOf(e.hidden)}, ${coinName(truth)}.`,
            }
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
                <span className="lbl">steps 1&ndash;2</span> {shortOf(e.shown[0])} in slot {e.pos} &rarr;{' '}
                {coinName(truth)}, {e.m < 6 ? 'under 6' : 'add 6'}; other three {CODE[e.m % 6]} = {e.m % 6} &rarr; m ={' '}
                <Hit>{e.m}</Hit>
              </div>
              <div>
                <span className="lbl">step 3</span> {e.shown.join(' + ')} = {e.S}, mod 5 = {e.S % 5} &rarr; start ={' '}
                <Hit>{e.start}</Hit>
              </div>
              <div>
                <span className="lbl">step 4</span> u = 5&times;{e.m} + {e.start} = <Hit>{cf.u}</Hit>
              </div>
              <div>
                <span className="lbl">step 5</span> checkpoints {cf.cps.join(', ')} &rarr; passes {passed} &rarr;{' '}
                <Hit>{cf.h}</Hit> = <Hit>{shortOf(cf.h)}</Hit>
              </div>
            </Working>
            <NextButton onClick={next} />
          </>
        ) : null
      }
    >
      <CardRow layout={e.layout} highlightSlot={closed ? e.pos : undefined} />
      <CardPicker pick={pick} onChange={setPick} disabled={closed} />
      <CoinPicker coin={coin} onChange={setCoin} disabled={closed} />
      <div className="mt-3.5">
        <button type="button" className="btn btn-go" onClick={submit} disabled={closed || !ready}>
          Call it
        </button>
      </div>
    </DrillShell>
  );
}
