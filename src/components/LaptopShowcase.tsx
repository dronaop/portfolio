"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView, type Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Project } from "@/lib/data";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LaptopShowcase({
  project,
  reverse = false,
  index,
}: {
  project: Project;
  reverse?: boolean;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(textRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [55, 0, 0, -20]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [reverse ? 22 : -22, 0, reverse ? -22 : 22]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.8, 1, 1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0, 1, 1, 0]);

  const formattedIndex = (index + 1).toString().padStart(2, "0");

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-24 lg:flex-row ${
          reverse ? "lg:flex-row-reverse" : ""
        }`}
      >
        <div className="laptop-stage w-full max-w-xl">
          <motion.div
            style={{ rotateX, rotateY, scale, opacity }}
            className="laptop"
          >
            <div
              className="laptop-screen"
              style={{ boxShadow: `0 0 60px -15px ${project.accent}55` }}
            >
              <div className="laptop-notch" />
              {project.media ? (
                project.media.type === "video" ? (
                  <video
                    className="laptop-screen-media"
                    src={project.media.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="laptop-screen-media" src={project.media.src} alt={`${project.title} preview`} />
                )
              ) : (
                <div className="laptop-screen-content" style={{ background: screenGradient(project.accent) }}>
                  <span className="laptop-screen-label">{project.title}</span>
                  <span className="laptop-screen-hint">demo preview — drop a screen recording here</span>
                </div>
              )}
            </div>
            <div className="laptop-base">
              <div className="laptop-hinge" />
            </div>
          </motion.div>
        </div>

        <motion.div 
          ref={textRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="w-full max-w-lg rounded-3xl border border-white/[0.05] bg-white/[0.02] p-8 backdrop-blur-sm sm:p-10"
        >
          <motion.div variants={itemVariants} className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: project.accent }}>
              {project.tagline}
            </p>
            <span className="text-sm font-light tracking-widest text-white/30 font-mono">
              {formattedIndex}
            </span>
          </motion.div>
          
          <motion.h3 variants={itemVariants} className="text-3xl font-semibold text-white sm:text-4xl">
            {project.title}
          </motion.h3>
          
          <motion.p variants={itemVariants} className="mt-5 text-white/70 leading-relaxed">
            {project.description}
          </motion.p>

          <motion.ul variants={itemVariants} className="mt-8 space-y-4">
            {project.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm text-white/60">
                <ChevronRight 
                  className="mt-0.5 h-4 w-4 shrink-0" 
                  style={{ color: project.accent }} 
                />
                <span className="leading-relaxed">{bullet}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-white/5 bg-white/[0.05] px-3.5 py-1.5 text-xs text-white/70 backdrop-blur-sm"
              >
                {tech}
              </span>
            ))}
          </motion.div>

          {project.link && (
            <motion.div variants={itemVariants}>
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="group mt-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-black transition-all hover:scale-105"
                style={{ 
                  backgroundColor: project.accent,
                  boxShadow: `0 0 0 0 ${project.accent}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px 0 ${project.accent}80`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 0 ${project.accent}`;
                }}
              >
                {project.linkLabel ?? "View project"}
                <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Section Divider */}
      <div className="absolute bottom-0 left-1/2 h-px w-3/4 max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function screenGradient(accent: string) {
  return `radial-gradient(circle at 30% 20%, ${accent}33, #0a0b10 70%)`;
}
