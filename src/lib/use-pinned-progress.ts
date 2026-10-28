"use client";

import type { RefObject } from "react";
import { useScroll, useSpring } from "framer-motion";

/** The spring every scroll-driven scene eases its progress with, so a flick
 *  of the wheel glides instead of jumping. */
export const SCROLL_SPRING = { stiffness: 220, damping: 40, mass: 0.4 };

/** 0..1 progress through a pinned section (its top hitting the top of the
 *  screen → its bottom hitting the bottom), smoothed with SCROLL_SPRING. */
export function usePinnedProgress(target: RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end end"] });
  return useSpring(scrollYProgress, SCROLL_SPRING);
}
