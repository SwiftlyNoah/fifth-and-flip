'use client';

import { useMemo, useState } from 'react';
import { CardRow } from '@/components/Card';
import { Hit } from './DrillShell';
import { CODE, type Coin, cardFrom, coinName, encode, parseHand, shortOf } from '@/lib/trick';

/** Not a drill: the arbiter. Type five cards, pick a coin, see the whole row. */
export function Solver() {
  const [text, setText] = useState('7C AD QH 3S 9S');
  const [coin, setCoin] = useState<Coin>('H');

  const hand = useMemo(() => parseHand(text), [text]);
  const result = useMemo(() => {
    if (!hand) return null;
    const e = encode(hand, coin);
    const cf = cardFrom(e.shown, e.m);
    return { e, cf, passed: cf.cps.filter((c) => cf.u >= c).length };
  }, [hand, coin]);

  return (
    <div className="rounded-b-md border border-t-0 border-felt-line bg-felt-deep p-5 sm:p-6">
      <p className="mb-4 max-w-[62ch] text-[0.93rem] text-chalk-dim">
        Settle an argument. Five cards separated by spaces, <code className="tick">T</code> for ten,{' '}
        <code className="tick">C D H S</code> for suits, <code className="tick">BJ</code> and{' '}
        <code className="tick">RJ</code> for the jokers.
      </p>

      <label className="block max-w-[340px]">
        <span className="sr-only">Five cards</span>
        <input
          className="field"
          value={text}
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          onChange={(ev) => setText(ev.target.value)}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(
          [
            ['H', 'Heads'],
            ['T', 'Tails'],
          ] as const
        ).map(([v, label]) => (
          <button key={v} type="button" className="btn" aria-pressed={coin === v} onClick={() => setCoin(v)}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {!result ? (
          <p className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold text-bad">
            That is not five different valid cards.
          </p>
        ) : (
          <>
            <div className="mb-2 text-[0.8rem] text-chalk-dim">Lay it down like this</div>
            <CardRow layout={result.e.layout} highlightSlot={result.e.pos} />

            <div className="worktable inset mt-5">
              <div>
                <span className="lbl">numbers</span> {hand!.map((v) => `${shortOf(v)}=${v}`).join('  ')}
              </div>
              <div>
                <span className="lbl">assistant</span> total {hand!.reduce((a, b) => a + b, 0)}, i ={' '}
                <Hit>{result.e.i}</Hit>, hide {shortOf(result.e.hidden)} = {result.e.hidden}, u ={' '}
                <Hit>{result.e.u}</Hit>, m = <Hit>{result.e.m}</Hit>, slot <Hit>{result.e.pos}</Hit>,{' '}
                {CODE[result.e.m % 6]}
              </div>
              <div>
                <span className="lbl">magician</span> shown sum {result.e.S}, start {result.e.start}, u ={' '}
                {result.cf.u}, checkpoints {result.cf.cps.join(', ')} pass {result.passed} &rarr;{' '}
                <Hit>{shortOf(result.cf.h)}</Hit>, {coinName(coin)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
