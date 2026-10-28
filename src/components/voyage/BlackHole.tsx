"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLOW } from "./Planet";
import { diskFragment, quadVertex } from "./shaders";

export type HoleState = [x: number, y: number, radius: number, strength: number];

const toScreen = new THREE.Vector3();
const edge = new THREE.Vector3();
const RIGHT = new THREE.Vector3(1, 0, 0);

/** The black hole at the end of the voyage: a black horizon, an accretion
 *  disk seen nearly edge-on, and that disk's far side lensed into a halo
 *  around the horizon. Every frame it reports where it is on screen to
 *  `holeRef`, so the backdrop can bend its stars around it. */
export default function BlackHole({
  position,
  radius,
  holeRef,
  reduceMotion,
}: {
  position: [number, number, number];
  radius: number;
  holeRef: RefObject<HoleState>;
  reduceMotion: boolean;
}) {
  const center = useMemo(() => new THREE.Vector3(...position), [position]);
  const diskMaterial = useRef<THREE.ShaderMaterial>(null);
  const lensedMaterial = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      disk: {
        uInner: { value: radius * 1.35 },
        uOuter: { value: radius * 4.4 },
        uTime: { value: 0 },
        uLensed: { value: 0 },
        uStrength: { value: 1 },
      },
      lensed: {
        uInner: { value: radius * 1.02 },
        uOuter: { value: radius * 2.1 },
        uTime: { value: 0 },
        uLensed: { value: 1 },
        uStrength: { value: 0.9 },
      },
    }),
    [radius],
  );

  useFrame(({ clock, camera, size }) => {
    const t = reduceMotion ? 0 : clock.elapsedTime;
    for (const material of [diskMaterial.current, lensedMaterial.current]) {
      if (material) material.uniforms.uTime.value = t;
    }

    toScreen.copy(center).project(camera);
    edge.copy(center).addScaledVector(RIGHT, radius).project(camera);
    const ahead = toScreen.z < 1;
    const onScreen = 1 - THREE.MathUtils.smoothstep(Math.abs(toScreen.x), 1.2, 1.8);
    holeRef.current = [
      (toScreen.x + 1) / 2,
      (1 - toScreen.y) / 2,
      (Math.abs(edge.x - toScreen.x) / 2) * (size.width / size.height),
      ahead ? onScreen : 0,
    ];
  });

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.02]}>
        <ringGeometry args={[radius * 1.02, radius * 2.1, 192, 1]} />
        <shaderMaterial
          ref={lensedMaterial}
          vertexShader={quadVertex}
          fragmentShader={diskFragment}
          uniforms={uniforms.lensed}
          {...GLOW}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh rotation={[-1.42, 0, 0.08]}>
        <ringGeometry args={[radius * 1.35, radius * 4.4, 192, 1]} />
        <shaderMaterial
          ref={diskMaterial}
          vertexShader={quadVertex}
          fragmentShader={diskFragment}
          uniforms={uniforms.disk}
          side={THREE.DoubleSide}
          {...GLOW}
        />
      </mesh>
    </group>
  );
}
