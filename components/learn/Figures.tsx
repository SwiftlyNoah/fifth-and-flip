'use client';

import { motion } from 'motion/react';
import { CODE, shortOf } from '@/lib/trick';
import { HAND } from './steps';

function Cell({
  children,
  on = false,
  className = '',
}: {
  children: React.ReactNode;
  on?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`rounded px-2 py-1 font-[family-name:var(--font-mono)] text-[0.76rem] transition-colors ${
        on ? 'bg-brass text-[#14251C] font-semibold' : 'bg-black/25 text-chalk-dim'
      } ${className}`}
    >
      {children}
    </span>
  );
}

/** Ten blocks of five, with the one u lands in lit. */
function Blocks() {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 10 }, (_, k) => {
        const lo = 5 * k + 1;
        const on = k === 8;
        return (
          <span key={k} className="flex flex-col items-center gap-0.5">
            <Cell on={on}>
              {lo}&ndash;{lo + 4}
            </Cell>
            <span
              className={`font-[family-name:var(--font-mono)] text-[0.68rem] ${on ? 'text-brass' : 'text-chalk-dim/80'}`}
            >
              {k}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function SlotTable({ lit }: { lit: number }) {
  const rows = [
    ['heads', 1, 2],
    ['tails', 3, 4],
  ] as const;
  return (
    <table className="font-[family-name:var(--font-mono)] text-[0.76rem]">
      <thead>
        <tr className="text-chalk-dim">
          <th className="pr-3 text-left font-normal" />
          <th className="px-2 text-left font-normal">m 0&ndash;5</th>
          <th className="px-2 text-left font-normal">m 6&ndash;9</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, a, b]) => (
          <tr key={label}>
            <th className="pr-3 text-left font-normal text-chalk-dim">{label}</th>
            {[a, b].map((slot) => (
              <td key={slot} className="px-2 py-0.5">
                <span className={slot === lit ? 'text-brass font-semibold' : 'text-chalk-dim/70'}>slot {slot}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PermTable({ lit }: { lit: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {CODE.map((c, k) => (
        <span key={c} className="flex flex-col items-center gap-0.5">
          <Cell on={k === lit}>{c}</Cell>
          <span
            className={`font-[family-name:var(--font-mono)] text-[0.68rem] ${k === lit ? 'text-brass' : 'text-chalk-dim/80'}`}
          >
            {k}
          </span>
        </span>
      ))}
    </div>
  );
}

export function Figure({ kind }: { kind: string }) {
  const body = (() => {
    switch (kind) {
      case 'values':
        return (
          <div className="worktable">
            {HAND.map((v, k) => (
              <span key={v}>
                {k > 0 ? <span className="text-chalk-dim"> &middot; </span> : null}
                {shortOf(v)} = <span className="hit">{v}</span>
              </span>
            ))}
          </div>
        );
      case 'sum':
        return (
          <div className="worktable">
            7 + 14 + 38 + 42 + 48 = <span className="hit">149</span>, and 149 mod 5 = <span className="hit">4</span>
          </div>
        );
      case 'blocks':
        return (
          <div className="space-y-2">
            <div className="worktable">
              u = 48 &minus; 4 = <span className="hit">44</span>, which is in 41&ndash;45, so m = <span className="hit">8</span>
            </div>
            <Blocks />
          </div>
        );
      case 'slots':
        return (
          <div className="space-y-2">
            <div className="worktable">
              heads, m = 8 &rarr; the lowest card 7&#9827; goes in <span className="hit">slot 2</span>
            </div>
            <SlotTable lit={2} />
          </div>
        );
      case 'perms':
        return (
          <div className="space-y-2">
            <div className="worktable">
              8 mod 6 = <span className="hit">2</span> &rarr; <span className="hit">M L H</span> &rarr; Q&#9829; A&#9830; 3&#9824;
            </div>
            <PermTable lit={2} />
          </div>
        );
      case 'read-slot':
        return (
          <div className="space-y-2">
            <div className="worktable">
              7&#9827; in slot 2 &rarr; <span className="hit">heads</span>, and add six
            </div>
            <SlotTable lit={2} />
          </div>
        );
      case 'read-perm':
        return (
          <div className="space-y-2">
            <div className="worktable">
              Q&#9829; A&#9830; 3&#9824; = middle, low, high = 2 &rarr; m = 6 + 2 = <span className="hit">8</span>
            </div>
            <PermTable lit={2} />
          </div>
        );
      case 'start':
        return (
          <div className="worktable">
            7 + 14 + 38 + 42 = <span className="hit">101</span>, 101 mod 5 = 1, start = 5 &minus; 1 ={' '}
            <span className="hit">4</span>
          </div>
        );
      case 'u':
        return (
          <div className="worktable">
            u = 5 &times; 8 + 4 = <span className="hit">44</span>
          </div>
        );
      case 'checkpoints':
        return (
          <div className="space-y-2">
            <div className="worktable">
              checkpoints 7 &middot; 13 &middot; 36 &middot; 39, and 44 passes all four &rarr; 44 + 4 ={' '}
              <span className="hit">48</span> = <span className="hit">9&#9824;</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[7, 13, 36, 39].map((c) => (
                <Cell key={c} on>
                  {c} &le; 44
                </Cell>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <motion.div
      key={kind}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mt-3"
    >
      {body}
    </motion.div>
  );
}
