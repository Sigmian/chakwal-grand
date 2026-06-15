"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface CountUpProps {
  /** The final numeric value to count to. */
  value:     number;
  /** Decimal places to render (e.g. 1 for "4.8"). Default 0. */
  decimals?: number;
  /** Text appended after the number (e.g. "+", "★"). */
  suffix?:   string;
  /** Text prepended before the number. */
  prefix?:   string;
  /** Animation length in ms. Default 1400. */
  duration?: number;
  className?: string;
}

/**
 * Counts a number up from 0 to `value` once it scrolls into view.
 * A premium micro-interaction for stat blocks. Honours reduced-motion
 * (renders the final value immediately).
 */
export function CountUp({
  value, decimals = 0, suffix = "", prefix = "", duration = 1400, className,
}: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (reduceMotion) { setDisplay(value); return; }
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(value * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { run(); observer.disconnect(); } }),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
