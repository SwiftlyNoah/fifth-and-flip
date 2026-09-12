import type { Metadata } from 'next';
import { CribCards } from '@/components/reference/CribCards';

export const metadata: Metadata = {
  title: 'Crib sheet',
  description: 'The whole method on two index cards, plus where the numbers come from.',
};

export default function ReferencePage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-10 pb-16 sm:pt-14">
      <div className="no-print">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.015em] text-stock">
          The whole thing on two cards
        </h1>
        <p className="mt-3 max-w-[62ch] text-chalk-dim">
          Print this, cut it in half, keep one each. Nothing else is needed once the numbering is in your head.
        </p>
      </div>

      <div className="mt-7">
        <CribCards />
      </div>

      <p className="no-print mt-5 text-[0.86rem] text-chalk-dim">
        Both jokers must be tellable apart. If yours are identical, put a pencil dot on one and agree which is which
        before you ever perform.
      </p>

      <section className="no-print pt-14">
        <details className="group">
          <summary className="cursor-pointer font-[family-name:var(--font-display)] text-[1.4rem] font-semibold text-stock marker:text-brass">
            Where the numbers come from
          </summary>
          <div className="rule my-4" />
          <p className="max-w-[66ch]">
            You never need this to perform, but it makes the five steps stop feeling arbitrary.
          </p>
          <p className="mt-3 max-w-[66ch]">
            Lay the deck out in order, 1 to 54, and take out the four cards on the table. Fifty are left. Push them
            together and renumber them 1 to 50. Every fifth one of those survivors is a candidate, and there are exactly
            ten because fifty divides by five. The assistant is telling the magician{' '}
            <em>which of the ten</em>, and that number is <code className="tick">m</code>.
          </p>
          <p className="mt-3 max-w-[66ch]">
            The assistant&rsquo;s subtraction is just a shortcut for finding the hidden card&rsquo;s place among the
            survivors. Exactly <code className="tick">i</code> of the four shown cards sit below it, since it is the
            card <code className="tick">i</code> up from the bottom of the five, so its place is its value minus{' '}
            <code className="tick">i</code>. The magician&rsquo;s checkpoints do the same conversion backwards, since
            subtracting 0, 1, 2 and 3 from the shown cards marks the points where a survivor number and a card number
            pull another step apart.
          </p>
          <p className="mt-3 max-w-[66ch]">
            The encoding itself is a counting fact. Four cards shown in order out of five carry{' '}
            <code className="tick">5 &times; 4! = 120</code> signals: 24 from the arrangement and a factor of five from
            choosing which card to withhold. Naming one card out of fifty costs 100, so the coin fits in the slack and a
            three-way choice never could.
          </p>
          <p className="mt-3 max-w-[66ch] text-[0.9rem] text-chalk-dim">
            The five-card version is William Fitch Cheney&rsquo;s, from the 1950s. Michael Kleber&rsquo;s{' '}
            <a
              className="text-brass underline decoration-brass/40 underline-offset-2 hover:decoration-brass"
              href="https://doi.org/10.1007/BF03025305"
              target="_blank"
              rel="noreferrer noopener"
            >
              The Best Card Trick
            </a>{' '}
            (Mathematical Intelligencer 24 #1, 2002, 9&ndash;11) gives the 124-card bound and the sum-mod-5 scheme used
            here, which Kleber credits to Elwyn Berlekamp. The 64-card-plus-coin variant, of which this is the
            54-card cousin, is Berlekamp&rsquo;s too, noted at the end of that paper.
          </p>
        </details>
      </section>
    </div>
  );
}
