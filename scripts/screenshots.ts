/**
 * Boots a production build and captures the screenshots used in the README.
 *
 *   npm run screenshots
 *
 * Stats history is seeded into localStorage first, so the drill shots show a
 * real practice session rather than an empty state.
 */

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { type Coin, encode } from '../lib/trick';

const PORT = Number(process.env.SHOT_PORT ?? 4321);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(process.cwd(), 'docs', 'screenshots');

/** A plausible practice history: mostly right, and getting quicker. */
function seedAttempts(n: number, from: number, to: number, misses: number[]): string {
  const now = Date.now();
  const attempts = Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(1, n - 1);
    const base = from + (to - from) * t;
    const wobble = Math.sin(i * 2.3) * (base * 0.16);
    return {
      correct: !misses.includes(i),
      ms: Math.round(base + wobble),
      at: now - (n - i) * 45_000,
    };
  });
  return JSON.stringify({ v: 1, attempts });
}

const SEED = {
  'faf:v1:A:values': seedAttempts(22, 4200, 1500, [3, 11]),
  'faf:v1:A:hide': seedAttempts(16, 12000, 6400, [2, 9]),
  'faf:v1:A:findm': seedAttempts(14, 9000, 4800, [5]),
  'faf:v1:A:lay': seedAttempts(18, 41000, 23000, [1, 6, 13]),
  'faf:v1:M:values': seedAttempts(20, 4400, 1700, [4]),
  'faf:v1:M:readrow': seedAttempts(15, 11000, 5200, [7]),
  'faf:v1:M:findcard': seedAttempts(13, 17000, 9100, [3]),
  'faf:v1:M:call': seedAttempts(17, 38000, 21000, [0, 8]),
};

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { cache: 'no-store' });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`server never came up on ${BASE}`);
}

interface Shot {
  name: string;
  url: string;
  /** run after load, before the shot */
  prepare?: (page: import('playwright').Page) => Promise<void>;
  fullPage?: boolean;
  print?: boolean;
}

const SHOTS: Shot[] = [
  {
    name: 'drills',
    url: '/?role=A',
    prepare: async (page) => {
      await page.getByRole('tab', { name: 'Lay it out' }).click();
      await page.waitForTimeout(500);
      await solveLayItOut(page);
      // park the trainer immediately under the sticky header, so nothing is
      // half-cut at the top of the frame
      await page.evaluate(() => {
        const el = document.getElementById('trainer');
        const header = document.querySelector('header');
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight ?? 0);
        window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
      });
      await page.waitForTimeout(400);
    },
  },
  {
    name: 'walkthrough',
    url: '/learn',
    prepare: async (page) => {
      await page.locator('body').click({ position: { x: 5, y: 5 } });
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(260);
      }
      await page.waitForTimeout(900);
    },
  },
  {
    name: 'crib',
    url: '/reference',
  },
  {
    name: 'crib-print',
    url: '/reference',
    print: true,
  },
  {
    name: 'solver',
    url: '/?role=A',
    prepare: async (page) => {
      await page.getByRole('tab', { name: 'Check a hand' }).click();
      await page.waitForTimeout(400);
    },
  },
];


/**
 * Plays the "Lay it out" drill correctly, using the real encoder, so the shot
 * shows a finished question: verdict, full working and updated stats.
 */
async function solveLayItOut(page: Page) {
  const panel = page.locator('div.rounded-b-md').first();
  const prompt = (await panel.locator('p').first().innerText()).toLowerCase();
  const coin: Coin = prompt.includes('heads') ? 'H' : 'T';

  const source = panel.locator('button.card-face');
  const hand = (await source.evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-card')))))
    .filter((v) => Number.isFinite(v));

  const { layout } = encode(hand, coin);
  for (const value of layout) {
    await panel.locator(`button.card-face[data-card="${value}"]`).first().click();
    await page.waitForTimeout(120);
  }

  // let the clock reach a plausible rehearsal time before committing the row
  await page.waitForTimeout(Number(process.env.SHOT_THINK_MS ?? 16_000));
  await panel.getByRole('button', { name: 'Lay it down' }).click();
  await page.waitForTimeout(400);
}

const VIEWPORTS = [
  { key: 'desktop', width: 1280, height: 1020, scale: 1.25 },
  { key: 'mobile', width: 414, height: 896, scale: 2 },
];

async function capture(browser: Browser) {
  for (const vp of VIEWPORTS) {
    const context: BrowserContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.scale,
      isMobile: vp.key === 'mobile',
      hasTouch: vp.key === 'mobile',
      colorScheme: 'dark',
    });

    await context.addInitScript((seed: Record<string, string>) => {
      for (const [k, v] of Object.entries(seed)) window.localStorage.setItem(k, v);
    }, SEED);

    const page = await context.newPage();

    for (const shot of SHOTS) {
      if (shot.print && vp.key === 'mobile') continue;
      await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle' });
      // give next/font and the first spring a moment to settle
      await page.waitForTimeout(700);
      if (shot.prepare) await shot.prepare(page);
      if (shot.print) await page.emulateMedia({ media: 'print' });
      const file = path.join(OUT, `${shot.name}-${vp.key}.png`);
      await page.screenshot({ path: file, fullPage: shot.fullPage ?? false });
      if (shot.print) await page.emulateMedia({ media: 'screen' });
      console.log(`  wrote ${path.relative(process.cwd(), file)}`);
    }

    await context.close();
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log(`starting next on :${PORT}`);
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: process.env,
  });

  let browser: Browser | undefined;
  try {
    await waitForServer();
    browser = await chromium.launch();
    await capture(browser);
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }

  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
