'use client';

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CallItDrill } from './CallItDrill';
import { FindCardDrill } from './FindCardDrill';
import { FindMDrill } from './FindMDrill';
import { HideDrill } from './HideDrill';
import { LayDrill } from './LayDrill';
import { ReadRowDrill } from './ReadRowDrill';
import { Solver } from './Solver';
import { ValuesDrill } from './ValuesDrill';
import { getRole, getServerRole, resetEverything, setRole, subscribeRole } from '@/lib/practice';
import type { Role } from '@/lib/stats';

interface Rung {
  level: string;
  label: string;
  render: (role: Role) => React.ReactNode;
}

const LADDERS: Record<Role, Rung[]> = {
  A: [
    { level: '1', label: 'Card values', render: (role) => <ValuesDrill role={role} /> },
    { level: '2', label: 'Which card hides', render: () => <HideDrill /> },
    { level: '3', label: 'Find m', render: () => <FindMDrill /> },
    { level: '4', label: 'Lay it out', render: () => <LayDrill /> },
    { level: '—', label: 'Check a hand', render: () => <Solver /> },
  ],
  M: [
    { level: '1', label: 'Card values', render: (role) => <ValuesDrill role={role} /> },
    { level: '2', label: 'Read the row', render: () => <ReadRowDrill /> },
    { level: '3', label: 'Find the card', render: () => <FindCardDrill /> },
    { level: '4', label: 'Call it', render: () => <CallItDrill /> },
    { level: '—', label: 'Check a hand', render: () => <Solver /> },
  ],
};

export function Trainer() {
  // Role comes from ?role=, else from the last visit. useSyncExternalStore
  // keeps the server render and the hydration render in step.
  const role = useSyncExternalStore(subscribeRole, getRole, getServerRole);
  const [tab, setTab] = useState(0);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // The header is sticky and changes height when its nav wraps, so the #trainer
  // anchor jump measures it rather than guessing.
  useLayoutEffect(() => {
    const header = document.querySelector('header');
    const section = sectionRef.current;
    if (!header || !section) return;
    const apply = () => {
      section.style.scrollMarginTop = `${header.getBoundingClientRect().height}px`;
    };
    const ro = new ResizeObserver(apply);
    ro.observe(header);
    apply();

    // The browser has already jumped to #trainer by now, using a margin of
    // zero, so redo it once the real offset is known.
    if (window.location.hash === '#trainer') {
      section.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    }

    return () => ro.disconnect();
  }, []);

  function chooseRole(r: Role) {
    setRole(r);
    setTab(0);
  }

  const ladder = LADDERS[role];

  return (
    <section id="trainer" ref={sectionRef}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[0.88rem] text-chalk-dim">I am the</span>
        <button type="button" className="btn" aria-pressed={role === 'A'} onClick={() => chooseRole('A')}>
          Assistant
        </button>
        <button type="button" className="btn" aria-pressed={role === 'M'} onClick={() => chooseRole('M')}>
          Magician
        </button>
      </div>

      <div className="flex flex-wrap border-b border-felt-line" role="tablist" aria-label="Drills">
        {ladder.map((rung, j) => (
          <button
            key={rung.label}
            type="button"
            role="tab"
            aria-selected={j === tab}
            onClick={() => setTab(j)}
            className={`-mb-px cursor-pointer border-b-2 px-3 py-2.5 text-[0.9rem] font-medium transition-colors ${
              j === tab
                ? 'border-brass text-brass'
                : 'border-transparent text-chalk-dim hover:text-chalk'
            }`}
          >
            <span className="mr-1.5 font-[family-name:var(--font-mono)] text-[0.72rem] opacity-60">{rung.level}</span>
            {rung.label}
          </button>
        ))}
      </div>

      <div key={`${role}:${tab}`}>{ladder[tab].render(role)}</div>

      <div className="mt-4 flex items-center gap-3 text-[0.78rem]">
        {confirmingAll ? (
          <>
            <span className="text-chalk-dim">Clear every drill, both roles?</span>
            <button
              type="button"
              className="btn !min-h-0 border-bad !px-2 !py-0.5 !text-[0.75rem] text-bad hover:!bg-bad/15"
              onClick={() => {
                resetEverything();
                setConfirmingAll(false);
              }}
            >
              Yes, clear all
            </button>
            <button
              type="button"
              className="btn !min-h-0 !px-2 !py-0.5 !text-[0.75rem]"
              onClick={() => setConfirmingAll(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="text-chalk-dim underline decoration-dotted underline-offset-2 hover:text-chalk"
            onClick={() => setConfirmingAll(true)}
          >
            Clear all stats
          </button>
        )}
      </div>
    </section>
  );
}
