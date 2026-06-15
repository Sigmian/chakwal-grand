"use client";

import { motion, useReducedMotion, type Variant } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up:    { x: 0,   y: 28 },
  down:  { x: 0,   y: -28 },
  left:  { x: 28,  y: 0 },
  right: { x: -28, y: 0 },
  none:  { x: 0,   y: 0 },
};

interface RevealProps {
  children:   ReactNode;
  /** Direction the element travels from while fading in. Default "up". */
  direction?: Direction;
  /** Stagger delay in seconds. Default 0. */
  delay?:     number;
  /** Seconds the motion takes. Default 0.6. */
  duration?:  number;
  className?: string;
  /** Render as a different element wrapper. Default div. */
  as?:        "div" | "li" | "section" | "span";
}

/**
 * Scroll-reveal wrapper — fades + slides children into view once, as they
 * scroll into the viewport. Honours prefers-reduced-motion (renders static).
 * Use `delay={i * 0.08}` inside a map for a premium stagger effect.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  as = "div",
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const { x, y } = OFFSET[direction];

  const MotionTag = motion[as] as typeof motion.div;

  const hidden: Variant  = reduceMotion ? { opacity: 0 } : { opacity: 0, x, y };
  const visible: Variant = { opacity: 1, x: 0, y: 0 };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      variants={{ hidden, visible }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
