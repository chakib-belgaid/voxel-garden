import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../store";
import { PALETTE } from "./VoxelPrimitives";

function random(index: number, seed: number): number {
  const value = Math.sin(index * 91.17 + seed * 47.31) * 12543.327;
  return value - Math.floor(value);
}

export function GardenParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const quality = useGameStore((state) => state.settings.quality);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  const count = quality === "high" ? 110 : 42;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorChoices = [PALETTE.lime, PALETTE.screen, PALETTE.flowerWhite, PALETTE.orange];
    for (let index = 0; index < count; index += 1) {
      const edge = random(index, 1) > 0.45;
      const x = edge
        ? (random(index, 2) > 0.5 ? 1 : -1) * (15 + random(index, 3) * 7)
        : -16 + random(index, 4) * 32;
      const z = edge ? -12 + random(index, 5) * 24 : -11 + random(index, 6) * 22;
      positions[index * 3] = x;
      positions[index * 3 + 1] = 0.7 + random(index, 7) * 4.5;
      positions[index * 3 + 2] = z;
      const color = new THREE.Color(colorChoices[index % colorChoices.length]);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    result.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    result.computeBoundingSphere();
    return result;
  }, [count]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size: quality === "high" ? 0.14 : 0.11,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), [quality]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const player = useGameStore.getState().playerPosition;
    pointsRef.current.position.x = player.x;
    pointsRef.current.position.z = player.z;
    if (reducedMotion) return;
    pointsRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.018;
    pointsRef.current.position.y = Math.sin(clock.elapsedTime * 0.45) * 0.12;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} dispose={null} />;
}
