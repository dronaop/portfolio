"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { experience } from "@/lib/data";
import { MapPin, Calendar } from "lucide-react";
import { ChapterLabel } from "@/components/ui/chapter-label";
import { SignalLine } from "@/components/ui/signal-line";

const timelineColors = ["#7c8cff", "#ff8a5c", "#4cd6b0", "#f9e076"];

export default function Experience() {
  const timelineRef = useRef<HTMLDivElement>(null);
  // The timeline draws itself as it passes the lower third of the screen.
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 70%"],
  });
  const lineProgress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.4 });

  return (
    <section id="experience" className="px-6 py-32 sm:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-3"
          >
            <ChapterLabel id="journey" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-5xl tracking-tight">
              Experience
            </h2>
            <div className="mt-6 h-px w-full max-w-xs bg-gradient-to-r from-white/20 to-transparent" />
          </motion.div>
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative md:ml-6 ml-4 space-y-12">
          <SignalLine progress={lineProgress} className="inset-y-0 left-0" />
          {experience.map((job, index) => {
            const color = timelineColors[index % timelineColors.length];
            return (
              <motion.div
                key={job.company}
                initial={{ opacity: 0, x: -20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative pl-8 md:pl-12"
              >
                {/* Timeline Dot */}
                <div
                  className="absolute -left-[4.5px] top-6 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
                >
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-50"
                    style={{ backgroundColor: color }}
                  />
                </div>

                {/* Experience Card */}
                <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 sm:p-8 transition-colors hover:border-white/[0.12]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {job.role}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm font-medium text-white/90">
                          {job.company}
                        </span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1 text-sm text-white/50">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 sm:mt-0 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      {job.period}
                    </div>
                  </div>
                  
                  <ul className="mt-6 space-y-3">
                    {job.points.map((point, i) => (
                      <li key={i} className="text-sm leading-relaxed text-white/60 flex items-start">
                        <span className="mr-3 mt-2 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
