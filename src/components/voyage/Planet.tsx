"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  atmosphereFragment,
  haloFragment,
  planetFragment,
  planetVertex,
  quadVertex,
  ringFragment,
  ringVertex,
  shellVertex,
} from "./shaders";

/** Adds light without touching alpha, so glows brighten the hero's sky
 *  behind the transparent canvas instead of covering it. */
export const GLOW = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
} as const;

/** Where the sun is: up and to the left, a little in front. */
export const SUN = new THREE.Vector3(-0.65, 0.45, 0.6).normalize();

/** Radians per second the moons orbit (and planets turn). */
const ORBIT_SPEED = 0.06;

const toScreen = new THREE.Vector3();

export type PlanetProps = {
  /** Surface style, see planetFragment. */
  kind: number;
  /** Raw sRGB, 0..1. */
  color: [number, number, number];
  position: [number, number, number];
  radius: number;
  ring?: boolean;
  /** One moon per skill. */
  skills: string[];
  /** Puts moon `index`'s name at this screen point (px), this visible. */
  placeLabel: (index: number, x: number, y: number, opacity: number) => void;
  /** 0..1 — how much this planet is the world in view (labels show then). */
  focus: () => number;
  reduceMotion: boolean;
  detail: number;
};

/** A world in the Signals voyage: a lit sphere with an atmosphere and halo,
 *  optionally ringed, circled by one moon per skill. Each frame it reports
 *  where every moon is on screen, so its name (a real page element) can sit
 *  beside it. */
export default function Planet({
  kind,
  color,
  position,
  radius,
  ring,
  skills,
  placeLabel,
  focus,
  reduceMotion,
  detail,
}: PlanetProps) {
  const surface = useRef<THREE.Mesh>(null);
  const surfaceMaterial = useRef<THREE.ShaderMaterial>(null);
  const moons = useRef<(THREE.Group | null)[]>([]);
  const center = useMemo(() => new THREE.Vector3(...position), [position]);

  const uniforms = useMemo(() => {
    const tint = new THREE.Vector3(...color);
    return {
      surface: {
        uKind: { value: kind },
        uColor: { value: tint },
        uLight: { value: SUN },
        uTime: { value: 0 },
        // Finer noise where there are pixels to show it.
        uOctaves: { value: detail >= 96 ? 6 : 4 },
      },
      air: { uColor: { value: tint }, uLight: { value: SUN } },
      halo: { uColor: { value: tint }, uStrength: { value: 0.32 } },
      ring: {
        uColor: { value: tint },
        uInner: { value: radius * 1.45 },
        uOuter: { value: radius * 2.35 },
        uCenter: { value: center },
        uRadius: { value: radius },
        uLight: { value: SUN },
      },
      moon: { uColor: { value: new THREE.Vector3(...color).lerp(new THREE.Vector3(1, 1, 1), 0.5) }, uStrength: { value: 0.55 } },
    };
  }, [kind, color, radius, center, detail]);

  // Moons circle on one tilted plane, at a few staggered distances (past
  // the ring, if there is one), evenly spaced around it.
  const orbits = useMemo(() => {
    const tilt = new THREE.Euler(0.38, 0, kind % 2 ? -0.22 : 0.22);
    const base = ring ? 2.45 : 1.55;
    return skills.map((_, i) => ({
      distance: radius * (base + 0.12 * (i % 3)),
      phase: (i / skills.length) * Math.PI * 2,
      tilt,
    }));
  }, [skills, radius, ring, kind]);

  useFrame(({ clock, camera, size }) => {
    const t = reduceMotion ? 0 : clock.elapsedTime;
    if (surfaceMaterial.current) surfaceMaterial.current.uniforms.uTime.value = t;
    if (surface.current) surface.current.rotation.y = t * ORBIT_SPEED * 0.6 + kind;

    const shown = focus();
    for (const [i, orbit] of orbits.entries()) {
      const moon = moons.current[i];
      if (!moon) continue;
      const angle = orbit.phase + t * ORBIT_SPEED;
      moon.position.set(Math.cos(angle) * orbit.distance, 0, Math.sin(angle) * orbit.distance).applyEuler(orbit.tilt).add(center);

      toScreen.copy(moon.position).project(camera);
      const behind = moon.position.z < center.z ? 0.35 : 1;
      placeLabel(i, ((toScreen.x + 1) / 2) * size.width, ((1 - toScreen.y) / 2) * size.height, shown * behind);
    }
  });

  return (
    <group>
      <mesh position={[position[0], position[1], position[2] - radius * 0.4]}>
        <planeGeometry args={[radius * 4.4, radius * 4.4]} />
        <shaderMaterial vertexShader={quadVertex} fragmentShader={haloFragment} uniforms={uniforms.halo} {...GLOW} />
      </mesh>

      <mesh ref={surface} position={position}>
        <sphereGeometry args={[radius, detail, Math.round(detail * 0.66)]} />
        <shaderMaterial
          ref={surfaceMaterial}
          vertexShader={planetVertex}
          fragmentShader={planetFragment}
          uniforms={uniforms.surface}
        />
      </mesh>

      <mesh position={position}>
        <sphereGeometry args={[radius * 1.15, detail, Math.round(detail * 0.66)]} />
        <shaderMaterial
          vertexShader={shellVertex}
          fragmentShader={atmosphereFragment}
          uniforms={uniforms.air}
          side={THREE.BackSide}
          {...GLOW}
        />
      </mesh>

      {ring && (
        <mesh position={position} rotation={[-1.2, 0.0, 0.28]}>
          <ringGeometry args={[radius * 1.45, radius * 2.35, 160, 1]} />
          <shaderMaterial
            vertexShader={ringVertex}
            fragmentShader={ringFragment}
            uniforms={uniforms.ring}
            side={THREE.DoubleSide}
            {...GLOW}
          />
        </mesh>
      )}

      {orbits.map((orbit, i) => (
        <group key={skills[i]} ref={(el) => void (moons.current[i] = el)}>
          <mesh>
            <sphereGeometry args={[radius * 0.035, 16, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh>
            <planeGeometry args={[radius * 0.3, radius * 0.3]} />
            <shaderMaterial vertexShader={quadVertex} fragmentShader={haloFragment} uniforms={uniforms.moon} {...GLOW} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
