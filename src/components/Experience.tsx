"use client";

import { motion } from "framer-motion";
import { experience, skillGroups } from "@/lib/data";

export default function Experience() {
  return (
    <section id="experience" className="px-6 py-32 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-3xl font-semibold text-white sm:text-4xl"
        >
          Experience
        </motion.h2>

        <div className="mt-12 space-y-14">
          {experience.map((job) => (
            <motion.div
              key={job.company}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="border-l border-white/10 pl-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl font-medium text-white">
                  {job.role} · <span className="text-white/60">{job.company}</span>
                </h3>
                <span className="text-xs uppercase tracking-widest text-white/40">
                  {job.period}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {job.points.map((point) => (
                  <li key={point} className="text-sm text-white/60">
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20"
        >
          <h3 className="text-sm uppercase tracking-widest text-white/40">Skills</h3>
          <div className="mt-6 space-y-5">
            {skillGroups.map((group) => (
              <div key={group.label} className="flex flex-wrap items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-white/50">{group.label}</span>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
