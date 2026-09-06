"use client";

import { useEffect, useRef } from "react";
import { easeIn, easeOut, motion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * Scroll-driven hero. The background is a static canvas neural-network graph
 * — nodes/edges fixed in place, with ambient light pulses always traveling
 * along random edges. On scroll, several real paths through the graph light
 * up point-by-point, each converging toward the center and finishing as
 * parallel lanes — like separate signals merging into one layer.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Raw scrollYProgress jumps in uneven steps on wheel/trackpad input,
  // which reads as flicker over a narrow opacity range. Spring it so the
  // fade glides instead of stepping.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    mass: 0.4,
  });

  // Name, then the tagline broken into three short beats, all sharing one
  // "box wipe" language and one on-screen axis — each slides up through its
  // own clip edge to replace whatever was just there, so nothing sits on
  // screen as one dense block. Name/quote1/quote2/quote3 each get an equal
  // quarter of the scroll range; each quarter's own enter/hold/exit splits
  // into equal thirds (skipped where there's nothing to enter from or hold
  // past — name has no entrance, quote3 has no exit).
  const BOX_TRAVEL = 56;
  const slot = 1 / 4;
  const nameStart = 0;
  const q1Start = nameStart + slot;
  const q2Start = q1Start + slot;
  const q3Start = q2Start + slot;
  const beat = slot / 3;

  const nameY = useTransform(smoothProgress, [q1Start - beat, q1Start], [0, -BOX_TRAVEL], {
    ease: easeOut,
  });
  const nameOpacity = useTransform(smoothProgress, [q1Start - beat, q1Start], [1, 0]);

  const quote1Y = useTransform(
    smoothProgress,
    [q1Start, q1Start + beat, q1Start + 2 * beat, q2Start],
    [BOX_TRAVEL, 0, 0, -BOX_TRAVEL],
    { ease: easeOut },
  );
  const quote1Opacity = useTransform(
    smoothProgress,
    [q1Start, q1Start + beat, q1Start + 2 * beat, q2Start],
    [0, 1, 1, 0],
  );

  const quote2Y = useTransform(
    smoothProgress,
    [q2Start, q2Start + beat, q2Start + 2 * beat, q3Start],
    [BOX_TRAVEL, 0, 0, -BOX_TRAVEL],
    { ease: easeOut },
  );
  const quote2Opacity = useTransform(
    smoothProgress,
    [q2Start, q2Start + beat, q2Start + 2 * beat, q3Start],
    [0, 1, 1, 0],
  );

  const quote3Y = useTransform(smoothProgress, [q3Start, q3Start + beat], [BOX_TRAVEL, 0], {
    ease: easeOut,
  });
  const quote3Opacity = useTransform(smoothProgress, [q3Start, q3Start + beat], [0, 1]);

  return (
    <section ref={sectionRef} className="relative h-[190vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#05060a]">
        <div className="absolute inset-0 gradient-fallback" aria-hidden />

        <NeuralNetworkField sectionRef={sectionRef} scrollYProgress={smoothProgress} />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-[#05060a]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center justify-center px-6 sm:px-10">
          <div className="mx-auto max-w-3xl text-center">
          <motion.p
            style={{ opacity: nameOpacity, y: nameY }}
            className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-cyan-100/70"
          >
            AI / ML Developer
          </motion.p>

          <div className="relative min-h-[8rem] w-full overflow-hidden sm:min-h-[11rem]">
            <motion.h1
              style={{ opacity: nameOpacity, y: nameY }}
              className="absolute inset-0 flex items-center justify-center text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-white sm:text-7xl lg:text-8xl"
            >
              Deepanshu Singh
            </motion.h1>

            <motion.p
              style={{ opacity: quote1Opacity, y: quote1Y }}
              className="absolute inset-0 flex items-center justify-center text-balance text-center text-2xl font-semibold leading-snug tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl"
            >
              I build LLM pipelines,
            </motion.p>

            <motion.p
              style={{ opacity: quote2Opacity, y: quote2Y }}
              className="absolute inset-0 flex items-center justify-center text-balance text-center text-2xl font-semibold leading-snug tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl"
            >
              fine-tuned models,
            </motion.p>

            <motion.p
              style={{ opacity: quote3Opacity, y: quote3Y }}
              className="absolute inset-0 flex items-center justify-center text-balance text-center text-2xl font-semibold leading-snug tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl"
            >
              and the data infrastructure that keeps them observable in production.
            </motion.p>
          </div>

          <motion.p style={{ opacity: nameOpacity }} className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            I design reliable AI systems—from data pipelines and evaluation to production-ready LLM experiences.
          </motion.p>

          <motion.div style={{ opacity: nameOpacity }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#work" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#05060a] transition-transform hover:scale-105">
              Explore selected work <span aria-hidden>↓</span>
            </a>
            <a href="#contact" className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
              Let&apos;s talk <span aria-hidden>↗</span>
            </a>
          </motion.div>

          <motion.div style={{ opacity: nameOpacity }} className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 border-t border-white/10 pt-6 text-sm text-white/55">
            <span><strong className="mr-2 font-semibold text-white">LLM systems</strong> built for production</span>
            <span><strong className="mr-2 font-semibold text-white">27K+</strong> images modelled</span>
            <span><strong className="mr-2 font-semibold text-white">Data + ML</strong> end to end</span>
          </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Node = { x: number; y: number };
type Edge = { a: number; b: number };
type Pulse = Edge & { offset: number; speed: number; color: string };
type Point = { x: number; y: number };
/** points = [...real grid dots, bendPoint, endPoint]. realCount is the
 *  number of real grid dots, so rendering can give every path the same
 *  progress budget for its real segments and the same final window for its
 *  synthetic tail (the bend + parallel finish). */
type SignalPath = { points: Point[]; realCount: number; color: string };

const COLORS = ["#7c8cff", "#ff8a5c", "#4cd6b0"];
const PATH_COLORS = ["#7c8cff", "#ff8a5c", "#4cd6b0", "#ffcf6b", "#e8a5ff"];
const PATH_COUNT = 5;

function buildNetwork(width: number, height: number) {
  const area = width * height;
  const count = Math.min(70, Math.max(28, Math.round(area / 16000)));

  const nodes: Node[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));

  const maxDist = Math.max(width, height) * 0.16;
  const edgeKeys = new Set<string>();
  const edges: Edge[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const neighbors = nodes
      .map((n, j) => ({ j, d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }))
      .filter(({ j, d }) => j !== i && d < maxDist)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);

    for (const { j } of neighbors) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ a: i, b: j });
    }
  }

  const pulses: Pulse[] = edges
    .filter(() => Math.random() < 0.4)
    .map((e) => ({
      ...e,
      offset: Math.random(),
      speed: 0.12 + Math.random() * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

  const paths = buildConvergingPaths(width, height);

  return { nodes, edges, pulses, paths };
}

const GRID_ROWS = 4;

/** Shared cell geometry for the PATH_COUNT-column × GRID_ROWS-row grid, so
 *  the path builder and the (temporary) debug overlay always agree on
 *  where the cells and the merge line actually are. The grid is a
 *  trapezoid, not a rectangle: each row is narrower than the one above it,
 *  down to a still-roomy band just above the merge line — an inverted
 *  trapezium made of rows, tapering gently toward the convergence point
 *  instead of holding constant width then bending sharply at the end (or
 *  tapering all the way to a cramped point). */
function gridLayout(width: number, height: number) {
  const centerX = width / 2;
  const mergeY = height * 0.75;
  const laneGap = Math.max(10, width * 0.008);

  const rowHeight = mergeY / GRID_ROWS;
  const rowInset = rowHeight * 0.15;
  const topRowWidth = width * 0.94;
  const bottomRowWidth = Math.max(width * 0.5, laneGap * PATH_COUNT * 2);

  return { centerX, mergeY, laneGap, rowHeight, rowInset, topRowWidth, bottomRowWidth };
}

type GridLayout = ReturnType<typeof gridLayout>;

/** The row×lane cell rectangle inside the trapezoid: row 0 spans
 *  `topRowWidth`, the last row spans `bottomRowWidth`, everything between
 *  interpolates linearly. Within a row, PATH_COUNT lanes tile that row's
 *  width edge-to-edge (each inset for a gap), so lanes can never overlap
 *  each other at that row — and since every row shares the same
 *  center-anchored, left-to-right lane order, a lane's cells never cross
 *  another lane's cells between rows either. */
function cellRect(row: number, lane: number, layout: GridLayout) {
  const { centerX, rowHeight, rowInset, topRowWidth, bottomRowWidth } = layout;
  const t = GRID_ROWS > 1 ? row / (GRID_ROWS - 1) : 0;
  const rowWidth = topRowWidth + (bottomRowWidth - topRowWidth) * t;

  const colWidth = rowWidth / PATH_COUNT;
  const colInset = colWidth * 0.18;
  const rowLeft = centerX - rowWidth / 2;

  const rowStart = row * rowHeight + rowInset;
  return {
    x: rowLeft + lane * colWidth + colInset,
    y: rowStart,
    w: Math.max(colWidth - colInset * 2, 0),
    h: Math.max(rowHeight - rowInset * 2, 0),
  };
}

/** PATH_COUNT signal lines laid out on a virtual PATH_COUNT-column ×
 *  GRID_ROWS-row trapezoid (see gridLayout). Each line is locked to one
 *  lane for its whole life, so two lines can never cross. Within its
 *  lane, a line places one dot per row (rows stack downward toward the
 *  merge height), each dot at a random point inside that row's cell:
 *  organic placement with zero risk of overlap. After the last row, every
 *  line bends onto a shared set of parallel finishing lanes, ordered to
 *  match how far left/right each line's last dot sits so the bends fan in
 *  without crossing. Which line gets which lane is reshuffled on every
 *  rebuild. */
function buildConvergingPaths(width: number, height: number): SignalPath[] {
  const layout = gridLayout(width, height);
  const { centerX, mergeY, laneGap } = layout;

  const lanes = shuffle(Array.from({ length: PATH_COUNT }, (_, i) => i));

  const rawPaths = lanes.map((lane, idx) => {
    const points: Point[] = Array.from({ length: GRID_ROWS }, (_, row) => {
      const rect = cellRect(row, lane, layout);
      return {
        x: rect.x + Math.random() * rect.w,
        y: rect.y + Math.random() * rect.h,
      };
    });

    return { idx, points, color: PATH_COLORS[idx % PATH_COLORS.length] };
  });

  // Assign lane slots in the same left-to-right order the paths actually
  // approach from, so the finishing bends fan in without crossing.
  const laneOrder = rawPaths
    .map(({ idx, points }) => ({ idx, lastX: points[points.length - 1].x }))
    .sort((a, b) => a.lastX - b.lastX)
    .map((entry, slotIndex) => ({ idx: entry.idx, slot: slotIndex - (PATH_COUNT - 1) / 2 }));
  const slotByIndex = new Map(laneOrder.map(({ idx, slot }) => [idx, slot]));

  return rawPaths.map(({ idx, points, color }) => {
    const realCount = points.length;
    const laneFinishX = centerX + (slotByIndex.get(idx) ?? 0) * laneGap;

    // Every path turns onto its lane at the same shared height (mergeY) —
    // never partway between its own end point and the merge, or each one
    // bends at a different height and the "same line" convergence breaks.
    // The last row's cell always ends at least rowInset above mergeY (see
    // cellRect), so the last real dot is guaranteed to sit above mergeY.
    const bendY = mergeY;

    return {
      points: [...points, { x: laneFinishX, y: bendY }, { x: laneFinishX, y: bendY + height * 0.3 }],
      realCount,
      color,
    };
  });
}

/** Fisher–Yates shuffle — reassigns which signal line gets which grid
 *  column on every rebuild. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function NeuralNetworkField({
  sectionRef,
  scrollYProgress,
}: {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = window.devicePixelRatio || 1;

    let network = buildNetwork(1, 1);
    let rafId = 0;
    let lastTime = performance.now();
    let running = false;

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      network = buildNetwork(canvas.width, canvas.height);
    };

    const drawGlowDot = (x: number, y: number, radius: number, color: string) => {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { width: w, height: h } = canvas;
      const progress = scrollYProgress.get();
      const { nodes, edges, pulses, paths } = network;

      ctx.clearRect(0, 0, w, h);

      // Ambient graph — fixed in place, always the same.
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (const { a, b } of edges) {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      }
      for (const n of nodes) drawGlowDot(n.x, n.y, 7 * dpr, "rgba(255,255,255,0.75)");

      if (!reduceMotion) {
        for (const p of pulses) {
          p.offset = (p.offset + dt * p.speed) % 1;
          const na = nodes[p.a];
          const nb = nodes[p.b];
          const x = na.x + (nb.x - na.x) * p.offset;
          const y = na.y + (nb.y - na.y) * p.offset;
          drawGlowDot(x, y, 9 * dpr, p.color);
        }
      }

      // Traced signals: several paths through the graph, each lit
      // point-by-point as the user scrolls, converging toward the center
      // and finishing as parallel lanes. Nothing here moves the graph.
      //
      // Paths have different hop counts, so lighting each one proportional
      // to its own length would reach the parallel tail at different
      // moments. Instead every path spends progress [0, REAL_PHASE_END] on
      // its real segments and [REAL_PHASE_END, 1] on its synthetic tail
      // (however many waypoints that path's bend needed), so all five snap
      // into "parallel" together.
      const REAL_PHASE_END = 0.85;
      for (const { points, realCount, color } of paths) {
        if (points.length < 2) continue;

        const realSegments = Math.max(realCount - 1, 0);
        const tailSegments = Math.max(points.length - realCount, 1);
        const phaseEnd = realSegments > 0 ? REAL_PHASE_END : 0;

        let litIndex: number;
        let litFrac: number;
        if (progress <= phaseEnd && realSegments > 0) {
          const lit = (progress / phaseEnd) * realSegments;
          litIndex = Math.min(Math.floor(lit), realSegments - 1);
          litFrac = lit - litIndex;
        } else {
          const rawT = phaseEnd < 1 ? (progress - phaseEnd) / (1 - phaseEnd) : 1;
          // Ease in: the final convergence starts slow and accelerates into
          // the merge, instead of travelling the bend + parallel lane at a
          // constant linear rate.
          const t = easeIn(Math.min(Math.max(rawT, 0), 1));
          const lit = t * tailSegments;
          const tailIndex = Math.min(Math.floor(lit), tailSegments - 1);
          litIndex = realSegments + tailIndex;
          litFrac = lit - tailIndex;
        }
        litIndex = Math.min(litIndex, points.length - 2);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * dpr;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < litIndex; i++) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[i + 1].x, points[i + 1].y);
          ctx.stroke();
        }

        const a = points[litIndex];
        const b = points[litIndex + 1];
        const headX = a.x + (b.x - a.x) * litFrac;
        const headY = a.y + (b.y - a.y) * litFrac;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        ctx.globalAlpha = 1;

        for (let i = 0; i <= litIndex; i++) {
          drawGlowDot(points[i].x, points[i].y, 9 * dpr, color);
        }
        drawGlowDot(headX, headY, 11 * dpr, color);
      }

      if (running) rafId = requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    resize();
    window.addEventListener("resize", resize);

    const target = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    if (target) observer.observe(target);

    if (reduceMotion) {
      render(performance.now());
    } else {
      start();
    }

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [scrollYProgress, sectionRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
