import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../store";
import {
  BOX_GEOMETRY,
  CYLINDER_12_GEOMETRY,
  PALETTE,
  sharedMaterial
} from "../world/VoxelPrimitives";
import {
  DRONE_DEFINITIONS,
  getDronePose,
  type DronePose
} from "../world/drones";
import { getTerrainHeight } from "../world/procedural";

const droneBodyMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.42,
  metalness: 0.34
});
const droneLightMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  emissive: "#ffffff",
  emissiveIntensity: 0.75,
  roughness: 0.24,
  metalness: 0.08
});
const cargoMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.purple,
  emissive: "#2a0b53",
  emissiveIntensity: 0.14,
  roughness: 0.76,
  metalness: 0.02
});
const waterMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.waterBright,
  emissive: PALETTE.waterBright,
  emissiveIntensity: 0.28,
  transparent: true,
  opacity: 0.9,
  roughness: 0.24
});

const partPosition = new THREE.Vector3();
const partScale = new THREE.Vector3();
const partEuler = new THREE.Euler();
const partQuaternion = new THREE.Quaternion();
const partMatrix = new THREE.Matrix4();

function setPart(
  mesh: THREE.InstancedMesh,
  index: number,
  pose: DronePose,
  local: readonly [number, number, number],
  scale: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0]
) {
  const cos = Math.cos(pose.yaw);
  const sin = Math.sin(pose.yaw);
  partPosition.set(
    pose.x + local[0] * cos + local[2] * sin,
    getTerrainHeight(pose.x, pose.z) + pose.altitude + local[1],
    pose.z - local[0] * sin + local[2] * cos
  );
  partEuler.set(rotation[0], pose.yaw + rotation[1], rotation[2]);
  partQuaternion.setFromEuler(partEuler);
  partScale.set(...scale);
  partMatrix.compose(partPosition, partQuaternion, partScale);
  mesh.setMatrixAt(index, partMatrix);
}

function hidePart(mesh: THREE.InstancedMesh, index: number) {
  partPosition.set(0, -100, 0);
  partQuaternion.identity();
  partScale.setScalar(0.001);
  partMatrix.compose(partPosition, partQuaternion, partScale);
  mesh.setMatrixAt(index, partMatrix);
}

function commit(...meshes: readonly THREE.InstancedMesh[]) {
  for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
}

