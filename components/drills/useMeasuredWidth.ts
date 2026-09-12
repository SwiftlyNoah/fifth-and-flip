'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/** The current pixel width of an element, so a chart can be drawn to fit it. */
export function useMeasuredWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth || fallback);
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    measure();
    return () => ro.disconnect();
  }, [fallback]);

  return { ref, width };
}
