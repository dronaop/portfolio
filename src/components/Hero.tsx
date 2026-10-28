"use client";

import { type RefObject } from "react";
import { easeIn, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Mail } from "lucide-react";
import { ChapterLabel } from "@/components/ui/chapter-label";

/**
 * Hero over a sticky 175vh section — one full screen of content (name,
 * three headline facts, CTAs), then the warp: scrolling scales the content
 * up past the camera while the shared space backdrop behind it (see
 * SpaceScene) flies forward through the stars, and the first chapter line
 * ("Every system starts as noise.") holds over the settling starfield.
 */
const FACTS = [
  { title: "LLM observability in production", detail: "Airflow + PySpark into Delta Lake, tracked in Metabase" },
  { title: "Self-improving classifier", detail: "Ships a new adapter only on F1 gain" },
  { title: "12-language LLM translation", detail: "Fine-tuned TinyLlama (QLoRA) pipeline" },
];

export default function Hero({ sectionRef }: { sectionRef: RefObject<HTMLDivElement | null> }) {
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    mass: 0.4,
  });

  const introOpacity = useTransform(smoothProgress, [0.04, 0.4], [1, 0]);
  const introScale = useTransform(smoothProgress, [0, 0.4], [1, reduceMotion ? 1 : 1.8], {
    ease: easeIn,
  });
  const introBlur = useTransform(smoothProgress, [0.1, 0.4], ["blur(0px)", "blur(10px)"]);
  const introPointerEvents = useTransform(smoothProgress, (v) => (v < 0.15 ? "auto" : "none"));
  const warpLineOpacity = useTransform(smoothProgress, [0.35, 0.5, 0.82, 0.97], [0, 1, 1, 0]);
  const warpLineY = useTransform(smoothProgress, [0.35, 0.5], [24, 0]);

  return (
    <section ref={sectionRef} className="relative h-[175vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          style={{
            opacity: introOpacity,
            scale: introScale,
            filter: introBlur,
            pointerEvents: introPointerEvents,
          }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center sm:px-10"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/60 sm:mb-5">
            AI / ML Developer
          </p>
          <h1 className="bg-gradient-to-r from-[#7c8cff] via-[#ff8a5c] to-[#4cd6b0] bg-clip-text pb-2 text-5xl font-semibold leading-[1.08] tracking-tight text-transparent sm:text-7xl lg:text-[5.5rem]">
            Deepanshu Singh
          </h1>

          <ul className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-3">
            {FACTS.map((fact) => (
              <li
                key={fact.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left backdrop-blur-sm sm:px-5 sm:py-4"
              >
                <p className="text-sm font-semibold text-white/90">{fact.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55 sm:text-[0.8rem]">
                  {fact.detail}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <a
              href="#work"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7c8cff] to-[#4cd6b0] px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#7c8cff]/25"
            >
              View Work
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/10"
            >
              <Mail size={16} />
              Get in touch
            </a>
          </div>

          <ChevronDown
            size={20}
            className="absolute bottom-6 animate-bounce text-white/40 motion-reduce:animate-none sm:bottom-10"
            aria-hidden
          />
        </motion.div>

        <motion.div
          style={{ opacity: warpLineOpacity, y: warpLineY }}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
        >
          <ChapterLabel id="data" />
          <p className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white/90 sm:text-5xl">
            Every system starts as noise.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
