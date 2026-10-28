import { easeInOut } from "framer-motion";
import { skillGroups } from "@/lib/data";

/**
 * The Signals chapter's timeline, in pinned-section progress (0..1). Shared
 * by the page text (SkillsVoyage) and the 3D scene (VoyageCanvas), so the
 * camera and the titles always agree on where the voyage is.
 */
export const WORLDS = skillGroups.length;
/** Each world's color, in skillGroups order (the site palette). */
export const WORLD_COLORS = ["#7c8cff", "#ff8a5c", "#4cd6b0", "#ffcf6b"];

/** The heading decodes from noise. */
export const DECODE: [number, number] = [0.02, 0.09];
/** "Four worlds. One mission." sweeps across. */
export const COURSE: [number, number] = [0.13, 0.25];
/** The first world slides in from the right… */
export const APPROACH: [number, number] = [0.2, 0.28];
/** …then the voyage past every world. */
export const VOYAGE: [number, number] = [0.28, 0.78];
/** The black hole: the camera turns to it and dives in until all is black… */
export const DIVE: [number, number] = [0.78, 0.94];
/** …and comes out the other side. */
export const EMERGE: [number, number] = [0.94, 1];

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
export const ramp = (v: number, [start, end]: [number, number]) => clamp01((v - start) / (end - start));

/** Fraction of each leg spent holding still on a world, at each end. */
const HOLD = 0.18;

export type Beats = {
  /** 0..1 — the first world arriving. */
  approach: number;
  /** World in view, 0..WORLDS-1, easing between them and holding on each. */
  world: number;
  /** 0..1 — the dive into the black hole. */
  dive: number;
  /** 0..1 — out the other side. */
  emerge: number;
};

export function beatsAt(p: number): Beats {
  const legs = ramp(p, VOYAGE) * (WORLDS - 1);
  const leg = Math.min(Math.floor(legs), WORLDS - 2);
  const within = clamp01((legs - leg - HOLD) / (1 - 2 * HOLD));
  return {
    approach: easeInOut(ramp(p, APPROACH)),
    world: leg + easeInOut(within),
    dive: easeInOut(ramp(p, DIVE)),
    emerge: ramp(p, EMERGE),
  };
}

/** Where the voyage is, in panels from the first world: negative before it
 *  arrives, WORLDS-1 on the last, beyond that on the way to the black hole.
 *  The titles slide by one screen per panel; the camera by one world. */
export function stationAt({ approach, world, dive }: Beats) {
  return world - 1.6 * (1 - approach) + dive * 1.5;
}