/** Five flying workers remain nine instanced draw calls, including cargo and water. */
export function DroneFleet() {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const armRef = useRef<THREE.InstancedMesh>(null);
  const rotorRef = useRef<THREE.InstancedMesh>(null);
  const bladeRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const tankRef = useRef<THREE.InstancedMesh>(null);
  const cargoRef = useRef<THREE.InstancedMesh>(null);
  const streamRef = useRef<THREE.InstancedMesh>(null);
  const dropRef = useRef<THREE.InstancedMesh>(null);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const lights = lightRef.current;
    const tanks = tankRef.current;
    if (!body || !lights || !tanks) return;
    const color = new THREE.Color();
    DRONE_DEFINITIONS.forEach((drone, index) => {
      const isLibrary = drone.job === "library";
      body.setColorAt(index, color.set(isLibrary ? PALETTE.cream : PALETTE.waterBright));
      lights.setColorAt(index, color.set(isLibrary ? PALETTE.purple : PALETTE.lime));
      tanks.setColorAt(index, color.set(isLibrary ? PALETTE.purple : PALETTE.water));
    });
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
    if (tanks.instanceColor) tanks.instanceColor.needsUpdate = true;
    droneBodyMaterial.needsUpdate = true;
    droneLightMaterial.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const body = bodyRef.current;
    const arms = armRef.current;
    const rotors = rotorRef.current;
    const blades = bladeRef.current;
    const lights = lightRef.current;
    const tanks = tankRef.current;
    const cargo = cargoRef.current;
    const streams = streamRef.current;
    const drops = dropRef.current;
    if (!body || !arms || !rotors || !blades || !lights || !tanks || !cargo || !streams || !drops) return;

    const elapsed = reducedMotion ? 0 : clock.elapsedTime;
    const rotorSpin = reducedMotion ? 0.4 : elapsed * 16;
    DRONE_DEFINITIONS.forEach((drone, droneIndex) => {
      const pose = getDronePose(drone, elapsed);
      const hover = reducedMotion ? 0 : Math.sin(elapsed * 3.2 + droneIndex * 1.4) * 0.055;
      const animatedPose = { ...pose, altitude: pose.altitude + hover };

      setPart(body, droneIndex, animatedPose, [0, 0, 0], [0.82, 0.3, 0.66]);
      setPart(lights, droneIndex, animatedPose, [0, 0.04, 0.36], [0.34, 0.1, 0.055]);
      setPart(arms, droneIndex * 2, animatedPose, [0, 0.02, 0], [1.82, 0.1, 0.12]);
      setPart(arms, droneIndex * 2 + 1, animatedPose, [0, 0.02, 0], [0.12, 0.1, 1.58]);

      const rotorPositions = [
        [-0.83, 0.05, 0],
        [0.83, 0.05, 0],
        [0, 0.05, -0.71],
        [0, 0.05, 0.71]
      ] as const;
      rotorPositions.forEach((rotorPosition, rotorIndex) => {
        const partIndex = droneIndex * 4 + rotorIndex;
        setPart(rotors, partIndex, animatedPose, rotorPosition, [0.23, 0.07, 0.23]);
        setPart(
          blades,
          partIndex,
          animatedPose,
          [rotorPosition[0], rotorPosition[1] + 0.09, rotorPosition[2]],
          [0.58, 0.025, 0.08],
          [0, rotorSpin + rotorIndex * 1.7, 0]
        );
      });

      if (drone.job === "watering") {
        setPart(tanks, droneIndex, animatedPose, [0, -0.29, -0.15], [0.4, 0.36, 0.32]);
      } else {
        hidePart(tanks, droneIndex);
      }

      if (pose.carryingBook) {
        setPart(
          cargo,
          droneIndex,
          animatedPose,
          [0, -0.44 - pose.bookDropDistance, 0],
          [0.44, 0.1, 0.31],
          [0, 0.12, 0.04]
        );
      } else {
        hidePart(cargo, droneIndex);
      }

      if (drone.job === "watering" && pose.wateringIntensity > 0.22) {
        setPart(streams, droneIndex, animatedPose, [0, -1.2, -0.04], [0.075, 1.55, 0.075]);
      } else {
        hidePart(streams, droneIndex);
      }

      for (let dropIndex = 0; dropIndex < 4; dropIndex += 1) {
        const instanceIndex = droneIndex * 4 + dropIndex;
        if (drone.job !== "watering" || pose.wateringIntensity < 0.08) {
          hidePart(drops, instanceIndex);
          continue;
        }
        const dropProgress = positiveFraction(elapsed * 2.3 + dropIndex * 0.24 + droneIndex * 0.17);
        const spread = Math.sin(dropProgress * Math.PI * 2 + dropIndex) * 0.08;
        setPart(
          drops,
          instanceIndex,
          animatedPose,
          [spread, -0.5 - dropProgress * 1.55, -0.04 + spread],
          [0.09, 0.22, 0.09]
        );
      }
    });

    commit(body, arms, rotors, blades, lights, tanks, cargo, streams, drops);
  });

  const droneCount = DRONE_DEFINITIONS.length;
  return (
    <group dispose={null}>
      <instancedMesh ref={bodyRef} args={[BOX_GEOMETRY, droneBodyMaterial, droneCount]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={armRef} args={[BOX_GEOMETRY, sharedMaterial(PALETTE.pipeLight), droneCount * 2]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={rotorRef} args={[CYLINDER_12_GEOMETRY, sharedMaterial(PALETTE.charcoal), droneCount * 4]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={bladeRef} args={[BOX_GEOMETRY, sharedMaterial(PALETTE.brassLight), droneCount * 4]} frustumCulled={false} dispose={null} />
      <instancedMesh ref={lightRef} args={[BOX_GEOMETRY, droneLightMaterial, droneCount]} frustumCulled={false} dispose={null} />
      <instancedMesh ref={tankRef} args={[BOX_GEOMETRY, droneBodyMaterial, droneCount]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={cargoRef} args={[BOX_GEOMETRY, cargoMaterial, droneCount]} castShadow frustumCulled={false} dispose={null} />
      <instancedMesh ref={streamRef} args={[BOX_GEOMETRY, waterMaterial, droneCount]} frustumCulled={false} dispose={null} />
      <instancedMesh ref={dropRef} args={[BOX_GEOMETRY, waterMaterial, droneCount * 4]} frustumCulled={false} dispose={null} />
    </group>
  );
}

function positiveFraction(value: number): number {
  return value - Math.floor(value);
}
