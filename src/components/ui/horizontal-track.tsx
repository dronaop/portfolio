"use client";

import type { ReactNode } from "react";
import { motion, useTransform, type MotionStyle, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A row of full-screen panels that slides sideways: `position` 0 shows the
 * first panel, 1 the second, and so on (fractions sit between them). Put it
 * inside a pinned (sticky, h-screen) container and drive `position` from
 * scroll, so scrolling down travels sideways.
 */
export function HorizontalTrack({
  position,
  children,
  style,
  className,
}: {
  /** Which panel is in view, in panels (0 = first). */
  position: MotionValue<number>;
  children: ReactNode;
  /** Extra motion styles for the row (e.g. opacity). */
  style?: MotionStyle;
  className?: string;
}) {
  const x = useTransform(position, (v) => `${-v * 100}vw`);
  return (
    <motion.div style={{ ...style, x }} className={cn("absolute inset-0 flex will-change-transform", className)}>
      {children}
    </motion.div>
  );
}

/** One full-screen panel of a HorizontalTrack. */
export function TrackPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative h-full w-screen shrink-0", className)}>{children}</div>;
}
