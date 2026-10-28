"use client";

import { useCallback, useRef } from "react";
import { easeIn, easeInOut, useReducedMotion, useScroll } from "framer-motion";
import {
  ShaderBackground,
  type ShaderUniformSource,
  type ShaderUniforms,
} from "@/components/ui/animated-shader-hero";
import Hero from "@/components/Hero";
import SkillsVoyage from "@/components/SkillsVoyage";
import { usePinnedProgress } from "@/lib/use-pinned-progress";

/**
 * Hero + Signals voyage over one shared, fixed space backdrop (the WebGL
 * shader), which stays behind the whole page so every chapter after them
 * is still in the same space. Both sections are transparent:
 *
 * 1. Warp — over the hero, scrolling flies the camera forward through the
 *    stars, then the scene settles to about half brightness instead of
 *    fading out.
 * 2. Voyage — behind the Signals chapter the stars keep drifting toward the
 *    viewer and pan sideways with its 3D camera, and bend around its black
 *    hole (see SkillsVoyage, which feeds those uniforms).
 * 3. After — the settled, dimmed sky stays behind the rest of the page.
 */
const WARP_END = 0.8;
/** Star layers flown through over the warp (1 = one full layer). */
const WARP_DISTANCE = 3;
/** Star layers drifted through across the whole Signals chapter. */
const DRIFT_DISTANCE = 0.6;
const SETTLE_START = 0.55;
/** How far the backdrop dims once settled behind the later chapters. */
const SETTLE_DIM = 0.55;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export default function SpaceScene() {
  const heroRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const smoothHero = usePinnedProgress(heroRef);
  const { scrollYProgress: driftProgress } = useScroll({
    target: skillsRef,
    offset: ["start end", "end start"],
  });

  // Streaks follow scroll speed, not position, so stars only stretch while
  // the user is actually flying; smoothed so flicks don't strobe.
  const streakRef = useRef(0);
  const skillUniformsRef = useRef<ShaderUniformSource | null>(null);
  const getShaderUniforms = useCallback((now: number): Partial<ShaderUniforms> => {
    const p = smoothHero.get();
    const warp = clamp01(p / WARP_END);
    const settle = clamp01((p - SETTLE_START) / (1 - SETTLE_START));
    const dim = SETTLE_DIM * settle;
    // Tames the bright drifting lights so tool names stay readable over them.
    const soften = settle;
    const skills = skillUniformsRef.current?.(now);
    if (reduceMotion) return { dim, soften, ...skills };

    // The pinned hero is short, so progress velocity runs high; scaled
    // down to keep streak length comparable to a longer warp.
    const speed = clamp01(Math.abs(smoothHero.getVelocity()) * 1.2) * (1 - settle);
    streakRef.current += (speed - streakRef.current) * 0.15;

    return {
      travel: easeInOut(warp) * WARP_DISTANCE + driftProgress.get() * DRIFT_DISTANCE,
      zoom: easeIn(warp),
      streak: streakRef.current,
      dim,
      soften,
      ...skills,
    };
  }, [smoothHero, driftProgress, reduceMotion]);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 gradient-fallback" />
        <ShaderBackground getUniforms={getShaderUniforms} />
      </div>

      <Hero sectionRef={heroRef} />
      <SkillsVoyage sectionRef={skillsRef} shaderUniformsRef={skillUniformsRef} />
    </>
  );
}
