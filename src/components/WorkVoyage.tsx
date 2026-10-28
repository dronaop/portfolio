"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { projects, type Project } from "@/lib/data";
import { heldStation, pacing } from "@/lib/pacing";
import { usePinnedProgress } from "@/lib/use-pinned-progress";
import { HorizontalTrack, TrackPanel } from "@/components/ui/horizontal-track";
import { SignalLine } from "@/components/ui/signal-line";
import type { ShaderUniformSource } from "@/components/ui/animated-shader-hero";

/** The chapter's pinned scroll, in vh (see lib/pacing): each mission holds
 *  long enough to read, then the next slides in. */
const MISSIONS = projects.length;
const HOLD = 160;
const TRAVEL = 90;
const OUTRO = 30;
const WORK = pacing(MISSIONS * HOLD + (MISSIONS - 1) * TRAVEL + OUTRO);
/** Where mission `i` comes to rest, in vh into the scene. */
const restAt = (i: number) => i * (HOLD + TRAVEL);

/**
 * "Production" chapter: one full-screen mission per project, travelled
 * sideways like the Signals voyage, over the same space backdrop. As each
 * mission arrives its frame wipes open and tilts into place (moving faster
 * than the text, for depth), its points come in one by one, and then a
 * signal runs through the system's steps while it is read. The frame shows
 * the project's recording or screenshot instead, once it has one.
 */
