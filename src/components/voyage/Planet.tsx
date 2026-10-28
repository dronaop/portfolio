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

/** Radians per second a planet turns. */
const SPIN_SPEED = 0.036;

export type PlanetProps = {
  /** Surface style, see planetFragment. */
  kind: number;
  /** Raw sRGB, 0..1. */
  color: [number, number, number];
  radius: number;
  ring?: boolean;
  reduceMotion: boolean;
  detail: number;
  /** Sets where the planet is (position, scale, visibility) this frame. */
  place: (planet: THREE.Group) => void;
};

/** A world in the Signals voyage: a lit, slowly turning sphere with an
 *  atmosphere and halo, optionally ringed. Its owner moves it each frame
 *  through `place`. */
export default function Planet({
  kind,
  color,
  radius,
  ring,
  reduceMotion,
  detail,
  place,
}: PlanetProps) {
  const planet = useRef<THREE.Group>(null);
  const surface = useRef<THREE.Mesh>(null);
  const surfaceMaterial = useRef<THREE.ShaderMaterial>(null);
  const ringMaterial = useRef<THREE.ShaderMaterial>(null);

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
        // Where the planet is now, for its shadow on the ring.
        uCenter: { value: new THREE.Vector3() },
        uRadius: { value: radius },
        uLight: { value: SUN },
      },
    };
  }, [kind, color, radius, detail]);

  useFrame(({ clock }) => {
    if (planet.current) {
      place(planet.current);
      if (ringMaterial.current) {
        ringMaterial.current.uniforms.uCenter.value.copy(planet.current.position);
        ringMaterial.current.uniforms.uRadius.value = radius * planet.current.scale.x;
      }
    }
    const t = reduceMotion ? 0 : clock.elapsedTime;
    if (surfaceMaterial.current) surfaceMaterial.current.uniforms.uTime.value = t;
    if (surface.current) surface.current.rotation.y = t * SPIN_SPEED + kind;
  });

  return (
    <group ref={planet}>
      <mesh position={[0, 0, -radius * 0.4]}>
        <planeGeometry args={[radius * 4.4, radius * 4.4]} />
        <shaderMaterial vertexShader={quadVertex} fragmentShader={haloFragment} uniforms={uniforms.halo} {...GLOW} />
      </mesh>

      <mesh ref={surface}>
        <sphereGeometry args={[radius, detail, Math.round(detail * 0.66)]} />
        <shaderMaterial
          ref={surfaceMaterial}
          vertexShader={planetVertex}
          fragmentShader={planetFragment}
          uniforms={uniforms.surface}
        />
      </mesh>

      <mesh>
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
        <mesh rotation={[-1.2, 0.0, 0.28]}>
          <ringGeometry args={[radius * 1.45, radius * 2.35, 160, 1]} />
          <shaderMaterial
            ref={ringMaterial}
            vertexShader={ringVertex}
            fragmentShader={ringFragment}
            uniforms={uniforms.ring}
            side={THREE.DoubleSide}
            {...GLOW}
          />
        </mesh>
      )}
    </group>
  );
}
