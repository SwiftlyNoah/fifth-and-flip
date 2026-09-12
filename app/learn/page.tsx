import type { Metadata } from 'next';
import { Walkthrough } from '@/components/learn/Walkthrough';

export const metadata: Metadata = {
  title: 'Walkthrough',
  description: 'One hand, ten steps, about ninety seconds: how four cards name the fifth and call the coin.',
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:pt-14">
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.015em] text-stock">
        One hand, both sides
      </h1>
      <p className="mt-3 max-w-[58ch] text-chalk-dim">
        The spectator holds 7&#9827; A&#9830; Q&#9829; 3&#9824; 9&#9824; and the coin came up heads. Ten steps, five
        each side. About ninety seconds.
      </p>

      <div className="mt-8">
        <Walkthrough />
      </div>
    </div>
  );
}
