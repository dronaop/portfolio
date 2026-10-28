"use client";

import { useState } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

const GLYPHS = "01<>/\\|=+*#%[]{}:;~^";
/** How often (in progress) the noise reshuffles while scrolling. */
const SHUFFLE_STEPS = 80;

/**
 * Text that arrives as a signal: while `progress` goes 0 → 1 its characters
 * lock in from left to right, and the ones not yet locked flicker as noise.
 * The noise only changes as progress changes, so it is still when the page
 * is. Each glyph sits over its real character (kept invisible), so the
 * text's layout never shifts while it decodes. Screen readers get the plain
 * text.
 */
export function DecodeText({
  text,
  progress,
  className,
}: {
  text: string;
  /** 0..1 — how much of the text has locked in. */
  progress: MotionValue<number>;
  className?: string;
}) {
  const [step, setStep] = useState(() => Math.round(progress.get() * SHUFFLE_STEPS));
  useMotionValueEvent(progress, "change", (v) => setStep(Math.round(Math.min(Math.max(v, 0), 1) * SHUFFLE_STEPS)));

  const locked = Math.round((step / SHUFFLE_STEPS) * text.length);
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {text.split("").map((char, i) => {
        if (i < locked || char === " ") {
          return (
            <span key={i} aria-hidden>
              {char}
            </span>
          );
        }
        const glyph = GLYPHS[(i * 7 + step * 13 + ((i * step) % 5)) % GLYPHS.length];
        return (
          <span key={i} aria-hidden className="relative">
            <span className="opacity-0">{char}</span>
            <span className={cn("absolute inset-0 text-center", i < locked + 4 ? "text-white/70" : "text-white/25")}>
              {glyph}
            </span>
          </span>
        );
      })}
    </span>
  );
}
