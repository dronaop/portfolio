"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { holeFragment, holeVertex } from "./shaders";

export type HoleState = [x: number, y: number, radius: number, strength: number];

/** The shadow is this many horizon radii across (light closer in falls). */
const SHADOW = 2.6;
/** The traced region (holeFragment's BOUND), in shadow radii, plus margin. */
const EXTENT = 14 / SHADOW + 0.5;
/** The accretion disk, tilted just off edge-on. */
const DISK_NORMAL = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(-1.42, 0, 0.08));
const DISK_AXIS = new THREE.Vector3(1, 0, 0).addScaledVector(DISK_NORMAL, -DISK_NORMAL.x).normalize();

/** Shows the shadow, glows the disk over what is behind (premultiplied). */
const OVER = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
} as const;

const toScreen = new THREE.Vector3();
const edge = new THREE.Vector3();
const right = new THREE.Vector3();

/** The black hole at the end of the voyage, ray traced (see holeFragment):
 *  a shadow `radius` across, ringed by its accretion disk, the disk's far
 *  side lensed over and under it. It grows out of a point as `appear` goes
 *  0 → 1. Every frame it reports where it is on screen to `holeRef`, so
 *  the backdrop can bend its stars around it. */
export default function BlackHole({
  position,
  radius,
  holeRef,
  reduceMotion,
  appear,
}: {
  position: [number, number, number];
  radius: number;
  holeRef: RefObject<HoleState>;
  reduceMotion: boolean;
  /** 0..1 — how much of the black hole is there yet. */
  appear: () => number;
}) {
  const quad = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const center = useMemo(() => new THREE.Vector3(...position), [position]);
  const uniforms = useMemo(
    () => ({
      uCenter: { value: center },
      uRs: { value: radius / SHADOW },
      uNormal: { value: DISK_NORMAL },
      uAxis: { value: DISK_AXIS },
      uTime: { value: 0 },
    }),
    [center, radius],
  );

  useFrame(({ clock, camera, size }) => {
    const shown = appear();
    if (quad.current) {
      quad.current.visible = shown > 0;
      quad.current.scale.setScalar(shown);
      quad.current.quaternion.copy(camera.quaternion);
    }
    if (material.current) {
      material.current.uniforms.uTime.value = reduceMotion ? 0 : clock.elapsedTime;
      material.current.uniforms.uRs.value = (radius / SHADOW) * shown;
    }

    toScreen.copy(center).project(camera);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    edge.copy(center).addScaledVector(right, radius * shown).project(camera);
    const ahead = toScreen.z < 1;
    const onScreen = 1 - THREE.MathUtils.smoothstep(Math.abs(toScreen.x), 1.2, 1.8);
    holeRef.current = [
      (toScreen.x + 1) / 2,
      (1 - toScreen.y) / 2,
      // In screen heights.
      Math.hypot(((edge.x - toScreen.x) / 2) * (size.width / size.height), (edge.y - toScreen.y) / 2),
      ahead ? onScreen * shown : 0,
    ];
  });

  return (
    <mesh ref={quad} position={position}>
      <planeGeometry args={[radius * EXTENT * 2, radius * EXTENT * 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={holeVertex}
        fragmentShader={holeFragment}
        uniforms={uniforms}
        {...OVER}
      />
    </mesh>
  );
}
