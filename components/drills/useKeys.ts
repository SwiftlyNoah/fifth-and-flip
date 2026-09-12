'use client';

import { useEffect, useRef } from 'react';

/**
 * Number keys answer, Enter advances. Ignored while the user is typing into a
 * field, so the solver's card input still behaves normally.
 *
 * The handler returns true when it acted on the key, and the default action is
 * then suppressed. That matters for Enter: without it, the same keypress both
 * runs the handler and clicks whichever button has focus, which would submit
 * and advance in one go and the working would never be seen.
 */
export function useKeys(handler: (key: string) => boolean | void) {
  const ref = useRef(handler);

  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (ref.current(e.key) === true) e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
