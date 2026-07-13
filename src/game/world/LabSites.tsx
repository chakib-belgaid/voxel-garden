import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../store";
import {
  BOX_GEOMETRY,
  CYLINDER_8_GEOMETRY,
  PALETTE,
  SharedBox,
  VoxelInstances,
  sharedMaterial,
  type VoxelBlock
} from "./VoxelPrimitives";
import { LAB_SITES, type LabKind, type LabSite } from "./labs";
import { getTerrainHeight } from "./procedural";

const LAB_RING_GEOMETRY = new THREE.TorusGeometry(1, 0.1, 6, 18);
const glassMaterial = new THREE.MeshStandardMaterial({
  color: "#7ce1dc",
  emissive: "#0c555b",
  emissiveIntensity: 0.12,
  roughness: 0.12,
  metalness: 0.02,
  transparent: true,
  opacity: 0.34,
  depthWrite: false,
  side: THREE.DoubleSide
});

function block(
  color: string,
  position: readonly [number, number, number],
  scale: readonly [number, number, number],
  rotation?: readonly [number, number, number]
): VoxelBlock {
  return { color, position, scale, ...(rotation ? { rotation } : {}) };
}

function sharedLabBlocks(accent: string): VoxelBlock[] {
  return [
    block(PALETTE.stoneDark, [0, 0.16, 0], [10.2, 0.32, 8.8]),
    block(PALETTE.stone, [0, 0.37, 0], [8.9, 0.12, 7.5]),
    block(PALETTE.charcoal, [0, 1.65, 0], [6.4, 2.55, 4.8]),
    block(PALETTE.pipeLight, [-3.05, 1.7, -2.15], [0.28, 3.2, 0.28]),
    block(PALETTE.pipeLight, [3.05, 1.7, -2.15], [0.28, 3.2, 0.28]),
    block(PALETTE.pipeLight, [-3.05, 1.7, 2.15], [0.28, 3.2, 0.28]),
    block(PALETTE.pipeLight, [3.05, 1.7, 2.15], [0.28, 3.2, 0.28]),
    block(accent, [0, 3.04, 0], [6.8, 0.22, 5.2]),
    block(PALETTE.brass, [0, 1.72, 2.48], [6.7, 0.2, 0.2]),
    block(PALETTE.screen, [0, 1.82, 2.56], [2.2, 0.75, 0.08])
  ];
}

function labBlocks(kind: LabKind, accent: string): readonly VoxelBlock[] {
  const blocks = sharedLabBlocks(accent);
  if (kind === "energy") {
    for (const x of [-2.1, 0, 2.1]) {
      blocks.push(block(PALETTE.solar, [x, 3.58, -0.15], [1.75, 0.12, 2.25], [-0.28, 0, 0]));
      blocks.push(block(PALETTE.solarLight, [x, 3.64, -0.42], [1.2, 0.05, 0.12], [-0.28, 0, 0]));
    }
    blocks.push(block(PALETTE.lime, [-3.85, 1.1, 0.6], [0.75, 1.9, 0.75]));
    blocks.push(block(PALETTE.brassLight, [3.85, 0.8, 0.6], [1.1, 1.3, 1.1]));
  } else if (kind === "bioglass") {
    for (const x of [-2.1, 0, 2.1]) {
      blocks.push(block(PALETTE.soil, [x, 0.72, 0.15], [1.45, 0.45, 2.7]));
      blocks.push(block(PALETTE.leafMid, [x, 1.05, 0.15], [1.05, 0.32, 2.2]));
      blocks.push(block(PALETTE.flowerPink, [x, 1.3, 0.55], [0.38, 0.32, 0.38]));
    }
    blocks.push(block(PALETTE.waterBright, [3.8, 1.25, 0.6], [0.85, 2.2, 0.85]));
  } else if (kind === "robotics") {
    for (const x of [-2.15, 0, 2.15]) {
      blocks.push(block(PALETTE.brassDark, [x, 0.82, 0.2], [1.55, 0.8, 2.2]));
      blocks.push(block(accent, [x, 1.27, 0.2], [1.08, 0.1, 1.65]));
      blocks.push(block(PALETTE.screen, [x, 1.12, 1.33], [0.7, 0.42, 0.08]));
    }
    blocks.push(block(PALETTE.pipeLight, [0, 3.75, 0], [0.26, 1.25, 0.26]));
    blocks.push(block(PALETTE.orange, [0, 4.35, 0], [1.35, 0.25, 0.25]));
  } else {
    for (const x of [-2.1, 0, 2.1]) {
      blocks.push(block(PALETTE.charcoal, [x, 1.12, 0.1], [1.55, 1.55, 1.75]));
      blocks.push(block(x === 0 ? accent : PALETTE.screen, [x, 1.23, 1.01], [0.95, 0.65, 0.08]));
    }
    blocks.push(block(PALETTE.pipe, [-2.25, 4.35, -0.7], [0.7, 2.6, 0.7]));
    blocks.push(block(PALETTE.pipeLight, [2.25, 3.85, -0.7], [0.55, 1.65, 0.55]));
  }
  return blocks;
}

function LabSignal({ color, phase }: { color: string; phase: number }) {
  const ringRef = useRef<THREE.Group>(null);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  useFrame(({ clock }) => {
    if (!ringRef.current || reducedMotion) return;
    ringRef.current.rotation.y = clock.elapsedTime * 0.65 + phase;
    ringRef.current.position.y = 4.85 + Math.sin(clock.elapsedTime * 1.4 + phase) * 0.13;
  });
  return (
    <group ref={ringRef} position={[0, 4.85, 0]}>
      <mesh geometry={LAB_RING_GEOMETRY} material={sharedMaterial(color)} rotation={[Math.PI / 2, 0, 0]} scale={[0.72, 0.72, 0.72]} castShadow dispose={null} />
      <SharedBox color={color} scale={[0.3, 0.3, 0.3]} rotation={[0.5, 0.5, 0.5]} castShadow={false} />
    </group>
  );
}

function LabBuilding({ site, index }: { site: LabSite; index: number }) {
  const ground = getTerrainHeight(site.position.x, site.position.z);
  const blocks = useMemo(() => labBlocks(site.kind, site.accent), [site]);
  return (
    <group position={[site.position.x, ground, site.position.z]} dispose={null}>
      <VoxelInstances blocks={blocks} />
      {site.kind === "bioglass" ? (
        <>
          <mesh geometry={BOX_GEOMETRY} material={glassMaterial} position={[0, 2.05, 0]} scale={[5.9, 2.55, 4.3]} renderOrder={2} dispose={null} />
          <mesh geometry={BOX_GEOMETRY} material={glassMaterial} position={[0, 3.48, 0]} scale={[5.1, 0.12, 3.5]} rotation={[0, 0, 0]} renderOrder={2} dispose={null} />
        </>
      ) : null}
      <mesh geometry={CYLINDER_8_GEOMETRY} material={sharedMaterial(PALETTE.brassDark)} position={[0, 0.45, 3.55]} scale={[0.9, 0.24, 0.9]} receiveShadow dispose={null} />
      <LabSignal color={site.accent} phase={index * 1.7} />
      <pointLight color={site.accent} intensity={0.85} distance={8} position={[0, 3.4, 2.4]} />
    </group>
  );
}

export function LabSites() {
  return (
    <group dispose={null}>
      {LAB_SITES.map((site, index) => <LabBuilding key={site.id} site={site} index={index} />)}
    </group>
  );
}

