"use client";

import { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import { ArrowUpRight, Mail } from "lucide-react";
import { pacing } from "@/lib/pacing";
import { usePinnedProgress } from "@/lib/use-pinned-progress";
import { ChapterLabel } from "@/components/ui/chapter-label";
import { DecodeText } from "@/components/ui/decode-text";

function GithubIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const EMAIL = "deepanshu.drona@gmail.com";

const socialLinks = [
  { name: "GitHub", href: "https://github.com/dronaop", icon: GithubIcon },
  { name: "LinkedIn", href: "https://linkedin.com/in/deepanshu-drona", icon: LinkedinIcon },
];

/** The chapter's pinned scroll, in vh (see lib/pacing). */
const CONTACT = pacing(130);
const DECODE: [number, number] = [0, 75];

/**
 * "Contact" chapter, the last screen: a final transmission. Pinned, the
 * invitation decodes out of noise, then the email and links come in, and
 * the page ends on it. Links to #contact land on the finished screen.
 */
export default function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = usePinnedProgress(sectionRef);
  const vh = useTransform(progress, (p) => p / CONTACT.at(1));
  const decode = useTransform(vh, DECODE, [0, 1]);
  const lineOpacity = useTransform(vh, [55, 85], [0, 1]);
  const lineY = useTransform(vh, [55, 85], [16, 0]);
  const reachOpacity = useTransform(vh, [70, 105], [0, 1]);
  const reachY = useTransform(vh, [70, 105], [20, 0]);

  return (
    <footer ref={sectionRef} className="relative" style={{ height: CONTACT.height }}>
      {/* Anchor at the end of the scene, so nav links arrive decoded. */}
      <div id="contact" aria-hidden className="absolute inset-x-0 bottom-0 h-screen" />

      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        <ChapterLabel id="contact" />
        <h2 className="mt-6 max-w-6xl text-balance text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl md:text-[7vw]">
          <DecodeText text="Let's build something together." progress={decode} />
        </h2>
        <motion.p
          style={{ opacity: lineOpacity, y: lineY }}
          className="mt-6 max-w-xl text-lg text-white/65 sm:text-xl"
        >
          Tell me what you&apos;re building.
        </motion.p>

        <motion.div style={{ opacity: reachOpacity, y: reachY }} className="mt-10 flex flex-col items-center gap-6">
          <a
            href={`mailto:${EMAIL}`}
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#7c8cff] via-[#ff8a5c] to-[#4cd6b0] px-7 py-4 text-base font-semibold text-black transition-transform duration-300 hover:scale-105 sm:px-9 sm:text-lg"
          >
            <Mail size={20} aria-hidden />
            {EMAIL}
          </a>
          <div className="flex items-center gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                <link.icon size={18} />
                {link.name}
                <ArrowUpRight size={14} aria-hidden className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ))}
          </div>
        </motion.div>

        <div className="absolute inset-x-6 bottom-6 flex flex-col items-center justify-between gap-1 text-xs text-white/35 sm:inset-x-10 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Deepanshu Singh</p>
          <p>Built with Next.js, three.js and WebGL</p>
        </div>
      </div>
    </footer>
  );
}
