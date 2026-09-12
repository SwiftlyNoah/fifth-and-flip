'use client';

import { useMemo, useState } from 'react';
import { CardRow } from '@/components/Card';
import { DrillShell, Hit, NextButton, NumberRow, Working } from './DrillShell';
import { CoinPicker } from './CardPicker';
import { useDrill } from './useDrill';
import { useKeys } from './useKeys';
import { CODE, type Coin, coinName, dealHand, encode, flipCoin, shortOf } from '@/lib/trick';
import { rngFrom } from '@/lib/random';

export function ReadRowDrill() {
  const d = useDrill('M', 'readrow');
  const [m, setM] = useState<number | null>(null);
  const [coin, setCoin] = useState<Coin | null>(null);
  const [closed, setClosed] = useState(false);

  const { truth, e } = useMemo(() => {
    const rnd = rngFrom(d.seed);
    const hand = dealHand(rnd);
    const truth: Coin = flipCoin(rnd);
    return { truth, e: encode(hand, truth) };
  }, [d.seed]);

  const ready = m !== null && coin !== null;
  const ok = m === e.m && coin === truth;

  function submit() {
    if (closed || !ready) return;
    setClosed(true);
    d.record(m === e.m && coin === truth);
  }

  function next() {
    setM(null);
    setCoin(null);
    setClosed(false);
    d.next();
  }

  useKeys((key) => {
    if (closed) {
      if (key !== 'Enter') return false;
      next();
      return true;
    }
    if (/^[0-9]$/.test(key)) {
      setM(Number(key));
      return true;
    }
    if (key === 'h' || key === 'H') {
      setCoin('H');
      return true;
    }
    if (key === 't' || key === 'T') {
      setCoin('T');
      return true;
    }
    if (key === 'Enter' && ready) {
      submit();
      return true;
    }
    return false;
  });

  return (
    <DrillShell
      prompt={
        <>
          Just read the row. No arithmetic at all: the lowest card&rsquo;s slot gives the coin and the band, and the
          other three give <code className="tick">m mod 6</code>.
        </>
      }
      timer={d.timer}
      verdict={
        closed
          ? { ok, text: ok ? 'Correct.' : `No - m is ${e.m} and it was ${coinName(truth)}.` }
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
                <span className="lbl">lowest</span> {shortOf(e.shown[0])} in slot {e.pos} &rarr;{' '}
                <Hit>{coinName(truth)}</Hit>, {e.m < 6 ? 'm under 6' : 'add 6'}
              </div>
              <div>
                <span className="lbl">other three</span> {CODE[e.m % 6]} = {e.m % 6} &rarr; m = <Hit>{e.m}</Hit>
              </div>
            </Working>
            <NextButton onClick={next} />
          </>
        ) : null
      }
    >
      <CardRow layout={e.layout} highlightSlot={closed ? e.pos : undefined} />
      <div className="mt-3.5 text-[0.8rem] text-chalk-dim">m</div>
      <NumberRow lo={0} hi={9} onPick={setM} disabled={closed} selected={m} reveal={closed ? e.m : null} />
      <CoinPicker coin={coin} onChange={setCoin} disabled={closed} />
      <div className="mt-3.5">
        <button type="button" className="btn btn-go" onClick={submit} disabled={closed || !ready}>
          Call it
        </button>
      </div>
    </DrillShell>
  );
}
