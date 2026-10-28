"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/** A list point, marked with a short accent dash, that rises in as `vh`
 *  (scroll into a pinned scene, see lib/pacing) crosses `range`. */
export function RevealPoint({
  vh,
  range,
  accent,
  className,
  children,
}: {
  vh: MotionValue<number>;
  range: [number, number];
  accent: string;
  className?: string;
  children: string;
}) {
  const opacity = useTransform(vh, range, [0, 1]);
  const y = useTransform(vh, range, [14, 0]);
  return (
    <motion.li
      style={{ opacity, y }}
      className={cn("relative pl-5 text-sm leading-relaxed text-white/75 sm:text-base lg:text-lg", className)}
    >
      <span aria-hidden className="absolute left-0 top-[0.7em] h-px w-2.5" style={{ background: accent }} />
      {children}
    </motion.li>
  );
}
