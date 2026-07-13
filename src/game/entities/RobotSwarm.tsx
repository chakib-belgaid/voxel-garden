import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../store";
import { BOX_GEOMETRY, PALETTE, sharedMaterial } from "../world/VoxelPrimitives";
import { getTerrainHeight } from "../world/procedural";
import {
  ROBOT_DEFINITIONS,
  getRobotPose,
  type RobotPose
} from "../world/robots";

export { ROBOT_DEFINITIONS, getRobotPose } from "../world/robots";

export interface RobotPalette {
  body: string;
  trim: string;
  can: string;
}

export const ROBOT_COLOR_PALETTES: readonly RobotPalette[] = Object.freeze([
  { body: PALETTE.cream, trim: PALETTE.lime, can: PALETTE.waterBright },
  { body: PALETTE.orange, trim: PALETTE.creamLight, can: PALETTE.solarLight },
  { body: PALETTE.purple, trim: PALETTE.flowerPink, can: PALETTE.waterBright },
  { body: PALETTE.flowerBlue, trim: PALETTE.lime, can: PALETTE.orange },
  { body: PALETTE.grassLight, trim: PALETTE.creamLight, can: PALETTE.screen },
  { body: PALETTE.red, trim: PALETTE.brassLight, can: PALETTE.flowerBlue },
  { body: PALETTE.solarLight, trim: PALETTE.screen, can: PALETTE.lime },
  { body: PALETTE.flowerPink, trim: PALETTE.creamLight, can: PALETTE.purple }
]);

const robotBodyMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.78,
  metalness: 0.05
});
const robotTrimMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.48,
  metalness: 0.28
});
const robotCanMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.56,
  metalness: 0.14
});

const partPosition = new THREE.Vector3();
const partScale = new THREE.Vector3();
const partEuler = new THREE.Euler();
const partQuaternion = new THREE.Quaternion();
const partMatrix = new THREE.Matrix4();

function paletteHash(robotIndex: number, seed: number): number {
  const value = Math.sin(robotIndex * 91.17 + seed * 0.000_173 + 47.31) * 12_543.327;
  return value - Math.floor(value);
}

export function getRobotPalette(robotIndex: number, seed: number): RobotPalette {
  const safeSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  const index = Math.min(
    ROBOT_COLOR_PALETTES.length - 1,
    Math.floor(paletteHash(robotIndex, safeSeed) * ROBOT_COLOR_PALETTES.length)
  );
  return ROBOT_COLOR_PALETTES[index];
}

function setPart(
  mesh: THREE.InstancedMesh,
  index: number,
  pose: RobotPose,
  bob: number,
  local: readonly [number, number, number],
  scale: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0]
) {
  const cos = Math.cos(pose.yaw);
  const sin = Math.sin(pose.yaw);
  partPosition.set(
    pose.x + local[0] * cos + local[2] * sin,
    getTerrainHeight(pose.x, pose.z) + bob + local[1],
    pose.z - local[0] * sin + local[2] * cos
  );
  partEuler.set(rotation[0], pose.yaw + rotation[1], rotation[2]);
  partQuaternion.setFromEuler(partEuler);
  partScale.set(...scale);
  partMatrix.compose(partPosition, partQuaternion, partScale);
  mesh.setMatrixAt(index, partMatrix);
}

