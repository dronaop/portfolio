import { easeInOut } from "framer-motion";
import { skillGroups } from "@/lib/data";
import { heldStation, pacing } from "@/lib/pacing";

/**
 * The Signals chapter's timeline, paced in vh of scroll and exported as
 * pinned-section progress (0..1). Shared by the page text (SkillsVoyage)
 * and the 3D scene (VoyageCanvas), so the camera and the titles always
 * agree on where the voyage is.
 */
export const WORLDS = skillGroups.length;
/** Each world's color, in skillGroups order (the site palette). */
export const WORLD_COLORS = ["#7c8cff", "#ff8a5c", "#4cd6b0", "#ffcf6b"];

/** The chapter's pinned scroll, beat by beat, in vh (see lib/pacing). */
const STATEMENT = { decode: [0, 80], hold: 170, out: 205 };
const COURSE_VH = [185, 395];
const APPROACH_VH = [345, 435];
/** Scroll each world holds still for, then to fly on to the next. */
const WORLD_HOLD = 100;
const WORLD_TRAVEL = 70;
const VOYAGE_VH = [APPROACH_VH[1], APPROACH_VH[1] + WORLDS * WORLD_HOLD + (WORLDS - 1) * WORLD_TRAVEL];
const DIVE_VH = [VOYAGE_VH[1], VOYAGE_VH[1] + 220];
const EMERGE_VH = [DIVE_VH[1], DIVE_VH[1] + 40];
/** "Out the other side" holds this long before Production scrolls in. */
const EMERGE_HOLD = 90;

export const SIGNALS = pacing(EMERGE_VH[1] + EMERGE_HOLD);

/** The heading decodes from noise, holds, then slides away. */
export const DECODE = SIGNALS.span(STATEMENT.decode[0], STATEMENT.decode[1]);
export const STATEMENT_HOLD = SIGNALS.at(STATEMENT.hold);
export const STATEMENT_OUT = SIGNALS.at(STATEMENT.out);
/** "Four worlds. One mission." sweeps across. */
export const COURSE = SIGNALS.span(COURSE_VH[0], COURSE_VH[1]);
/** The first world slides in from the right… */
export const APPROACH = SIGNALS.span(APPROACH_VH[0], APPROACH_VH[1]);
/** …then the voyage past every world, holding on each. */
export const VOYAGE = SIGNALS.span(VOYAGE_VH[0], VOYAGE_VH[1]);
/** The black hole ahead pulls everything in until all is black… */
export const DIVE = SIGNALS.span(DIVE_VH[0], DIVE_VH[1]);
/** …and comes out the other side. */
export const EMERGE = SIGNALS.span(EMERGE_VH[0], EMERGE_VH[1]);

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
export const ramp = (v: number, [start, end]: [number, number]) => clamp01((v - start) / (end - start));

export type Beats = {
  /** 0..1 — the first world arriving. */
  approach: number;
  /** World in view, 0..WORLDS-1, easing between them and holding on each. */
  world: number;
  /** 0..1 — the fall into the black hole (linear; ease it per use). */
  dive: number;
  /** 0..1 — out the other side. */
  emerge: number;
};

export function beatsAt(p: number): Beats {
  return {
    approach: easeInOut(ramp(p, APPROACH)),
    world: heldStation((p - VOYAGE[0]) / SIGNALS.at(1), WORLDS, WORLD_HOLD, WORLD_TRAVEL),
    dive: ramp(p, DIVE),
    emerge: ramp(p, EMERGE),
  };
}

/** Where the voyage is, in panels from the first world: negative before it
 *  arrives, WORLDS-1 on the last (the black hole is straight ahead of it).
 *  The titles slide by one screen per panel; the camera by one world. */
export function stationAt({ approach, world }: Beats) {
  return world - 1.6 * (1 - approach);
}

/** 0..1 — how far the black hole has pulled us in: slowly at first, then
 *  faster and faster, as gravity would. */
export const pullAt = (dive: number) => dive ** 2.2;
