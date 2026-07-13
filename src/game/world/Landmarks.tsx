import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PLAYER_START, SYSTEMS, isSystemUnlocked } from "../content";
import { useGameStore } from "../store";
import type { SystemAccent, SystemDefinition, WorldPosition } from "../types";
import {
  CYLINDER_12_GEOMETRY,
  PALETTE,
  SharedBox,
  VoxelInstances,
  sharedMaterial,
  type VoxelBlock
} from "./VoxelPrimitives";
import { getTerrainHeight } from "./procedural";

const TORUS_GEOMETRY = new THREE.TorusGeometry(1, 0.13, 6, 20);
const BEAM_GEOMETRY = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
const ACCENTS: Readonly<Record<SystemAccent, string>> = {
  lime: PALETTE.lime,
  violet: PALETTE.purple,
  cyan: PALETTE.screen,
  orange: PALETTE.orange
};

function block(color: string, position: readonly [number, number, number], scale: readonly [number, number, number], rotation?: readonly [number, number, number]): VoxelBlock {
  return { color, position, scale, ...(rotation ? { rotation } : {}) };
}

function outpostBlocks(system: SystemDefinition): readonly VoxelBlock[] {
  const accent = ACCENTS[system.accent];
  const blocks: VoxelBlock[] = [
    block(PALETTE.stoneDark, [0, 0.16, 0], [8.2, 0.32, 8.2]),
    block(PALETTE.brassDark, [0, 0.37, 0], [6.7, 0.12, 6.7]),
    block(accent, [0, 0.46, 0], [2.4, 0.1, 2.4])
  ];

  if (system.id === "wattch") {
    for (const x of [-2.3, 2.3]) {
      blocks.push(block(PALETTE.pipeLight, [x, 1.2, 0.6], [0.2, 1.7, 0.2]));
      blocks.push(block(PALETTE.solar, [x, 2.1, 0.25], [3.1, 0.18, 2.05], [-0.42, 0, 0]));
      blocks.push(block(PALETTE.solarLight, [x, 2.18, 0.12], [2.5, 0.06, 0.12], [-0.42, 0, 0]));
    }
    blocks.push(block(accent, [0, 1.5, -2.35], [0.75, 2.2, 0.75]));
  } else if (system.id === "whispbook") {
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      const height = 1.6 + (index % 2) * 0.8;
      blocks.push(block(PALETTE.stone, [Math.cos(angle) * 2.35, height * 0.5 + 0.4, Math.sin(angle) * 2.35], [0.7, height, 0.7], [0, angle, index * 0.08]));
      blocks.push(block(accent, [Math.cos(angle) * 2.35, height + 0.75, Math.sin(angle) * 2.35], [0.32, 0.72, 0.32], [0.4, angle, 0.4]));
    }
    blocks.push(block(PALETTE.charcoal, [0, 1.05, -0.35], [2.2, 1.25, 1.1]));
    blocks.push(block(PALETTE.screen, [0, 1.18, 0.24], [1.55, 0.58, 0.08]));
  } else if (system.id === "agent-commerce") {
    blocks.push(block(PALETTE.brass, [0, 3.15, -0.6], [6.2, 0.28, 0.3]));
    blocks.push(block(PALETTE.pipeLight, [-2.7, 1.7, -0.6], [0.3, 3.3, 0.3]));
    blocks.push(block(PALETTE.pipeLight, [2.7, 1.7, -0.6], [0.3, 3.3, 0.3]));
    for (const [x, z, color] of [[-1.8, 1.7, PALETTE.orange], [0, 1.8, PALETTE.waterBright], [1.8, 1.6, PALETTE.lime]] as const) {
      blocks.push(block(PALETTE.soilLight, [x, 0.9, z], [1.25, 1.1, 1.25]));
      blocks.push(block(color, [x, 1.48, z], [0.58, 0.08, 0.58]));
    }
  } else {
    for (const x of [-2.2, 0, 2.2]) {
      blocks.push(block(PALETTE.charcoal, [x, 1.55, -0.6], [1.55, 2.35, 1.45]));
      blocks.push(block(x === 0 ? accent : PALETTE.screen, [x, 1.68, 0.16], [1.05, 1.1, 0.08]));
      for (let light = 0; light < 3; light += 1) {
        blocks.push(block(light === 1 ? PALETTE.lime : PALETTE.brassLight, [x - 0.42 + light * 0.42, 0.72, 0.2], [0.12, 0.12, 0.08]));
      }
    }
  }
  return blocks;
}