/** Fifteen independently colored lab helpers remain seven instanced draw calls. */
export function RobotSwarm() {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const screenRef = useRef<THREE.InstancedMesh>(null);
  const limbRef = useRef<THREE.InstancedMesh>(null);
  const footRef = useRef<THREE.InstancedMesh>(null);
  const trimRef = useRef<THREE.InstancedMesh>(null);
  const sproutRef = useRef<THREE.InstancedMesh>(null);
  const canRef = useRef<THREE.InstancedMesh>(null);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  const robotColorSeed = useGameStore((state) => state.settings.robotColorSeed);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const trim = trimRef.current;
    const cans = canRef.current;
    if (!body || !trim || !cans) return;
    const color = new THREE.Color();
    ROBOT_DEFINITIONS.forEach((_, robotIndex) => {
      const palette = getRobotPalette(robotIndex, robotColorSeed);
      body.setColorAt(robotIndex * 2, color.set(palette.body));
      body.setColorAt(robotIndex * 2 + 1, color.set(palette.body));
      trim.setColorAt(robotIndex * 3, color.set(palette.trim));
      trim.setColorAt(robotIndex * 3 + 1, color.set(palette.trim));
      trim.setColorAt(robotIndex * 3 + 2, color.set(palette.trim));
      cans.setColorAt(robotIndex, color.set(palette.can));
    });
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (trim.instanceColor) trim.instanceColor.needsUpdate = true;
    if (cans.instanceColor) cans.instanceColor.needsUpdate = true;
    robotBodyMaterial.needsUpdate = true;
    robotTrimMaterial.needsUpdate = true;
    robotCanMaterial.needsUpdate = true;
  }, [robotColorSeed]);

  useFrame(({ clock }) => {
    const body = bodyRef.current;
    const screen = screenRef.current;
    const limbs = limbRef.current;
    const feet = footRef.current;
    const trim = trimRef.current;
    const sprouts = sproutRef.current;
    const cans = canRef.current;
    if (!body || !screen || !limbs || !feet || !trim || !sprouts || !cans) return;

    ROBOT_DEFINITIONS.forEach((robot, robotIndex) => {
      const movementTime = reducedMotion ? 0 : clock.elapsedTime;
      const pose = getRobotPose(robot, movementTime);
      const gaitTime = reducedMotion ? robot.phase : clock.elapsedTime + robot.phase;
      const bob = 0.08 + Math.sin(gaitTime * 2.2) * (reducedMotion ? 0 : 0.055);
      const step = Math.sin(gaitTime * 3.4) * (reducedMotion ? 0 : 0.1);

      setPart(body, robotIndex * 2, pose, bob, [0, 0.66, 0], [0.78, 0.66, 0.62]);
      setPart(body, robotIndex * 2 + 1, pose, bob, [0, 1.35, 0.02], [0.92, 0.68, 0.76]);
      setPart(screen, robotIndex, pose, bob, [0, 1.36, 0.41], [0.62, 0.32, 0.08]);
      setPart(limbs, robotIndex * 2, pose, bob, [-0.52, 0.72, 0], [0.2, 0.62, 0.2], [step * 0.45, 0, -0.18]);
      setPart(limbs, robotIndex * 2 + 1, pose, bob, [0.52, 0.72, 0], [0.2, 0.62, 0.2], [-step * 0.45, 0, 0.18]);
      setPart(feet, robotIndex * 2, pose, bob, [-0.29, 0.18 + step, 0], [0.38, 0.24, 0.58]);
      setPart(feet, robotIndex * 2 + 1, pose, bob, [0.29, 0.18 - step, 0], [0.38, 0.24, 0.58]);
      setPart(trim, robotIndex * 3, pose, bob, [-0.52, 1.36, 0], [0.17, 0.28, 0.28]);
      setPart(trim, robotIndex * 3 + 1, pose, bob, [0.52, 1.36, 0], [0.17, 0.28, 0.28]);
      setPart(trim, robotIndex * 3 + 2, pose, bob, [0, 0.68, 0.33], [0.28, 0.22, 0.1]);
      setPart(sprouts, robotIndex * 2, pose, bob, [-0.17, 1.86, 0], [0.4, 0.12, 0.2], [0, 0, -0.35]);
      setPart(sprouts, robotIndex * 2 + 1, pose, bob, [0.18, 1.9, 0], [0.4, 0.12, 0.2], [0, 0, 0.35]);
      setPart(cans, robotIndex, pose, bob, [0.76, 0.47, 0.25], [0.43, 0.48, 0.42]);
    });

    [body, screen, limbs, feet, trim, sprouts, cans].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  const count = ROBOT_DEFINITIONS.length;
  return (
    <group dispose={null}>
      <instancedMesh ref={bodyRef} args={[BOX_GEOMETRY, robotBodyMaterial, count * 2]} castShadow receiveShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={screenRef} args={[BOX_GEOMETRY, sharedMaterial(PALETTE.screen), count]} frustumCulled={false} dispose={null} />
      <instancedMesh ref={limbRef} args={[BOX_GEOMETRY, sharedMaterial(PALETTE.pipeLight), count * 2]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={footRef} args={[BOX_GEOMETRY, sharedMaterial(PALETTE.charcoal), count * 2]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={trimRef} args={[BOX_GEOMETRY, robotTrimMaterial, count * 3]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={sproutRef} args={[BOX_GEOMETRY, sharedMaterial(PALETTE.leafLight), count * 2]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={canRef} args={[BOX_GEOMETRY, robotCanMaterial, count]} castShadow frustumCulled={false} dispose={null} />
    </group>
  );
}
