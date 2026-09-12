'use client';

import { useMemo, useState } from 'react';
import { CardButton, GhostCard, PlayingCard } from '@/components/Card';
import { DrillShell, Hit, NextButton, Working } from './DrillShell';
import { useDrill } from './useDrill';
import { useKeys } from './useKeys';
import { CODE, type Coin, blockOf, coinName, dealHand, decode, encode, flipCoin, nameOf, shortOf } from '@/lib/trick';
import { rngFrom } from '@/lib/random';

export function LayDrill() {
  const d = useDrill('A', 'lay');
  const [placed, setPlaced] = useState<number[]>([]);
  const [closed, setClosed] = useState(false);

  const { hand, coin, e } = useMemo(() => {
    const rnd = rngFrom(d.seed);
    const hand = dealHand(rnd);
    const coin: Coin = flipCoin(rnd);
    return { hand, coin, e: encode(hand, coin) };
  }, [d.seed]);

  const full = placed.length === 4;
  const got = closed && full ? decode(placed) : null;
  const trueHidden = hand.find((c) => !placed.includes(c));
  const ok = got !== null && got.hidden === trueHidden && got.coin === coin;

  function submit() {
    if (closed || !full) return;
    setClosed(true);
    const reading = decode(placed);
    d.record(reading.hidden === hand.find((c) => !placed.includes(c)) && reading.coin === coin);
  }

  function next() {
    setPlaced([]);
    setClosed(false);
    d.next();
  }

  useKeys((key) => {
    if (closed) {
      if (key !== 'Enter') return false;
      next();
      return true;
    }
    if (key === 'Enter' && full) {
      submit();
      return true;
    }
    if (/^[1-5]$/.test(key)) {
      const c = hand[Number(key) - 1];
      if (c != null && !placed.includes(c) && placed.length < 4) setPlaced([...placed, c]);
      return true;
    }
    if (key === 'Backspace' || key === 'Delete') {
      setPlaced(placed.slice(0, -1));
      return true;
    }
    return false;
  });

  return (
    <DrillShell
      prompt={
        <>
          The spectator&rsquo;s five cards, and the coin came up{' '}
          <strong className="text-chalk">{coinName(coin)}</strong>. Leave one out and tap the other four in the order
          you would lay them down.
        </>
      }
      timer={d.timer}
      verdict={
        closed
          ? {
              ok,
              text: ok
                ? 'Correct - that row reads back clean.'
                : `No. Your row says ${got?.hidden != null ? nameOf(got.hidden) : 'nothing valid'} and ${coinName(got!.coin)}.`,
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
                <span className="lbl">step 2</span> total {hand.reduce((a, b) => a + b, 0)}, mod 5 = <Hit>{e.i}</Hit>{' '}
                &rarr; hide <Hit>{shortOf(e.hidden)}</Hit> = {e.hidden}
              </div>
              <div>
                <span className="lbl">step 3</span> u = {e.hidden} &minus; {e.i} = <Hit>{e.u}</Hit> &rarr;{' '}
                {blockOf(e.u)} &rarr; m = <Hit>{e.m}</Hit>
              </div>
              <div>
                <span className="lbl">step 4</span> {coinName(coin)}, m {e.m < 6 ? 'under 6' : '6 or more'} &rarr;
                lowest card {shortOf(e.shown[0])} in <Hit>slot {e.pos}</Hit>
              </div>
              <div>
                <span className="lbl">step 5</span> {e.m} mod 6 = {e.m % 6} &rarr; <Hit>{CODE[e.m % 6]}</Hit>
              </div>
              <div>
                <span className="lbl">row</span> <Hit>{e.layout.map(shortOf).join('  ')}</Hit>
              </div>
            </Working>
            <NextButton onClick={next} />
          </>
        ) : null
      }
    >
      <div className="flex flex-wrap gap-2">
        {hand.map((c) =>
          closed ? (
            // once the row is down, the card left behind is the interesting one
            <PlayingCard key={c} value={c} dimmed={c !== trueHidden} picked={c === trueHidden} />
          ) : (
            <CardButton
              key={c}
              value={c}
              disabled={placed.includes(c) || placed.length >= 4}
              onClick={() => setPlaced([...placed, c])}
            />
          ),
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-1.5">
            {placed[s] == null ? (
              <GhostCard label={`slot ${s + 1}`} />
            ) : closed ? (
              <PlayingCard value={placed[s]} />
            ) : (
              <CardButton value={placed[s]} onClick={() => setPlaced(placed.filter((_, k) => k !== s))} />
            )}
            <span
              className={`font-[family-name:var(--font-mono)] text-[0.72rem] ${
                closed && s + 1 === e.pos ? 'text-brass' : 'text-chalk-dim'
              }`}
            >
              {s + 1}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        <button type="button" className="btn" onClick={() => setPlaced([])} disabled={closed || placed.length === 0}>
          Clear row
        </button>
        <button type="button" className="btn btn-go" onClick={submit} disabled={closed || !full}>
          Lay it down
        </button>
      </div>
    </DrillShell>
  );
}
