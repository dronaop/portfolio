"use client";

import { motion } from "framer-motion";
import { Mail, ArrowUpRight } from "lucide-react";
import { ChapterLabel } from "@/components/ui/chapter-label";

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

const socialLinks = [
  { name: "Email", href: "mailto:deepanshu.drona@gmail.com", icon: Mail, label: "deepanshu.drona@gmail.com" },
  { name: "GitHub", href: "https://github.com/dronaop", icon: GithubIcon, label: "github.com/dronaop" },
  { name: "LinkedIn", href: "https://linkedin.com/in/deepanshu-drona", icon: LinkedinIcon, label: "linkedin.com/in/deepanshu-drona" },
];

const quickLinks = [
  { name: "Work", href: "#work" },
  { name: "Experience", href: "#experience" },
  { name: "Contact", href: "#contact" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="relative mt-20 overflow-hidden bg-[#05060a] px-6 pb-8 pt-20 sm:px-10">
      {/* Gradient Divider */}
      <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          
          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-1"
          >
            <ChapterLabel id="contact" className="mb-5" />
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Let&apos;s build <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#7c8cff] via-[#ff8a5c] to-[#4cd6b0] bg-clip-text text-transparent">something together.</span>
            </h2>
            <p className="mt-6 max-w-sm text-base text-white/60">
              Open to AI/ML roles and interesting collaborations. Always excited to discuss new ideas and solve complex problems.
            </p>
          </motion.div>

          {/* Social Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-sm font-medium uppercase tracking-wider text-white/40">Connect</h3>
            <div className="flex flex-col gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-white/10 group-hover:text-[#7c8cff]">
                    <link.icon size={18} />
                  </span>
                  <span className="truncate">{link.label}</span>
                  <ArrowUpRight size={14} className="opacity-0 -translate-x-2 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-[#4cd6b0]" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Nav */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4 md:items-end"
          >
            <h3 className="text-sm font-medium uppercase tracking-wider text-white/40 md:text-right">Navigation</h3>
            <div className="flex flex-col gap-3 md:items-end">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="group flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Copyright */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 flex flex-col items-center justify-between border-t border-white/10 pt-8 sm:flex-row gap-4"
        >
          <p className="text-xs text-white/40">
            &copy; {currentYear} Deepanshu Singh. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Designed & Built with Next.js & Tailwind
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
