import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Counts smoothly from the previous value to the new one. */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, format = (n) => String(Math.round(n)), duration = 700 }) => {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(shown);

  useEffect(() => {
    if (reduced) {
      from.current = value;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = origin + (value - origin) * easeOutCubic(t);
      from.current = v;
      setShown(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return <>{format(reduced ? value : shown)}</>;
};
