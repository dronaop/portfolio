"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { skillGroups } from "@/lib/data";
import { usePinnedProgress } from "@/lib/use-pinned-progress";
import { ChapterLabel } from "@/components/ui/chapter-label";
import { DecodeText } from "@/components/ui/decode-text";
import { HorizontalTrack, TrackPanel } from "@/components/ui/horizontal-track";
import { SignalLine } from "@/components/ui/signal-line";
import type { ShaderUniformSource } from "@/components/ui/animated-shader-hero";
import type { HoleState } from "@/components/voyage/BlackHole";
import {
  COURSE,
  DECODE,
  EMERGE,
  SIGNALS,
  STATEMENT_HOLD,
  STATEMENT_OUT,
  VOYAGE,
  WORLDS,
  WORLD_COLORS,
  beatsAt,
  pullAt,
  ramp,
  stationAt,
} from "@/components/voyage/beats";

// Three.js only loads once the chapter is near, so the hero stays light.
const VoyageCanvas = dynamic(() => import("@/components/voyage/VoyageCanvas"), { ssr: false });
/** Where the voyage stands before it starts; the sky only pans from here. */
const START_STATION = stationAt(beatsAt(0));

/**
 * "Signals" chapter: a voyage, pinned for its whole height, over the shared
 * space backdrop (see SpaceScene). Scrolling down plays (see voyage/beats):
 *
 * 1. Transmission — the chapter's statement decodes out of noise.
 * 2. Course set — "Four worlds. One mission." sweeps across the screen.
 * 3. The voyage — the camera flies sideways over four 3D worlds, one per
 *    skill group, each a planet's horizon with that group's skills huge in
 *    the sky above it, sliding by a screen per world.
 * 4. Gargantua — a black hole appears dead ahead and pulls everything in,
 *    faster and faster: the last world's skills are dragged into it, the
 *    camera spirals down until all is black, then comes out the other
 *    side into Production.
 *
 * The worlds and black hole are a lazily loaded three.js canvas
 * (voyage/VoyageCanvas); the black hole also bends the backdrop's stars,
 * through `shaderUniformsRef`. All text is real HTML.
 */
