"use client";

import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { skillGroups } from "@/lib/data";
import { WORLD_COLORS, beatsAt, stationAt } from "./beats";
import Planet from "./Planet";
import BlackHole, { type HoleState } from "./BlackHole";

/**
 * The Signals chapter's 3D voyage, on a transparent canvas over the hero's
 * space backdrop: the camera flies sideways past one planet per skill group
 * (its skills orbiting as moons), then turns to a black hole and dives in.
 * Scroll drives everything through the shared beats, read every frame, so
 * nothing re-renders while scrolling. Loaded lazily by SkillsVoyage.
 */
const FOV = 35;
const CAMERA_Z = 10;
/** Planet surface styles, in skillGroups order (see planetFragment). */
const KINDS = [0, 1, 2, 3];
/** The Data Engineering world wears a ring. */
const RINGED = 2;
/** A little depth between the worlds, so they don't sit on one plane. */
const DEPTHS = [0, -1.2, 0.4, -0.6];

const SKILLS = skillGroups.flatMap((group) => group.items);
const LABEL_STARTS = skillGroups.map((_, g) => skillGroups.slice(0, g).reduce((n, group) => n + group.items.length, 0));

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const COLORS = WORLD_COLORS.map(rgb);

/** Where everything sits, for a screen of this size. Wide: worlds alternate
 *  left and right of center (their titles take the other side). Narrow:
 *  worlds sit in the upper half, titles below. One world per `spacing`,
 *  matching one screen of titles per world. */
function layoutFor(width: number, height: number) {
  const visibleHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const visibleWidth = (visibleHeight * width) / height;
  const wide = width >= 768 && width >= height;
  const spacing = (wide ? 0.85 : 1) * visibleWidth;
  const radius = wide ? 0.19 * visibleHeight : 0.22 * visibleWidth;
  const planets = skillGroups.map((_, g): [number, number, number] => [
    // The ringed world is wider, so it sits further out.
    g * spacing + (wide ? (g % 2 ? 1 : -1) * (g === RINGED ? 0.29 : 0.24) * visibleWidth : 0),
    wide ? 0 : 0.17 * visibleHeight,
    DEPTHS[g],
  ]);
  const hole: [number, number, number] = [(skillGroups.length - 1 + 1.5) * spacing, 0, -2];
  return { wide, spacing, radius, planets, hole, holeRadius: 0.2 * visibleHeight };
}

export default function VoyageCanvas({
  progress,
  active,
  holeRef,
}: {
  /** 0..1 — pinned progress through the Signals chapter. */
  progress: MotionValue<number>;
  /** False while the chapter is off screen: the canvas stops rendering. */
  active: boolean;
  /** Written every frame: where the black hole is on screen. */
  holeRef: RefObject<HoleState>;
}) {
  const labelsRef = useRef<(HTMLElement | null)[]>([]);
  const placeLabel = useCallback((index: number, x: number, y: number, opacity: number) => {
    const label = labelsRef.current[index];
    if (!label) return;
    label.style.opacity = String(opacity);
    label.style.transform = `translate3d(${x + 12}px, ${y}px, 0) translateY(-50%)`;
  }, []);
  const [{ reduceMotion, narrow }] = useState(() => ({
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    narrow: window.innerWidth < 768,
  }));

  return (
    <div className="absolute inset-0">
      <Canvas
        flat
        dpr={[1, narrow ? 1.5 : 2]}
        frameloop={active ? "always" : "never"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: FOV, position: [0, 0, CAMERA_Z], near: 0.1, far: 200 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Scene progress={progress} placeLabel={placeLabel} holeRef={holeRef} reduceMotion={reduceMotion} detail={narrow ? 64 : 128} />
      </Canvas>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {SKILLS.map((name, i) => (
          <div
            key={name}
            ref={(el) => void (labelsRef.current[i] = el)}
            className="absolute left-0 top-0 whitespace-nowrap text-[11px] font-medium tracking-wide text-white/85 opacity-0 [text-shadow:0_0_10px_rgba(5,6,10,0.95)] sm:text-[13px]"
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

function Scene({
  progress,
  placeLabel,
  holeRef,
  reduceMotion,
  detail,
}: {
  progress: MotionValue<number>;
  placeLabel: (index: number, x: number, y: number, opacity: number) => void;
  holeRef: RefObject<HoleState>;
  reduceMotion: boolean;
  detail: number;
}) {
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const layout = useMemo(() => layoutFor(width, height), [width, height]);
  const station = useRef(0);

  // The camera rig runs before everything else each frame (negative
  // priority), so moons and the black hole project with this frame's view.
  useFrame(({ camera }) => {
    const beats = beatsAt(progress.get());
    station.current = stationAt(beats);
    const [hx, hy, hz] = layout.hole;
    const push = THREE.MathUtils.smoothstep(beats.dive, 0.35, 1) ** 1.4;
    // Stops just outside the horizon, by then filling the whole view.
    const closest = hz + layout.holeRadius * 1.6;
    camera.position.set(station.current * layout.spacing, hy * push, CAMERA_Z + (closest - CAMERA_Z) * push);
    // Ease the aim onto the black hole as the camera turns to it.
    camera.lookAt(camera.position.x + (hx - camera.position.x) * push * 0.2, hy * push, camera.position.z - 10);
  }, -1);

  return (
    <>
      {skillGroups.map((group, g) => (
        <Planet
          key={group.label}
          kind={KINDS[g]}
          color={COLORS[g]}
          position={layout.planets[g]}
          radius={g === RINGED ? layout.radius * 0.8 : layout.radius}
          ring={g === RINGED}
          skills={group.items}
          placeLabel={(i, x, y, opacity) => placeLabel(LABEL_STARTS[g] + i, x, y, opacity)}
          focus={() => 1 - THREE.MathUtils.smoothstep(Math.abs(station.current - g), 0.2, 0.55)}
          reduceMotion={reduceMotion}
          detail={detail}
        />
      ))}
      <BlackHole position={layout.hole} radius={layout.holeRadius} holeRef={holeRef} reduceMotion={reduceMotion} />
    </>
  );
}
