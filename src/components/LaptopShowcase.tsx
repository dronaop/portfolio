"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Project } from "@/lib/data";

export default function LaptopShowcase({
  project,
  reverse = false,
}: {
  project: Project;
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Laptop "opens" toward the viewer as it enters, then drifts through a
  // gentle 360-feeling yaw as you scroll past it.
  const rotateX = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [55, 0, 0, -20]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [reverse ? 22 : -22, 0, reverse ? -22 : 22]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.8, 1, 1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0, 1, 1, 0]);

  return (
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

      <div className="w-full max-w-lg">
        <p className="mb-2 text-xs uppercase tracking-[0.3em]" style={{ color: project.accent }}>
          {project.tagline}
        </p>
        <h3 className="text-3xl font-semibold text-white sm:text-4xl">{project.title}</h3>
        <p className="mt-4 text-white/70">{project.description}</p>

        <ul className="mt-6 space-y-3">
          {project.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-sm text-white/60">
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.accent }}
              />
              {bullet}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60"
            >
              {tech}
            </span>
          ))}
        </div>

        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105"
            style={{ backgroundColor: project.accent }}
          >
            {project.linkLabel ?? "View project"}
            <span aria-hidden>&rarr;</span>
          </a>
        )}
      </div>
    </div>
  );
}

function screenGradient(accent: string) {
  return `radial-gradient(circle at 30% 20%, ${accent}33, #0a0b10 70%)`;
}