export default function SkillsVoyage({
  sectionRef,
  shaderUniformsRef,
}: {
  sectionRef: RefObject<HTMLDivElement | null>;
  /** Set to this chapter's share of the backdrop shader's uniforms. */
  shaderUniformsRef: RefObject<ShaderUniformSource | null>;
}) {
  const progress = usePinnedProgress(sectionRef);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const holeRef = useRef<HoleState>([0.5, 0.5, 0, 0]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;
    const approach = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), {
      rootMargin: "150% 0px",
    });
    const visible = new IntersectionObserver(([entry]) => {
      activeRef.current = entry.isIntersecting;
      setActive(entry.isIntersecting);
    });
    approach.observe(target);
    visible.observe(target);
    return () => {
      approach.disconnect();
      visible.disconnect();
    };
  }, [sectionRef]);

  // The backdrop pans with the camera and bends its stars around the black
  // hole, which fades as we come out the other side. Between worlds its
  // stars fly at the viewer, fastest mid-leg.
  useEffect(() => {
    shaderUniformsRef.current = () => {
      const beats = beatsAt(progress.get());
      const [x, y, radius, strength] = holeRef.current;
      const uniforms = {
        pan: (stationAt(beats) - START_STATION) * 0.35,
        hole: [x, y, radius, activeRef.current ? strength * (1 - beats.emerge) : 0] as HoleState,
      };
      if (reduceMotion) return uniforms;
      // Falling into the black hole, faster and faster.
      return { ...uniforms, travel: (beats.approach + beats.world) * 0.8 + pullAt(beats.dive) * 2.5 };
    };
    return () => void (shaderUniformsRef.current = null);
  }, [progress, shaderUniformsRef, reduceMotion]);

  const station = useTransform(progress, (p) => stationAt(beatsAt(p)));
  // The last world's skills are pulled into the black hole ahead of the
  // camera, wherever it is on screen, swirling the way the camera rolls.
  const holeX = useMotionValue(0.5);
  const holeY = useMotionValue(0.5);
  useAnimationFrame(() => {
    if (!activeRef.current) return;
    holeX.set(holeRef.current[0]);
    holeY.set(holeRef.current[1]);
  });
  const swallow = useTransform(progress, (p) => ramp(beatsAt(p).dive, [0.08, 0.5]) ** 1.4);
  const swallowX = useTransform([swallow, holeX], ([s, x]: number[]) => `${(x - 0.5) * 100 * s}vw`);
  const swallowY = useTransform([swallow, holeY], ([s, y]: number[]) => `${(y - 0.5) * 100 * s}vh`);
  const swallowScale = useTransform(swallow, [0, 1], [1, 0.04]);
  const swallowRotate = useTransform(swallow, [0, 1], [0, reduceMotion ? 0 : 50]);
  const swallowOpacity = useTransform(swallow, [0.6, 1], [1, 0]);
  const swallowBlur = useTransform(swallow, [0, 1], ["blur(0px)", "blur(6px)"]);

  const decode = useTransform(progress, (p) => ramp(p, DECODE));
  // Once decoded it drifts a little while it is read, then slides away.
  const statementOpacity = useTransform(progress, [STATEMENT_HOLD, STATEMENT_OUT], [1, 0]);
  const statementX = useTransform(progress, [DECODE[1], STATEMENT_HOLD, STATEMENT_OUT], ["0vw", "-2vw", "-30vw"]);

  // The course line crosses from just off the right edge to just off the left.
  const courseShift = useTransform(progress, COURSE, ["0vw", "-100vw"]);
  const courseSelf = useTransform(progress, COURSE, ["0%", "-100%"]);
  const trajectory = useTransform(progress, (p) => ramp(p, [COURSE[0], VOYAGE[1]]));
  const hudFade = SIGNALS.at(40);
  const hudOpacity = useTransform(progress, [VOYAGE[0] - hudFade, VOYAGE[0], VOYAGE[1], VOYAGE[1] + hudFade], [0, 1, 1, 0]);
  const worldNumber = useTransform(station, (s) => String(Math.min(Math.max(Math.round(s), 0), WORLDS - 1) + 1).padStart(2, "0"));

  const canvasOpacity = useTransform(progress, (p) => 1 - ramp(p, EMERGE));
  const emergeOpacity = useTransform(progress, EMERGE, [0, 1]);
  const emergeY = useTransform(progress, [EMERGE[0], EMERGE[1]], [24, 0]);

  return (
    <section ref={sectionRef} id="skills" aria-labelledby="skills-heading" className="relative" style={{ height: SIGNALS.height }}>
      <motion.div
        style={{ opacity: canvasOpacity, visibility: active ? "visible" : "hidden" }}
        className="pointer-events-none fixed inset-0"
      >
        {near && <VoyageCanvas progress={progress} active={active} holeRef={holeRef} />}
      </motion.div>

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          style={{ opacity: statementOpacity, x: statementX }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center sm:px-10"
        >
          <ChapterLabel id="signals" />
          <h2
            id="skills-heading"
            className="mx-auto mt-6 max-w-5xl text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            <DecodeText
              progress={decode}
              text="I build LLM pipelines, fine-tuned models, and the data infrastructure that keeps them observable in production."
            />
          </h2>
        </motion.div>

        <motion.div style={{ x: courseShift }} aria-hidden className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2">
          <motion.p
            style={{ x: courseSelf }}
            className="absolute left-full top-0 -translate-y-1/2 whitespace-nowrap text-[18vw] font-black uppercase leading-none tracking-tighter text-white sm:text-[13vw]"
          >
            Four worlds. <span className="text-white/30">One mission.</span>
          </motion.p>
        </motion.div>

        <motion.div
          style={{
            x: swallowX,
            y: swallowY,
            scale: swallowScale,
            rotate: swallowRotate,
            opacity: swallowOpacity,
            filter: swallowBlur,
          }}
          className="absolute inset-0 z-10 overflow-hidden"
        >
          <HorizontalTrack position={station}>
            {skillGroups.map((group, g) => (
              <TrackPanel key={group.label}>
                <WorldSkills index={g} {...group} />
              </TrackPanel>
            ))}
          </HorizontalTrack>
        </motion.div>

        <motion.div
          style={{ opacity: hudOpacity }}
          aria-hidden
          className="absolute inset-x-6 bottom-6 z-10 flex items-center gap-5 sm:inset-x-10 sm:bottom-10"
        >
          <p className="shrink-0 font-mono text-xs tracking-[0.3em] text-white/60">
            WORLD <motion.span className="text-white">{worldNumber}</motion.span> / {String(WORLDS).padStart(2, "0")}
          </p>
          <div className="relative h-px flex-1">
            <SignalLine progress={trajectory} orientation="horizontal" className="inset-x-0 top-0" />
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: emergeOpacity, y: emergeY }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
        >
          <ChapterLabel id="production" />
          <p className="mt-6 text-balance text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Out the other side: systems that ship.
          </p>
        </motion.div>

      </div>
    </section>
  );
}

/** A world's skills, in the sky above its planet's horizon, on the side
 *  away from where the curve peaks: the proven ones huge, each with where
 *  it was proven, then the rest in one line. */
function WorldSkills({
  index,
  label,
  highlights,
  more,
}: {
  index: number;
  label: string;
  highlights: { skill: string; proof: string }[];
  more: string[];
}) {
  return (
    <div
      className={`absolute inset-x-6 top-[14%] sm:inset-x-10 md:top-[16%] md:w-[52%] ${
        index % 2 === 0 ? "md:left-[7%] md:right-auto" : "md:left-auto md:right-[7%]"
      }`}
    >
      <h3 className="font-mono text-xs uppercase tracking-[0.35em]" style={{ color: WORLD_COLORS[index] }}>
        World {String(index + 1).padStart(2, "0")} · {label}
      </h3>
      <ul className="mt-6 space-y-5 md:mt-8 md:space-y-7">
        {highlights.map(({ skill, proof }) => (
          <li key={skill}>
            <p className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl md:text-[5vw]">{skill}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base md:text-lg">{proof}</p>
          </li>
        ))}
      </ul>
      <p className="mt-7 max-w-2xl text-lg font-semibold leading-snug text-white/80 sm:text-xl md:mt-10 md:text-2xl">
        {more.join("  ·  ")}
      </p>
    </div>
  );
}
