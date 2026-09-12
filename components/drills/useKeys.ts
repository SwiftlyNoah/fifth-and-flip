'use client';

import { useEffect, useRef } from 'react';

/**
 * Number keys answer, Enter advances. Ignored while the user is typing into a
 * field, so the solver's card input still behaves normally.
 */
export function useKeys(handler: (key: string) => void) {
  const ref = useRef(handler);

  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      ref.current(e.key);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
