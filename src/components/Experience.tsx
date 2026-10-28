"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { experience } from "@/lib/data";
import { heldStation, pacing } from "@/lib/pacing";
import { usePinnedProgress } from "@/lib/use-pinned-progress";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { ChapterLabel } from "@/components/ui/chapter-label";
import { HorizontalTrack, TrackPanel } from "@/components/ui/horizontal-track";
import { RevealPoint } from "@/components/ui/reveal-point";
import { SignalLine } from "@/components/ui/signal-line";
import type { ShaderUniformSource } from "@/components/ui/animated-shader-hero";

type Stop = {
  /** The waypoint, huge: a year, or "Next". */
  marker: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  points: string[];
  accent: string;
};

/** Oldest first, then the open waypoint that hands over to Contact. */
const STOPS: Stop[] = [
  ...[...experience].reverse().map((job, i) => ({
    marker: job.period.match(/\d{4}/)?.[0] ?? job.period,
    eyebrow: job.period,
    title: job.role,
    subtitle: `${job.company} · ${job.location}`,
    points: job.points,
    accent: ["#ff8a5c", "#7c8cff"][i % 2],
  })),
  {
    marker: "Next",
    eyebrow: "Open to new roles",
    title: "Your team?",
    subtitle: "AI/ML roles and collaborations where models have to work in production.",
    points: [],
    accent: "#4cd6b0",
  },
];

/** The chapter's pinned scroll, in vh (see lib/pacing). */
const HOLD = 130;
const TRAVEL = 80;
const OUTRO = 20;
const JOURNEY = pacing(STOPS.length * HOLD + (STOPS.length - 1) * TRAVEL + OUTRO);
/** Where stop `i` comes to rest, in vh into the scene. */
const restAt = (i: number) => i * (HOLD + TRAVEL);
/** Where each waypoint sits across its screen (0..1). */
const WAYPOINT = 0.08;

/**
 * "Journey" chapter: the experience timeline as a sideways trip, oldest
 * first. One signal line runs the whole way, drawing steadily ahead as you
 * scroll; when it reaches a waypoint the stop's huge year fills with its
 * color and its points rise in. It ends on an open waypoint, "Next", that
 * hands over to Contact.
 */
export default function Experience({
  shaderUniformsRef,
}: {
  /** Set to this chapter's share of the backdrop shader's uniforms. */
  shaderUniformsRef: RefObject<ShaderUniformSource | null>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = usePinnedProgress(sectionRef);
  const reduceMotion = usePrefersReducedMotion();
  const vh = useTransform(progress, (p) => p / JOURNEY.at(1));
  const station = useTransform(vh, (v) => heldStation(v, STOPS.length, HOLD, TRAVEL));
  // How far the line has drawn, in screens from the first: on a waypoint
  // as each stop comes to rest, running on ahead while it is read.
  const frontier = useTransform(vh, (v) => v / (HOLD + TRAVEL) + WAYPOINT);

  useEffect(() => {
    shaderUniformsRef.current = () => (reduceMotion ? {} : { pan: station.get() * 0.35, travel: station.get() * 0.3 });
    return () => void (shaderUniformsRef.current = null);
  }, [station, shaderUniformsRef, reduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="experience"
      aria-labelledby="experience-heading"
      className="relative"
      style={{ height: JOURNEY.height }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute left-6 top-20 z-10 sm:left-10 md:left-[8vw] md:top-24">
          <ChapterLabel id="journey" />
          <h2 id="experience-heading" className="sr-only">
            Experience
          </h2>
        </div>

        <HorizontalTrack position={station}>
          {STOPS.map((stop, i) => (
            <TrackPanel key={stop.title}>
              <Waypoint stop={stop} index={i} vh={vh} station={station} frontier={frontier} reduceMotion={reduceMotion} />
            </TrackPanel>
          ))}
        </HorizontalTrack>
      </div>
    </section>
  );
}

/** One stop: its stretch of the line, its year sitting on the line, and
 *  what happened there below it. */
function Waypoint({
  stop,
  index,
  vh,
  station,
  frontier,
  reduceMotion,
}: {
  stop: Stop;
  index: number;
  vh: MotionValue<number>;
  station: MotionValue<number>;
  frontier: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const rest = restAt(index);
  const arrive = Math.max(rest - 50, 0);
  const line = useTransform(frontier, (f) => Math.min(Math.max(f - index, 0), 1));
  const reached = useTransform(frontier, (f) => (f >= index + WAYPOINT ? 1 : 0));
  const dotBackground = useTransform(reached, (r) => (r ? stop.accent : "rgba(7,9,18,1)"));
  const dotShadow = useTransform(reached, (r) => (r ? `0 0 16px 4px ${stop.accent}` : "0 0 0 0 transparent"));
  // The year fills with color, left to right, as the stop arrives.
  const fill = useTransform(vh, [arrive, arrive + 60], ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  // -1 arriving from the right, 0 at rest, 1 leaving to the left: the year
  // passes faster than the words, for depth.
  const offset = useTransform(station, (s) => s - index);
  const depth = reduceMotion ? 0 : 1;
  const markerX = useTransform(offset, (o) => `${o * -8 * depth}vw`);
  const textX = useTransform(offset, (o) => `${o * 3 * depth}vw`);

  const marker = "text-[26vw] font-black leading-[0.8] tracking-tighter md:text-[15vw]";

  return (
    <>
      <div className="absolute inset-x-0 top-[34%] md:top-[40%]">
        <SignalLine progress={line} orientation="horizontal" className="inset-x-0 top-0" />
        <motion.span
          aria-hidden
          style={{ background: dotBackground, boxShadow: dotShadow, left: `${WAYPOINT * 100}%` }}
          className="absolute top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50"
        />
      </div>

      <motion.div
        aria-hidden
        style={{ x: markerX }}
        className="absolute bottom-[66%] left-6 sm:left-10 md:bottom-[60%] md:left-[8vw]"
      >
        <span className={`${marker} block text-white/[0.08]`}>
          {stop.marker}
        </span>
        <motion.span
          style={{ clipPath: fill, color: stop.accent }}
          className={`${marker} absolute inset-0 block opacity-90`}
        >
          {stop.marker}
        </motion.span>
      </motion.div>

      <motion.div
        style={{ x: textX }}
        className="absolute inset-x-6 top-[calc(34%+2rem)] sm:inset-x-10 md:left-[8vw] md:right-[8vw] md:top-[calc(40%+2.5rem)]"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: stop.accent }}>
          {stop.eyebrow}
        </p>
        <h3 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl md:text-[3.6vw]">
          {stop.title}
        </h3>
        <p className="mt-3 max-w-2xl text-base text-white/70 sm:text-lg md:text-xl">{stop.subtitle}</p>
        {stop.points.length > 0 && (
          <ul className="mt-6 grid max-w-5xl gap-x-10 gap-y-3 md:mt-8 md:grid-cols-2 md:gap-y-4">
            {stop.points.map((point, j) => (
              <RevealPoint
                key={point}
                vh={vh}
                range={[arrive + 40 + j * 12, arrive + 70 + j * 12]}
                accent={stop.accent}
                className={j >= 3 ? "hidden md:block" : undefined}
              >
                {point}
              </RevealPoint>
            ))}
          </ul>
        )}
      </motion.div>
    </>
  );
}
