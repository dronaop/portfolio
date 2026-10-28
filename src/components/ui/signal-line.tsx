"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The page's connecting thread: a faint track with a glowing gradient fill
 * that draws itself as `progress` goes 0 → 1, led by a bright head. Fills
 * its positioned parent along one axis; size and place it with className.
 */
export function SignalLine({
  progress,
  orientation = "vertical",
  className,
}: {
  /** 0..1 — how much of the line is drawn. */
  progress: MotionValue<number>;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  const vertical = orientation === "vertical";
  const headPosition = useTransform(progress, (v) => `${Math.min(Math.max(v, 0), 1) * 100}%`);
  const headOpacity = useTransform(progress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute", className)}>
      <div className={cn("absolute bg-white/10", vertical ? "inset-y-0 left-0 w-px" : "inset-x-0 top-0 h-px")} />
      <motion.div
        style={vertical ? { scaleY: progress, originY: 0 } : { scaleX: progress, originX: 0 }}
        className={cn(
          "absolute from-[#7c8cff] via-[#ff8a5c] to-[#4cd6b0]",
          vertical
            ? "inset-y-0 -left-[0.5px] w-0.5 bg-gradient-to-b"
            : "inset-x-0 -top-[0.5px] h-0.5 bg-gradient-to-r",
        )}
      />
      <motion.div
        style={
          vertical
            ? { top: headPosition, opacity: headOpacity }
            : { left: headPosition, opacity: headOpacity }
        }
        className={cn(
          "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_3px_rgba(124,140,255,0.8)]",
          vertical ? "left-0" : "top-0",
        )}
      />
    </div>
  );
}