function SystemOutpost({ system }: { system: SystemDefinition }) {
  const animatedRef = useRef<THREE.Group>(null);
  const restoredIds = useGameStore((state) => state.restoredIds);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  const restored = restoredIds.includes(system.id);
  const unlocked = isSystemUnlocked(system.id, restoredIds);
  const color = unlocked ? ACCENTS[system.accent] : PALETTE.stoneDark;
  const ground = getTerrainHeight(system.position.x, system.position.z);
  const blocks = useMemo(() => outpostBlocks(system), [system]);
  const beaconMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: restored ? 1.1 : unlocked ? 0.52 : 0.08,
    roughness: 0.34,
    metalness: 0.2
  }), [color, restored, unlocked]);
  const beamMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: restored ? 0.2 : unlocked ? 0.12 : 0.035,
    depthWrite: false,
    side: THREE.DoubleSide
  }), [color, restored, unlocked]);

  useFrame(({ clock }) => {
    if (!animatedRef.current) return;
    if (!reducedMotion) animatedRef.current.rotation.y = clock.elapsedTime * (restored ? 0.8 : 0.42);
    animatedRef.current.position.y = 2.25 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.7 + system.order) * 0.13);
  });

  const tryOpen = () => {
    const state = useGameStore.getState();
    const distance = Math.hypot(state.playerPosition.x - system.position.x, state.playerPosition.z - system.position.z);
    if (distance <= system.interactionRadius + 0.5) state.openSystem(system.id);
    else state.setNotice(`The ${system.name} signal is ${Math.round(distance)}m away.`);
  };

  return (
    <group position={[system.position.x, ground, system.position.z]} onPointerDown={(event) => { event.stopPropagation(); tryOpen(); }} dispose={null}>
      <VoxelInstances blocks={blocks} />
      <mesh geometry={BEAM_GEOMETRY} material={beamMaterial} position={[0, 15, 0]} scale={[0.38, 28, 0.38]} renderOrder={1} dispose={null} />
      <group ref={animatedRef} position={[0, 2.25, 0]}>
        <mesh geometry={TORUS_GEOMETRY} material={beaconMaterial} rotation={[Math.PI / 2, 0, 0]} scale={[0.92, 0.92, 0.92]} dispose={null} />
        <SharedBox color={color} position={[0, 0, 0]} scale={[0.46, 0.46, 0.46]} rotation={[0.55, 0.7, 0.55]} castShadow={false} />
      </group>
      {unlocked ? <pointLight color={color} intensity={restored ? 2.2 : 1.1} distance={restored ? 13 : 8} position={[0, 2.4, 0]} /> : null}
    </group>
  );
}

function GardenHeart() {
  const ground = getTerrainHeight(PLAYER_START.x, PLAYER_START.z);
  return (
    <group position={[PLAYER_START.x, ground, PLAYER_START.z]} dispose={null}>
      <mesh geometry={CYLINDER_12_GEOMETRY} material={sharedMaterial(PALETTE.stoneDark)} position={[0, 0.12, 0]} scale={[4.1, 0.24, 4.1]} receiveShadow dispose={null} />
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <SharedBox color={PALETTE.brass} position={[-1.3, 1.15, -2.8]} scale={[0.28, 2.2, 0.28]} />
          <SharedBox color={PALETTE.brass} position={[1.3, 1.15, -2.8]} scale={[0.28, 2.2, 0.28]} />
          <SharedBox color={PALETTE.lime} position={[0, 2.2, -2.8]} scale={[2.85, 0.28, 0.28]} />
        </group>
      ))}
      <pointLight color={PALETTE.lime} intensity={1.4} distance={10} position={[0, 2.4, 0]} />
    </group>
  );
}

export function WorldLandmarks() {
  return (
    <group dispose={null}>
      <GardenHeart />
      {SYSTEMS.map((system) => <SystemOutpost key={system.id} system={system} />)}
    </group>
  );
}
