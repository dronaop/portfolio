"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { motion, useTransform } from "framer-motion";
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
  VOYAGE,
  WORLDS,
  WORLD_COLORS,
  beatsAt,
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
 * 3. The voyage — the camera flies sideways past four 3D worlds, one per
 *    skill group, its skills orbiting as moons, while each world's huge
 *    title slides by on the other side of the screen.
 * 4. Gargantua — the camera turns to a black hole and dives in until all
 *    is black, then comes out the other side into Production.
 *
 * The worlds and black hole are a lazily loaded three.js canvas
 * (voyage/VoyageCanvas); the black hole also bends the backdrop's stars,
 * through `shaderUniformsRef`. All text is real HTML, and the skills are
 * also a plain list for screen readers.
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
  // hole, which fades as we come out the other side.
  useEffect(() => {
    shaderUniformsRef.current = () => {
      const beats = beatsAt(progress.get());
      const [x, y, radius, strength] = holeRef.current;
      return {
        pan: (stationAt(beats) - START_STATION) * 0.35,
        hole: [x, y, radius, activeRef.current ? strength * (1 - beats.emerge) : 0],
      };
    };
    return () => void (shaderUniformsRef.current = null);
  }, [progress, shaderUniformsRef]);

  const station = useTransform(progress, (p) => stationAt(beatsAt(p)));
  // The titles step aside as the camera turns to the black hole.
  const titlesOpacity = useTransform(progress, (p) => 1 - Math.min(beatsAt(p).dive / 0.3, 1));

  const decode = useTransform(progress, (p) => ramp(p, DECODE));
  const statementOpacity = useTransform(progress, [0, 0.1, 0.14], [1, 1, 0]);
  const statementX = useTransform(progress, [0.1, 0.14], ["0vw", "-30vw"]);

  // The course line crosses from just off the right edge to just off the left.
  const courseShift = useTransform(progress, COURSE, ["0vw", "-100vw"]);
  const courseSelf = useTransform(progress, COURSE, ["0%", "-100%"]);
  const trajectory = useTransform(progress, (p) => ramp(p, [COURSE[0], VOYAGE[1]]));
  const hudOpacity = useTransform(progress, [VOYAGE[0] - 0.04, VOYAGE[0], VOYAGE[1], VOYAGE[1] + 0.04], [0, 1, 1, 0]);
  const worldNumber = useTransform(station, (s) => String(Math.min(Math.max(Math.round(s), 0), WORLDS - 1) + 1).padStart(2, "0"));

  const canvasOpacity = useTransform(progress, (p) => 1 - ramp(p, EMERGE));
  const emergeOpacity = useTransform(progress, [EMERGE[0], EMERGE[0] + 0.03], [0, 1]);
  const emergeY = useTransform(progress, [EMERGE[0], EMERGE[1]], [24, 0]);

  return (
    <section ref={sectionRef} id="skills" aria-labelledby="skills-heading" className="relative h-[800vh]">
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

        <HorizontalTrack position={station} style={{ opacity: titlesOpacity }} className="z-10">
          {skillGroups.map((group, g) => (
            <TrackPanel key={group.label}>
              <WorldTitle index={g} label={group.label} tagline={group.tagline} count={group.items.length} />
            </TrackPanel>
          ))}
        </HorizontalTrack>

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

        <ul className="sr-only">
          {skillGroups.map((group) => (
            <li key={group.label}>
              {group.label}: {group.items.join(", ")}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** A world's title, on the opposite side of the screen from its planet
 *  (wide), or below it (narrow): a huge faint number behind a huge name. */
function WorldTitle({
  index,
  label,
  tagline,
  count,
}: {
  index: number;
  label: string;
  tagline: string;
  count: number;
}) {
  const color = WORLD_COLORS[index];
  const planetLeft = index % 2 === 0;
  return (
    <div
      className={`absolute inset-x-6 bottom-[14%] sm:inset-x-10 md:bottom-auto md:top-1/2 md:w-[44%] md:-translate-y-1/2 ${
        planetLeft ? "md:left-auto md:right-[6%]" : "md:left-[6%] md:right-auto"
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[0.55em] left-0 select-none text-[34vw] font-black leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.14)] md:-top-[0.45em] md:text-[17vw]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="relative font-mono text-xs uppercase tracking-[0.35em]" style={{ color }}>
        World {String(index + 1).padStart(2, "0")} · {count} skills in orbit
      </p>
      <h3 className="relative mt-3 text-5xl font-black leading-[0.92] tracking-tight text-white sm:text-6xl md:text-[5.6vw]">
        {label}
      </h3>
      <p className="relative mt-5 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">{tagline}</p>
    </div>
  );
}
