@AGENTS.md

# fifth-and-flip

A two-person card trick trainer. Display title everywhere user-facing: **The Fifth Card & the Coin**.
Tagline: *Four cards name the fifth. The bandwidth left over calls the coin.*

A spectator draws five cards from a 54-card deck and flips a coin. The assistant lays four
cards face up in a row. The magician, who never saw the hand, names the fifth card and calls
the coin. It is a real encoding scheme, not a gimmick.

---

## The one rule that matters

**`lib/trick.ts` is the algorithm. Never change it without re-running the property tests.**

```
npm test
```

It is a verbatim port of `prototype.html` (kept in the repo root as the historical reference
and spec of record). The tests in `lib/trick.test.ts` are not decoration:

| check | what it proves |
| --- | --- |
| 200,000 random round trips | `decode(encode(hand, coin))` returns the hidden card and the coin |
| invariants | `u` is always in `[1, 50]`, `m` is always in `[0, 9]` |
| menu | an independently built candidate list has exactly 10 entries and its `m`-th is the hidden card |
| exhaustive | all 316,251 four-card subsets of the deck yield a 10-entry menu |
| golden case | `7C AD QH 3S 9S` + heads lays out `Q♥ 7♣ A♦ 3♠`; tails gives `Q♥ A♦ 3♠ 7♣` |

If a test fails, the port is wrong. **Fix the port, never the test.** A cleaner rewrite that
breaks the round trip is worthless.

`lib/trick.ts` must stay pure: no React, no DOM, no browser globals. That is what makes the
tests meaningful.

---

## Architecture

```
app/
  layout.tsx            fonts (next/font), metadata, felt background, header and footer
  page.tsx              the drill trainer plus the rehearsal notes
  learn/page.tsx        the ninety-second interactive walkthrough
  reference/page.tsx    the two crib cards, then the deeper material behind a disclosure
  globals.css           design tokens (@theme), component classes, print stylesheet

lib/
  trick.ts              THE ALGORITHM. pure, framework-free, exhaustively tested
  trick.test.ts         the property tests
  stats.test.ts         window averages, deltas, rolling means, preference validation
  stats.ts              attempt history and window summaries: localStorage shape, versioning,
                        per-window averages, accuracy and deltas, the rolling average
  practice.ts           the external store React subscribes to (question seeds, history, role,
                        and the window preference)
  random.ts             mulberry32, so a question is reproducible from its seed

components/
  Card.tsx              PlayingCard / CardButton / GhostCard / Hand / CardRow
  SiteHeader.tsx        SiteFooter.tsx
  drills/
    Trainer.tsx         role toggle, the two ladders, clear-all
    DrillShell.tsx      prompt + clock + verdict + working + stats frame, and the shared bits
    useDrill.ts         one drill's seed, clock, history and submit path
    useDrillTimer.ts    the live tenths-of-a-second clock
    useKeys.ts          number keys answer, Enter advances
    StatsPanel.tsx      the bar: one tile per configured window, plus last, overall and best
    WindowEditor.tsx    add and remove the trailing windows the bar reports on
    Delta.tsx           a change against the previous window, coloured by which way is better
    Sparkline.tsx       last ~24 attempts, wrong ones crossed
    HistoryChart.tsx    the expanded view: every attempt, a rolling average, a zero-based axis
    useMeasuredWidth.ts element width, so the chart can be drawn to fit
    Clock.tsx  CardPicker.tsx
    ValuesDrill HideDrill FindMDrill LayDrill      (assistant ladder)
    ReadRowDrill FindCardDrill CallItDrill         (magician ladder)
    Solver.tsx          "Check a hand": the arbiter, always shows full working
  learn/
    steps.ts            the ten steps and the stage geometry for the walkthrough
    Walkthrough.tsx     the animated stage, controls, keyboard path
    Figures.tsx         the per-step figures (block strip, slot table, permutation table)
  reference/CribCards.tsx

scripts/screenshots.ts  Playwright: boots a production build, seeds stats, captures docs/screenshots
prototype.html          the original single-file version. historical reference; do not delete
```

### State conventions

- **No setState inside effects, and nothing impure during render.** React 19's lint rules are
  enforced and the build is expected to stay clean.
- Questions are derived from a seed held in `lib/practice.ts` and read with
  `useSyncExternalStore`. "Next hand" advances the seed in an event handler. This keeps render
  pure and keeps SSR and hydration in step (server snapshots are constants).
- Attempt history lives in `localStorage` under `faf:v<version>:<role>:<drill>`, and the window
  preference under `faf:v<version>:windows`. Every read is wrapped in try/catch and validated; a
  bad or stale payload degrades to an empty history, and a bad preference to `DEFAULT_WINDOWS`.
  Bump `STATS_VERSION` in `lib/stats.ts` for any shape change rather than migrating.
- Windows are a **display preference**, shared by both roles and every drill, so "clear all stats"
  wipes histories and leaves them alone.
- **Timing averages include wrong answers.** Accuracy is reported separately. Do not quietly
  drop misses from the timing numbers.
- A window's delta compares it with the window of the same size immediately before it, and is
  withheld until that earlier window is full, so the comparison is always like for like. Never
  compare a short window against the all-time average and call it a delta.

### Things not to do

- Do not drop the "Show the working" reveals to tidy the UI. They are the product.
- Do not add a component library. The visual identity is specific and generic components fight it.
- Do not skip the reduced-motion path: `prefers-reduced-motion` must keep every step, with no
  movement (`useReducedMotion` in the walkthrough, plus the global rule in `globals.css`).
- Cards move via animated position on a single persistent element. Never cross-fade a card from
  one place to another.

---

## Design tokens

Defined once in `app/globals.css` under `@theme`, used as Tailwind colours (`bg-felt`, `text-brass`, ...).

| token | value | |
| --- | --- | --- |
| `felt` | `#0E3A2C` | the table |
| `felt-deep` | `#082A1F` | drill panels |
| `felt-line` | `#1C5642` | hairlines and borders |
| `stock` | `#F3F0E7` | card stock, headings |
| `stock-edge` | `#D9D3C2` | card edges |
| `ink` | `#17191B` | pips on black suits |
| `pip` | `#AF2B2E` | pips on red suits |
| `brass` | `#D2A93C` | the accent, and every number that matters |
| `chalk` / `chalk-dim` | `#D6E4DA` / `#93AFA1` | body text and secondary text |
| `good` / `bad` | `#7FCB9B` / `#E8846B` | verdicts |

Fonts, all via `next/font`: **Fraunces** (display), **Public Sans** (UI), **IBM Plex Mono**
(every number and all working). Numbers are always monospace.

Tap targets are at least 44px. Mobile matters: people rehearse on a phone, one-handed.

---

## Commands

```
npm run dev          next dev on :3000
npm run build        production build
npm test             the property tests (about 2s)
npm run lint         eslint, flat config, next/core-web-vitals + next/typescript
npm run typecheck    tsc --noEmit
npm run screenshots  build first, then this: boots :4321 and writes docs/screenshots
```

`npm run build` and `npm run lint` are both expected to be clean. So is `npm test`.
