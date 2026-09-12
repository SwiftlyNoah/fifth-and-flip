export function SiteFooter() {
  return (
    <footer className="no-print mx-auto mt-20 max-w-5xl px-5 pb-16">
      <div className="rule mb-5" />
      <p className="max-w-[72ch] text-[0.84rem] leading-relaxed text-chalk-dim">
        Numbers: &#9827; = rank, &#9830; +13, &#9829; +26, &#9824; +39, black joker 53, red joker 54. Remainders
        mod 5: clubs +0, diamonds +3, hearts +1, spades +4. Assistant: i = total mod 5, hide i up from the bottom,
        u = value &minus; i, m = block of five. Magician: slot of the lowest card gives coin and band, other three
        give m mod 6, start = 5 &minus; (shown sum mod 5), u = 5m + start, then add how many of the
        shown-minus-0,1,2,3 checkpoints u passes.
      </p>
      <p className="mt-4 text-[0.82rem] text-chalk-dim">
        After William Fitch Cheney, and Michael Kleber&rsquo;s{' '}
        <a
          className="text-brass underline decoration-brass/40 underline-offset-2 hover:decoration-brass"
          href="https://doi.org/10.1007/BF03025305"
          target="_blank"
          rel="noreferrer noopener"
        >
          The Best Card Trick
        </a>
        . The coin variant is Elwyn Berlekamp&rsquo;s.
      </p>
    </footer>
  );
}
