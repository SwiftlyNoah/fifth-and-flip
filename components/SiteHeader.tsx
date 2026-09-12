'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Drills' },
  { href: '/learn', label: 'Walkthrough' },
  { href: '/reference', label: 'Crib sheet' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-felt-line/70 bg-felt-deep/95 shadow-[0_1px_12px_rgba(0,0,0,0.28)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="group flex items-baseline gap-2 no-underline">
          <span className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-stock">
            The Fifth Card <span className="italic font-normal text-brass">&amp;</span> the Coin
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded px-2.5 py-1.5 text-[0.86rem] font-medium no-underline transition-colors ${
                  active ? 'text-brass' : 'text-chalk-dim hover:text-chalk'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
