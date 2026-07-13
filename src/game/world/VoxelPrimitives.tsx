import { useLayoutEffect, useRef } from "react";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

void (0 as unknown as ThreeElements);

export type VoxelTuple = readonly [number, number, number];

export interface VoxelBlock {
  color: string;
  position: VoxelTuple;
  scale?: VoxelTuple;
  rotation?: VoxelTuple;
}

export const PALETTE = Object.freeze({
  void: "#020b0e",
  waterDeep: "#053944",
  water: "#087787",
  waterBright: "#18a8b4",
  foam: "#82e4e3",
  cliffDark: "#292f1d",
  cliff: "#45472a",
  cliffLight: "#69623a",
  grassDark: "#183b16",
  grass: "#295419",
  grassMid: "#3e6d1d",
  grassLight: "#6f8b22",
  leafDark: "#173e13",
  leaf: "#2f6b18",
  leafMid: "#4e8a1c",
  leafLight: "#85aa24",
  lime: "#9bd42b",
  soilDark: "#24190d",
  soil: "#3b2a12",
  soilLight: "#67451c",
  stoneDark: "#4b4c38",
  stone: "#777558",
  stoneLight: "#9d9870",
  cream: "#d9d0b5",
  creamLight: "#f1e9d4",
  brassDark: "#413a21",
  brass: "#756238",
  brassLight: "#a48746",
  pipe: "#383b32",
  pipeLight: "#696b58",
  charcoal: "#10191a",
  screen: "#25c8d1",
  solarDark: "#061a31",
  solar: "#0b3766",
  solarLight: "#1d6b92",
  orange: "#dd8615",
  red: "#c74726",
  purple: "#8537da",
  flowerPink: "#dc5a8a",
  flowerBlue: "#4da5d7",
  flowerWhite: "#e7ded0",
  skin: "#9a5f31",
  hair: "#221a13",
  coat: "#d8d5c9",
  trouser: "#273238"
});

export const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
export const CYLINDER_8_GEOMETRY = new THREE.CylinderGeometry(1, 1, 1, 8);
export const CYLINDER_12_GEOMETRY = new THREE.CylinderGeometry(1, 1, 1, 12);
export const SPHERE_8_GEOMETRY = new THREE.SphereGeometry(1, 8, 6);

const materialCache = new Map<string, THREE.MeshStandardMaterial>();
const instancedVoxelMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.84,
  metalness: 0.04
});

export function sharedMaterial(color: string): THREE.MeshStandardMaterial {
  const cached = materialCache.get(color);
  if (cached) return cached;

  const isMetal = color === PALETTE.pipe || color === PALETTE.pipeLight || color === PALETTE.brass;
  const isGlow = color === PALETTE.screen || color === PALETTE.lime || color === PALETTE.waterBright;
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: isMetal ? 0.58 : 0.88,
    metalness: isMetal ? 0.42 : 0.04,
    emissive: isGlow ? color : "#000000",
    emissiveIntensity: isGlow ? 0.16 : 0
  });
  materialCache.set(color, material);
  return material;
}

interface VoxelBatchProps {
  blocks: readonly VoxelBlock[];
  castShadow: boolean;
  receiveShadow: boolean;
}

function VoxelBatch({ blocks, castShadow, receiveShadow }: VoxelBatchProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const object = new THREE.Object3D();
    const color = new THREE.Color();
    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];
      const scale = block.scale ?? [1, 1, 1];
      const rotation = block.rotation ?? [0, 0, 0];
      object.position.set(...block.position);
      object.scale.set(...scale);
      object.rotation.set(...rotation);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      mesh.setColorAt(index, color.set(block.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // setColorAt creates instanceColor lazily; force the shared material to
    // compile its instancing-color shader variant after that attribute exists.
    instancedVoxelMaterial.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [blocks]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[BOX_GEOMETRY, instancedVoxelMaterial, blocks.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      dispose={null}
    />
  );
}

export interface VoxelInstancesProps {
  blocks: readonly VoxelBlock[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** A full colored voxel field is one instance-color draw call (plus its shadow). */
export function VoxelInstances({
  blocks,
  castShadow = true,
  receiveShadow = true
}: VoxelInstancesProps) {
  return (
    <VoxelBatch
      blocks={blocks}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

export interface SharedBoxProps {
  color: string;
  position?: VoxelTuple;
  scale?: VoxelTuple;
  rotation?: VoxelTuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function SharedBox({
  color,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  castShadow = true,
  receiveShadow = true
}: SharedBoxProps) {
  return (
    <mesh
      geometry={BOX_GEOMETRY}
      material={sharedMaterial(color)}
      position={position}
      scale={scale}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      dispose={null}
    />
  );
}
