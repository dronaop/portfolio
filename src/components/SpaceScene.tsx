"use client";

import { useCallback, useRef } from "react";
import { easeIn, easeInOut, useReducedMotion, useScroll } from "framer-motion";
import {
  ShaderBackground,
  type ShaderUniformSource,
  type ShaderUniforms,
} from "@/components/ui/animated-shader-hero";
import Hero, { HERO, WARP_VH } from "@/components/Hero";
import SkillsVoyage from "@/components/SkillsVoyage";
import WorkVoyage from "@/components/WorkVoyage";
import { usePinnedProgress } from "@/lib/use-pinned-progress";

/**
 * Hero, Signals voyage and Work missions over one shared, fixed space backdrop (the WebGL
 * shader), which stays behind the whole page so every chapter after them
 * is still in the same space. Both sections are transparent:
 *
 * 1. Warp — over the hero, scrolling flies the camera forward through the
 *    stars, then the scene settles to about half brightness instead of
 *    fading out.
 * 2. Voyage — behind the Signals chapter the stars keep drifting toward the
 *    viewer, rush toward them between its worlds, pan sideways with its 3D
 *    camera, and bend around its black hole (see SkillsVoyage, which feeds
 *    those uniforms).
 * 3. Missions — behind Work the sky keeps panning with its sideways travel.
 * 4. After — the settled, dimmed sky stays behind the rest of the page.
 */
const WARP_END = HERO.at(WARP_VH);
/** Star layers flown through over the warp (1 = one full layer). */
const WARP_DISTANCE = 3;
/** Star layers drifted through across the whole Signals chapter. */
const DRIFT_DISTANCE = 0.6;
/** The sky settles over the hero's closing line. */
const SETTLE = HERO.span(55, 150);
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
  const workUniformsRef = useRef<ShaderUniformSource | null>(null);
  const getShaderUniforms = useCallback((now: number): Partial<ShaderUniforms> => {
    const p = smoothHero.get();
    const warp = clamp01(p / WARP_END);
    const settle = clamp01((p - SETTLE[0]) / (SETTLE[1] - SETTLE[0]));
    const dim = SETTLE_DIM * settle;
    // Tames the bright drifting lights so tool names stay readable over them.
    const soften = settle;
    const skills = skillUniformsRef.current?.(now);
    const work = workUniformsRef.current?.(now);
    // Work picks up the pan where Signals left it.
    const pan = (skills?.pan ?? 0) + (work?.pan ?? 0);
    if (reduceMotion) return { dim, soften, ...skills, pan };

    // Scroll speed in screen-heights per second; about 60 a second is a
    // full streak.
    const vhPerSecond = Math.abs(smoothHero.getVelocity()) / HERO.at(1);
    const speed = clamp01(vhPerSecond / 60) * (1 - settle);
    streakRef.current += (speed - streakRef.current) * 0.15;

    // The chapters' own flight adds to the drift.
    return {
      ...skills,
      pan,
      travel:
        easeInOut(warp) * WARP_DISTANCE +
        driftProgress.get() * DRIFT_DISTANCE +
        (skills?.travel ?? 0) +
        (work?.travel ?? 0),
      zoom: easeIn(warp),
      streak: streakRef.current,
      dim,
      soften,
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
      <WorkVoyage shaderUniformsRef={workUniformsRef} />
    </>
  );
}
