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
/** How far the accretion disk is tilted toward the viewer from edge-on,
 *  and turned about the line of sight (radians). */
const DISK_TILT = 0.2;
const DISK_TURN = 0.08;

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
 *  side lensed over and under it. It emerges out of the dark as `fade`
 *  goes 0 → 1; it only grows by being approached. Every frame it reports
 *  where it is on screen to `holeRef`, so the backdrop can bend its stars
 *  around it. */
export default function BlackHole({
  position,
  radius,
  viewer,
  holeRef,
  reduceMotion,
  fade,
}: {
  position: [number, number, number];
  radius: number;
  /** Where it is seen from on the way in; its disk is tilted to that. */
  viewer: [number, number, number];
  holeRef: RefObject<HoleState>;
  reduceMotion: boolean;
  /** 0..1 — how far it has emerged from the dark. */
  fade: () => number;
}) {
  const quad = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const center = useMemo(() => new THREE.Vector3(...position), [position]);
  const disk = useMemo(() => {
    const toViewer = new THREE.Vector3(...viewer).sub(center).normalize();
    const up = new THREE.Vector3(0, 1, 0).addScaledVector(toViewer, -toViewer.y).normalize();
    const normal = up
      .multiplyScalar(Math.cos(DISK_TILT))
      .addScaledVector(toViewer, Math.sin(DISK_TILT))
      .applyAxisAngle(toViewer, DISK_TURN)
      .normalize();
    return { normal, axis: new THREE.Vector3().crossVectors(normal, toViewer).normalize() };
  }, [viewer, center]);
  const uniforms = useMemo(
    () => ({
      uCenter: { value: center },
      uRs: { value: radius / SHADOW },
      uNormal: { value: disk.normal },
      uAxis: { value: disk.axis },
      uTime: { value: 0 },
      uFade: { value: 0 },
    }),
    [center, radius, disk],
  );

  useFrame(({ clock, camera, size }) => {
    const shown = fade();
    if (quad.current) {
      quad.current.visible = shown > 0;
      quad.current.quaternion.copy(camera.quaternion);
    }
    if (material.current) {
      material.current.uniforms.uTime.value = reduceMotion ? 0 : clock.elapsedTime;
      material.current.uniforms.uFade.value = shown;
    }

    toScreen.copy(center).project(camera);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    edge.copy(center).addScaledVector(right, radius).project(camera);
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