export default function WorkVoyage({
  shaderUniformsRef,
}: {
  /** Set to this chapter's share of the backdrop shader's uniforms. */
  shaderUniformsRef: RefObject<ShaderUniformSource | null>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = usePinnedProgress(sectionRef);
  const reduceMotion = useReducedMotion() ?? false;
  const vh = useTransform(progress, (p) => p / WORK.at(1));
  const station = useTransform(vh, (v) => heldStation(v, MISSIONS, HOLD, TRAVEL));

  // The sky keeps panning (and drifting nearer) with the travel.
  useEffect(() => {
    shaderUniformsRef.current = () => (reduceMotion ? {} : { pan: station.get() * 0.35, travel: station.get() * 0.4 });
    return () => void (shaderUniformsRef.current = null);
  }, [station, shaderUniformsRef, reduceMotion]);

  const trajectory = useTransform(station, (s) => s / (MISSIONS - 1));
  const missionNumber = useTransform(station, (s) => String(Math.round(s) + 1).padStart(2, "0"));

  return (
    <section
      ref={sectionRef}
      id="work"
      aria-labelledby="work-heading"
      className="relative"
      style={{ height: WORK.height }}
    >
      <h2 id="work-heading" className="sr-only">
        Selected work
      </h2>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <HorizontalTrack position={station}>
          {projects.map((project, i) => (
            <TrackPanel key={project.slug}>
              <Mission project={project} index={i} vh={vh} station={station} reduceMotion={reduceMotion} />
            </TrackPanel>
          ))}
        </HorizontalTrack>

        <div aria-hidden className="absolute inset-x-6 bottom-6 flex items-center gap-5 sm:inset-x-10 sm:bottom-10">
          <p className="shrink-0 font-mono text-xs tracking-[0.3em] text-white/60">
            MISSION <motion.span className="text-white">{missionNumber}</motion.span> /{" "}
            {String(MISSIONS).padStart(2, "0")}
          </p>
          <div className="relative h-px flex-1">
            <SignalLine progress={trajectory} orientation="horizontal" className="inset-x-0 top-0" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** One project: its text on one side, its frame on the other (alternating). */
function Mission({
  project,
  index,
  vh,
  station,
  reduceMotion,
}: {
  project: Project;
  index: number;
  vh: MotionValue<number>;
  station: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const rest = restAt(index);
  // Arriving: the frame wipes open as the mission slides in (the first one,
  // just after the chapter pins).
  const reveal = Math.max(rest - 70, 0);
  // -1 arriving from the right, 0 at rest, 1 leaving to the left.
  const offset = useTransform(station, (s) => s - index);
  const depth = reduceMotion ? 0 : 1;
  const textX = useTransform(offset, (o) => `${o * 4 * depth}vw`);
  const frameX = useTransform(offset, (o) => `${o * -10 * depth}vw`);
  const frameTilt = useTransform(offset, (o) => o * 16 * depth);
  const frameClip = useTransform(
    vh,
    [reveal, reveal + 70],
    ["inset(0% 100% 0% 0% round 28px)", "inset(0% 0% 0% 0% round 28px)"],
  );
  const flow = useTransform(vh, [rest + 15, rest + HOLD - 25], [0, 1]);
  const frameFirst = index % 2 === 1;

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-center gap-6 px-6 pb-24 pt-20 sm:px-10 md:flex-row md:items-center md:gap-[5vw] md:px-[6vw] md:pb-20 md:pt-24 ${
        frameFirst ? "md:flex-row-reverse" : ""
      }`}
    >
      <motion.div style={{ x: textX }} className="md:w-[40%]">
        <p className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: project.accent }}>
          Mission {String(index + 1).padStart(2, "0")} · {project.tagline}
        </p>
        <h3 className="mt-3 text-balance text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl md:mt-4 md:text-[4.2vw]">
          {project.title}
        </h3>

        <ul className="mt-5 space-y-3 md:mt-7 md:space-y-4">
          {project.bullets.map((bullet, j) => (
            <Point key={bullet} vh={vh} range={[reveal + 25 + j * 14, reveal + 55 + j * 14]} accent={project.accent} hideOnPhone={j >= 2}>
              {bullet}
            </Point>
          ))}
        </ul>

        <p className="mt-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/45 md:mt-7">
          {project.tech.join(" · ")}
        </p>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 md:mt-7"
            style={{ borderColor: `${project.accent}80` }}
          >
            {project.linkLabel ?? "View project"}
            <ArrowUpRight size={16} aria-hidden />
          </a>
        )}
      </motion.div>

      <div className="order-first md:order-none md:w-[52%]" style={{ perspective: "1400px" }}>
        <motion.div style={{ x: frameX, rotateY: frameTilt }} className="relative">
          <div
            aria-hidden
            className="absolute -inset-[12%] -z-10 rounded-full opacity-40 blur-3xl"
            style={{ background: `radial-gradient(closest-side, ${project.accent}, transparent)` }}
          />
          <motion.div
            style={{ clipPath: frameClip }}
            className="relative aspect-[16/10] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#070912]/85"
          >
            {project.media ? (
              <MissionMedia project={project} />
            ) : (
              <SignalPath steps={project.flow} accent={project.accent} progress={flow} />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/** A mission point that rises in over `range` (vh into the scene). */
function Point({
  vh,
  range,
  accent,
  hideOnPhone,
  children,
}: {
  vh: MotionValue<number>;
  range: [number, number];
  accent: string;
  hideOnPhone: boolean;
  children: string;
}) {
  const opacity = useTransform(vh, range, [0, 1]);
  const y = useTransform(vh, range, [14, 0]);
  return (
    <motion.li
      style={{ opacity, y }}
      className={`relative pl-5 text-sm leading-relaxed text-white/75 sm:text-base lg:text-lg ${hideOnPhone ? "hidden md:block" : ""}`}
    >
      <span aria-hidden className="absolute left-0 top-[0.7em] h-px w-2.5" style={{ background: accent }} />
      {children}
    </motion.li>
  );
}

function MissionMedia({ project }: { project: Project }) {
  if (!project.media) return null;
  return project.media.type === "video" ? (
    <video
      src={project.media.src}
      autoPlay
      muted
      loop
      playsInline
      aria-label={project.description}
      className="absolute inset-0 h-full w-full object-cover"
    />
  ) : (
    <Image
      src={project.media.src}
      alt={project.description}
      fill
      sizes="(min-width: 768px) 52vw, 100vw"
      className="object-cover"
    />
  );
}

/** The project's system as a line of steps that a signal runs through as
 *  `progress` goes 0 → 1, lighting each step as it passes; labels sit
 *  alternately above and below the line so long names have room. */
function SignalPath({ steps, accent, progress }: { steps: string[]; accent: string; progress: MotionValue<number> }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 55%, ${accent}26, transparent 65%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      }}
    >
      <p className="absolute left-5 top-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 sm:left-7 sm:top-6">
        Signal path
      </p>
      <div className="absolute inset-x-[15%] top-1/2">
        <SignalLine progress={progress} orientation="horizontal" className="inset-x-0 top-0" />
        <ol>
          {steps.map((step, i) => (
            <Step key={step} index={i} at={i / (steps.length - 1)} accent={accent} progress={progress}>
              {step}
            </Step>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Step({
  index,
  at,
  accent,
  progress,
  children,
}: {
  index: number;
  /** 0..1 — where along the line it sits (and lights). */
  at: number;
  accent: string;
  progress: MotionValue<number>;
  children: string;
}) {
  const lit = useTransform(progress, (p) => (p >= at - 0.001 ? 1 : 0));
  const dotBackground = useTransform(lit, (l) => (l ? accent : "rgba(7,9,18,1)"));
  const dotShadow = useTransform(lit, (l) => (l ? `0 0 14px 3px ${accent}` : "0 0 0 0 transparent"));
  const labelOpacity = useTransform(lit, (l) => (l ? 1 : 0.4));
  const above = index % 2 === 0;
  return (
    <li className="absolute top-0" style={{ left: `${at * 100}%` }}>
      <motion.span
        aria-hidden
        style={{ background: dotBackground, boxShadow: dotShadow }}
        className="absolute left-0 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 sm:h-3 sm:w-3"
      />
      <motion.span
        style={{ opacity: labelOpacity }}
        className={`absolute left-0 w-max max-w-[9rem] -translate-x-1/2 text-center text-[11px] font-semibold leading-tight text-white sm:text-sm md:max-w-[11rem] md:text-base ${
          above ? "bottom-4 sm:bottom-6" : "top-4 sm:top-6"
        }`}
      >
        <span className="mb-1 block font-mono text-[9px] tracking-[0.2em] text-white/50 sm:text-[10px]">
          {String(index + 1).padStart(2, "0")}
        </span>
        {children}
      </motion.span>
    </li>
  );
}
