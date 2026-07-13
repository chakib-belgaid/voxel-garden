import { useMemo } from "react";
import {
  CYLINDER_12_GEOMETRY,
  PALETTE,
  SharedBox,
  VoxelInstances,
  sharedMaterial,
  type VoxelBlock
} from "./VoxelPrimitives";
import {
  BOOK_PICKUP,
  FLOWER_BEDS,
  LIBRARY_DROPOFF,
  WATER_REFILL
} from "./drones";
import { getTerrainHeight } from "./procedural";

function LibraryBookDepot() {
  const ground = getTerrainHeight(BOOK_PICKUP.x, BOOK_PICKUP.z);
  const blocks = useMemo<readonly VoxelBlock[]>(() => [
    { color: PALETTE.stoneDark, position: [0, 0.1, 0], scale: [1.8, 0.2, 1.5] },
    { color: PALETTE.brass, position: [0, 0.36, -0.54], scale: [1.55, 0.48, 0.15] },
    { color: PALETTE.brassDark, position: [-0.7, 0.42, 0], scale: [0.14, 0.68, 1.2] },
    { color: PALETTE.brassDark, position: [0.7, 0.42, 0], scale: [0.14, 0.68, 1.2] },
    { color: PALETTE.purple, position: [-0.32, 0.42, 0.03], scale: [0.52, 0.12, 0.72], rotation: [0, 0.08, 0] },
    { color: PALETTE.creamLight, position: [0.24, 0.5, 0.02], scale: [0.56, 0.1, 0.68], rotation: [0, -0.12, 0] },
    { color: PALETTE.flowerBlue, position: [-0.08, 0.62, 0], scale: [0.58, 0.1, 0.7], rotation: [0, 0.04, 0] },
    { color: PALETTE.screen, position: [0, 0.86, -0.59], scale: [0.78, 0.12, 0.06] }
  ], []);
  return (
    <group position={[BOOK_PICKUP.x, ground, BOOK_PICKUP.z]} dispose={null}>
      <VoxelInstances blocks={blocks} />
      <pointLight color={PALETTE.purple} intensity={0.55} distance={4.5} position={[0, 1.25, 0]} />
    </group>
  );
}

function LibraryDropSlot() {
  const ground = getTerrainHeight(LIBRARY_DROPOFF.x, LIBRARY_DROPOFF.z);
  return (
    <group position={[LIBRARY_DROPOFF.x, ground, LIBRARY_DROPOFF.z]} dispose={null}>
      <SharedBox color={PALETTE.brassDark} position={[0, 1.73, 0]} scale={[0.78, 0.14, 0.72]} />
      <SharedBox color={PALETTE.purple} position={[-0.34, 1.85, 0]} scale={[0.1, 0.22, 0.72]} />
      <SharedBox color={PALETTE.purple} position={[0.34, 1.85, 0]} scale={[0.1, 0.22, 0.72]} />
      <SharedBox color={PALETTE.screen} position={[0, 1.83, -0.34]} scale={[0.5, 0.08, 0.06]} castShadow={false} />
      <pointLight color={PALETTE.purple} intensity={0.75} distance={5} position={[0, 2.05, 0]} />
    </group>
  );
}

const FLOWER_COLORS = [
  PALETTE.flowerPink,
  PALETTE.flowerBlue,
  PALETTE.flowerWhite,
  PALETTE.orange,
  PALETTE.purple
] as const;

function FlowerBed({ index }: { index: number }) {
  const position = FLOWER_BEDS[index];
  const ground = getTerrainHeight(position.x, position.z);
  const blocks = useMemo<readonly VoxelBlock[]>(() => {
    const bed: VoxelBlock[] = [
      { color: PALETTE.soilDark, position: [0, 0.1, 0], scale: [2.2, 0.2, 1.55] },
      { color: PALETTE.soilLight, position: [0, 0.22, 0], scale: [1.92, 0.12, 1.27] },
      { color: PALETTE.stone, position: [-1.08, 0.18, 0], scale: [0.16, 0.36, 1.7] },
      { color: PALETTE.stone, position: [1.08, 0.18, 0], scale: [0.16, 0.36, 1.7] }
    ];
    for (let flower = 0; flower < 7; flower += 1) {
      const column = flower % 4;
      const row = Math.floor(flower / 4);
      const x = -0.72 + column * 0.48 + (row ? 0.18 : 0);
      const z = -0.35 + row * 0.68;
      const height = 0.48 + ((flower + index) % 3) * 0.11;
      bed.push({ color: PALETTE.leafMid, position: [x, 0.24 + height * 0.5, z], scale: [0.09, height, 0.09] });
      bed.push({
        color: FLOWER_COLORS[(flower + index * 2) % FLOWER_COLORS.length],
        position: [x, 0.26 + height, z],
        scale: [0.3, 0.2, 0.3],
        rotation: [0, flower * 0.7, 0]
      });
    }
    return bed;
  }, [index]);
  return (
    <group position={[position.x, ground, position.z]} dispose={null}>
      <VoxelInstances blocks={blocks} />
    </group>
  );
}

function WaterRefillStation() {
  const ground = getTerrainHeight(WATER_REFILL.x, WATER_REFILL.z);
  return (
    <group position={[WATER_REFILL.x, ground, WATER_REFILL.z]} dispose={null}>
      <mesh
        geometry={CYLINDER_12_GEOMETRY}
        material={sharedMaterial(PALETTE.water)}
        position={[0, 0.72, 0]}
        scale={[0.62, 1.18, 0.62]}
        castShadow
        receiveShadow
        dispose={null}
      />
      <mesh
        geometry={CYLINDER_12_GEOMETRY}
        material={sharedMaterial(PALETTE.waterBright)}
        position={[0, 1.36, 0]}
        scale={[0.7, 0.12, 0.7]}
        castShadow
        dispose={null}
      />
      <SharedBox color={PALETTE.pipeLight} position={[-0.62, 1.35, 0]} scale={[0.62, 0.12, 0.12]} />
      <SharedBox color={PALETTE.screen} position={[-0.94, 1.16, 0]} scale={[0.12, 0.48, 0.32]} />
      <pointLight color={PALETTE.waterBright} intensity={0.65} distance={4} position={[0, 1.65, 0]} />
    </group>
  );
}

export function DroneWorksites() {
  return (
    <group dispose={null}>
      <LibraryBookDepot />
      <LibraryDropSlot />
      <WaterRefillStation />
      {FLOWER_BEDS.map((_, index) => <FlowerBed key={index} index={index} />)}
    </group>
  );
}
