"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Page-wide smooth scrolling. Lenis still drives the native scroll position,
 * so framer-motion's useScroll and the sticky sections work unchanged; it
 * only eases how fast that position catches up to the wheel/touch input.
 * Also smooths in-page anchor links (nav, "View Work"). Skipped under
 * prefers-reduced-motion, which keeps native, instant scrolling.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.1 });
    return () => lenis.destroy();
  }, []);

  return null;
}
