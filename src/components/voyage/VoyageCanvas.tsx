"use client";

import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import { skillGroups } from "@/lib/data";
import { WORLD_COLORS, beatsAt, pullAt, stationAt } from "./beats";
import Planet from "./Planet";
import BlackHole, { type HoleState } from "./BlackHole";

/**
 * The Signals chapter's 3D voyage, on a transparent canvas over the hero's
 * space backdrop: the camera flies sideways over one planet per skill group,
 * each a horizon below that group's skills (page text), then turns to a
 * black hole and dives in.
 * Scroll drives everything through the shared beats, read every frame, so
 * nothing re-renders while scrolling. Loaded lazily by SkillsVoyage.
 */
const FOV = 35;
const CAMERA_Z = 10;
/** Planet surface styles, in skillGroups order (see planetFragment). */
const KINDS = [0, 1, 2, 3];
/** The Data Engineering world wears a ring. */
const RINGED = 2;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const COLORS = WORLD_COLORS.map(rgb);

const FORWARD = new THREE.Vector3(0, 0, -1);
const hole = new THREE.Vector3();
const start = new THREE.Vector3();
const stop = new THREE.Vector3();
const aim = new THREE.Vector3();

/** How far back the worlds sit while their skills are read. */
const HOLD_DEPTH = 6;
/** How much further away each world starts before rushing in. */
const RUSH_DISTANCE = 140;
/** How far ahead of the last world the black hole waits: far enough to be
 *  a small, distant thing in its sky. */
const HOLE_DEPTH = 120;

/** Where everything sits, for a screen of this size. Each world is a big
 *  planet rising from the bottom, leaving the sky above for its skills.
 *  Wide: it peaks to one side, opposite the text, alternating. Narrow:
 *  centered. Worlds are more than a screen apart so only one shows at a
 *  time. Sizes are in screens, scaled out to HOLD_DEPTH. */
function layoutFor(width: number, height: number) {
  const visibleHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const visibleWidth = (visibleHeight * width) / height;
  const wide = width >= 768 && width >= height;
  const toDepth = (CAMERA_Z + HOLD_DEPTH) / CAMERA_Z;
  // Worlds alternate sides, so every other gap is 0.6 screens shorter;
  // even that one stays well over a screen.
  const spacing = 2 * visibleWidth * toDepth;
  const radius = (wide ? 0.42 : 0.7) * visibleWidth * toDepth;
  // The top of each sphere, from the screen's center.
  const peak = (wide ? 0 : -0.22) * visibleHeight * toDepth;
  const planets = skillGroups.map((_, g): [number, number, number] => [
    g * spacing + (wide ? (g % 2 ? -1 : 1) * 0.3 * visibleWidth * toDepth : 0),
    peak - radius,
    -HOLD_DEPTH,
  ]);
  // In the last world's empty sky: above its planet, clear of its skills.
  const toHole = (CAMERA_Z + HOLE_DEPTH) / CAMERA_Z;
  const hole: [number, number, number] = [
    (skillGroups.length - 1) * spacing + (wide ? -0.25 * visibleWidth : 0) * toHole,
    (wide ? 0.25 : -0.13) * visibleHeight * toHole,
    -HOLE_DEPTH,
  ];
  // Where the camera sees it from as the fall begins.
  const holeViewer: [number, number, number] = [(skillGroups.length - 1) * spacing, 0, CAMERA_Z];
  return { wide, spacing, radius, planets, hole, holeViewer, holeRadius: 0.5 * visibleHeight };
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
        <Scene progress={progress} holeRef={holeRef} reduceMotion={reduceMotion} detail={narrow ? 64 : 128} />
      </Canvas>
    </div>
  );
}

function Scene({
  progress,
  holeRef,
  reduceMotion,
  detail,
}: {
  progress: MotionValue<number>;
  holeRef: RefObject<HoleState>;
  reduceMotion: boolean;
  detail: number;
}) {
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const layout = useMemo(() => layoutFor(width, height), [width, height]);
  const beatsRef = useRef(beatsAt(0));

  // Each world starts as a point of light far ahead and rushes in over the
  // leg that brings it into view (the first, over the approach), slowing
  // as it arrives.
  const placePlanet = useCallback(
    (g: number, planet: THREE.Group) => {
      const { approach, world } = beatsRef.current;
      const arrival = g === 0 ? approach : THREE.MathUtils.clamp(world - (g - 1), 0, 1);
      const [x, y, z] = layout.planets[g];
      planet.position.set(x, y, z - (1 - arrival) ** 2 * RUSH_DISTANCE);
      planet.scale.setScalar(THREE.MathUtils.smoothstep(arrival, 0, 0.12));
      planet.visible = arrival > 0;
    },
    [layout],
  );

  // The camera rig runs before everything else each frame (negative
  // priority), so the worlds and the black hole move with this frame's view.
  // The fall: the camera turns to the black hole and is pulled straight at
  // it, faster and faster, rolling as it spirals in, and stops just outside
  // the horizon, which by then fills the whole view.
  useFrame(({ camera }) => {
    const beats = beatsAt(progress.get());
    beatsRef.current = beats;
    const pull = pullAt(beats.dive);
    const turn = THREE.MathUtils.smoothstep(beats.dive, 0.08, 0.6);
    const roll = reduceMotion ? 0 : pull * 1.3;
    hole.set(...layout.hole);
    start.set(stationAt(beats) * layout.spacing, 0, CAMERA_Z);
    stop.subVectors(start, hole).setLength(layout.holeRadius * 1.6).add(hole);
    camera.position.lerpVectors(start, stop, pull);
    aim.subVectors(hole, camera.position).normalize().lerp(FORWARD, 1 - turn).add(camera.position);
    camera.up.set(-Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(aim);
  }, -1);

  return (
    <>
      {skillGroups.map((group, g) => (
        <Planet
          key={group.label}
          kind={KINDS[g]}
          color={COLORS[g]}
          radius={layout.radius}
          ring={g === RINGED}
          reduceMotion={reduceMotion}
          detail={detail}
          place={(planet) => placePlanet(g, planet)}
        />
      ))}
      <BlackHole
        position={layout.hole}
        radius={layout.holeRadius}
        viewer={layout.holeViewer}
        holeRef={holeRef}
        reduceMotion={reduceMotion}
        // Out of the dark only once the last world has been read.
        fade={() => THREE.MathUtils.smoothstep(beatsRef.current.dive, 0, 0.18)}
      />
    </>
  );
}
