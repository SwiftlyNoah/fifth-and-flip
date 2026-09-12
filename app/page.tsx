import Link from 'next/link';
import { Trainer } from '@/components/drills/Trainer';

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <section className="pt-12 pb-8 sm:pt-16">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.05rem,6vw,3.4rem)] font-semibold leading-[1.03] tracking-[-0.015em] text-stock">
          The Fifth Card <span className="italic font-normal text-brass">&amp;</span> the Coin
        </h1>
        <p className="mt-4 max-w-[60ch] text-chalk">
          Fifty-four cards, both jokers in. A spectator picks five and flips a coin. The assistant lays four cards face
          up in a row and says nothing. The magician, out of the room throughout, names the fifth card and calls the
          coin.
        </p>
        <p className="mt-2 max-w-[60ch] text-[0.9rem] text-chalk-dim">
          Five steps each side. Pick a role below and you only ever see your own.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/learn" className="btn btn-go no-underline">
            Ninety-second walkthrough
          </Link>
          <Link href="/reference" className="btn no-underline">
            The crib sheet
          </Link>
        </div>
      </section>

      <Trainer />

      <section className="pt-16">
        <h2 className="font-[family-name:var(--font-display)] text-[1.62rem] font-semibold tracking-[-0.01em] text-stock">
          How to rehearse
        </h2>
        <div className="rule my-4" />
        <p className="max-w-[66ch]">
          Pick your side and stay on it. You will only ever perform one of them, and learning both at once is how pairs
          stall.
        </p>
        <ul className="mt-3 max-w-[64ch] list-disc space-y-2 pl-5 text-[0.95rem]">
          <li>
            <strong className="text-stock">Card values first, both of you.</strong> Until you stop computing and start
            recognising, about a card a second. Everything above this is gated on it and most pairs quit the drill too
            early.
          </li>
          <li>
            <strong className="text-stock">Then your own middle two drills</strong> until the arithmetic is boring
            rather than effortful.
          </li>
          <li>
            <strong className="text-stock">Then the full drill</strong> for your side, against the clock. Watch the
            last-five average, not the overall one.
          </li>
          <li>
            <strong className="text-stock">Then together</strong>, with real cards and a real coin, and the magician
            actually out of the room. Use <em>Check a hand</em> to settle arguments.
          </li>
        </ul>

        <h3 className="mt-8 font-semibold text-stock">On the floor</h3>
        <ul className="mt-2 max-w-[64ch] list-disc space-y-2 pl-5 text-[0.95rem]">
          <li>
            The assistant needs half a minute or so. Buy it with business: squaring the deck, having the spectator
            initial the coin, asking them to close a fist over it. Silence and a fixed stare is the tell.
          </li>
          <li>
            Slot position is the entire coin. Lay the row down deliberately and never nudge a card afterwards to
            straighten the line.
          </li>
          <li>
            Call the card first, then the coin. The card is the trick; the coin is what they repeat to other people.
          </li>
          <li>
            If the magician names a card that is face up on the table, something went wrong upstream. Agree in advance
            on how to die gracefully.
          </li>
          <li>
            Both jokers must be tellable apart. If yours are identical, put a pencil dot on one and agree which is
            which before you ever perform.
          </li>
        </ul>
      </section>
    </div>
  );
}
