import { useMemo } from "react";
import { useGameStore } from "../store";
import { PALETTE, VoxelInstances, type VoxelBlock } from "./VoxelPrimitives";
import { getSurfaceColorAtCell } from "./map";
import {
  WEBSITE_MAP_HEIGHT,
  WEBSITE_MAP_ORIGIN_CELL,
  WEBSITE_MAP_WIDTH
} from "./map/schema";
import {
  CHUNK_TILES,
  CHUNK_WORLD_SIZE,
  TILE_SIZE,
  WORLD_FLOOR,
  getTerrainCell,
  proceduralHash
} from "./procedural";

interface ChunkGeometry {
  terrain: readonly VoxelBlock[];
  details: readonly VoxelBlock[];
}

const chunkCache = new Map<string, ChunkGeometry>();
const MIN_CHUNK_X = Math.floor(-WEBSITE_MAP_ORIGIN_CELL.column / CHUNK_TILES);
const MAX_CHUNK_X = Math.floor((WEBSITE_MAP_WIDTH - WEBSITE_MAP_ORIGIN_CELL.column - 1) / CHUNK_TILES);
const MIN_CHUNK_Z = Math.floor(-WEBSITE_MAP_ORIGIN_CELL.row / CHUNK_TILES);
const MAX_CHUNK_Z = Math.floor((WEBSITE_MAP_HEIGHT - WEBSITE_MAP_ORIGIN_CELL.row - 1) / CHUNK_TILES);

function addTree(blocks: VoxelBlock[], x: number, y: number, z: number, variant: number) {
  const height = 2.3 + variant * 1.7;
  blocks.push({ color: PALETTE.soilLight, position: [x, y + height * 0.5, z], scale: [0.42, height, 0.42] });
  blocks.push({ color: PALETTE.leafDark, position: [x, y + height + 0.45, z], scale: [2.2, 1.25, 2.2] });
  blocks.push({ color: PALETTE.leafMid, position: [x - 0.5, y + height + 1.1, z + 0.25], scale: [1.5, 1.05, 1.5] });
  blocks.push({ color: PALETTE.leafLight, position: [x + 0.35, y + height + 1.55, z - 0.25], scale: [0.9, 0.72, 0.9] });
}

function addRock(blocks: VoxelBlock[], x: number, y: number, z: number, variant: number) {
  blocks.push({
    color: variant > 0.55 ? PALETTE.stone : PALETTE.cliffLight,
    position: [x, y + 0.42 + variant * 0.25, z],
    scale: [0.85 + variant * 0.7, 0.72 + variant * 0.5, 0.82 + (1 - variant) * 0.55],
    rotation: [variant * 0.18, variant * Math.PI, variant * 0.12]
  });
}

function addFlowers(blocks: VoxelBlock[], x: number, y: number, z: number, variant: number) {
  const colors = [PALETTE.flowerPink, PALETTE.flowerBlue, PALETTE.orange, PALETTE.flowerWhite];
  for (let index = 0; index < 3; index += 1) {
    const angle = variant * Math.PI * 2 + index * 2.1;
    const px = x + Math.cos(angle) * 0.48;
    const pz = z + Math.sin(angle) * 0.48;
    blocks.push({ color: PALETTE.leafMid, position: [px, y + 0.32, pz], scale: [0.1, 0.62, 0.1] });
    blocks.push({ color: colors[(index + Math.floor(variant * 4)) % colors.length], position: [px, y + 0.67, pz], scale: [0.28, 0.2, 0.28] });
  }
}

function addCrops(blocks: VoxelBlock[], x: number, y: number, z: number) {
  for (const offset of [-0.55, 0, 0.55]) {
    blocks.push({ color: PALETTE.leafMid, position: [x + offset, y + 0.38, z], scale: [0.18, 0.7, 0.18] });
    blocks.push({ color: PALETTE.lime, position: [x + offset, y + 0.76, z], scale: [0.35, 0.16, 0.35] });
  }
}

function addHedge(blocks: VoxelBlock[], x: number, y: number, z: number, variant: number) {
  blocks.push({ color: PALETTE.leafDark, position: [x, y + 0.65, z], scale: [1.7, 1.2, 1.25] });
  blocks.push({ color: PALETTE.leafMid, position: [x + (variant - 0.5) * 0.25, y + 1.22, z], scale: [1.45, 0.32, 1.05] });
}

function addLamp(blocks: VoxelBlock[], x: number, y: number, z: number) {
  blocks.push({ color: PALETTE.brassDark, position: [x, y + 1.2, z], scale: [0.18, 2.3, 0.18] });
  blocks.push({ color: PALETTE.creamLight, position: [x, y + 2.38, z], scale: [0.52, 0.42, 0.52] });
  blocks.push({ color: PALETTE.lime, position: [x, y + 2.38, z - 0.28], scale: [0.28, 0.2, 0.08] });
}

function addSolar(blocks: VoxelBlock[], x: number, y: number, z: number) {
  blocks.push({ color: PALETTE.pipeLight, position: [x, y + 0.75, z], scale: [0.18, 1.35, 0.18] });
  blocks.push({ color: PALETTE.solar, position: [x, y + 1.48, z], scale: [2.4, 0.16, 1.45], rotation: [-0.34, 0, 0] });
  blocks.push({ color: PALETTE.solarLight, position: [x, y + 1.55, z - 0.2], scale: [1.8, 0.05, 0.09], rotation: [-0.34, 0, 0] });
}

function addDome(blocks: VoxelBlock[], x: number, y: number, z: number) {
  blocks.push({ color: PALETTE.brassDark, position: [x, y + 0.18, z], scale: [2.4, 0.32, 2.4] });
  blocks.push({ color: PALETTE.waterBright, position: [x, y + 0.84, z], scale: [1.8, 1.12, 1.8] });
  blocks.push({ color: PALETTE.screen, position: [x, y + 1.52, z], scale: [1.1, 0.28, 1.1] });
}

function addTurbine(blocks: VoxelBlock[], x: number, y: number, z: number) {
  blocks.push({ color: PALETTE.pipeLight, position: [x, y + 2, z], scale: [0.26, 3.8, 0.26] });
  blocks.push({ color: PALETTE.brassLight, position: [x, y + 3.85, z], scale: [0.56, 0.56, 0.56] });
  blocks.push({ color: PALETTE.cream, position: [x, y + 4.62, z], scale: [0.18, 1.5, 0.18] });
  blocks.push({ color: PALETTE.cream, position: [x + 0.77, y + 3.46, z], scale: [1.5, 0.18, 0.18] });
  blocks.push({ color: PALETTE.cream, position: [x - 0.68, y + 3.42, z], scale: [1.3, 0.18, 0.18], rotation: [0, 0, -0.52] });
}

function addSign(blocks: VoxelBlock[], x: number, y: number, z: number, cellX: number) {
  const signs = [
    { cellX: -27, accent: PALETTE.lime, glyph: ["101", "101", "111", "111", "101"] },
    { cellX: -13, accent: PALETTE.purple, glyph: ["101", "101", "111", "111", "101"] },
    { cellX: 2, accent: PALETTE.screen, glyph: ["010", "101", "111", "101", "101"] },
    { cellX: 17, accent: PALETTE.orange, glyph: ["110", "101", "101", "101", "110"] }
  ] as const;
  const sign = signs.reduce((nearest, candidate) => (
    Math.abs(candidate.cellX - cellX) < Math.abs(nearest.cellX - cellX) ? candidate : nearest
  ));
  blocks.push({ color: PALETTE.brassDark, position: [x, y + 0.75, z], scale: [0.18, 1.4, 0.18] });
  blocks.push({ color: PALETTE.charcoal, position: [x, y + 1.72, z], scale: [2.2, 0.85, 0.22] });
  sign.glyph.forEach((row, rowIndex) => [...row].forEach((pixel, columnIndex) => {
    if (pixel !== "1") return;
    blocks.push({
      color: sign.accent,
      position: [x - 0.24 + columnIndex * 0.24, y + 2.05 - rowIndex * 0.17, z - 0.14],
      scale: [0.14, 0.11, 0.06]
    });
  }));
}

function buildChunk(chunkX: number, chunkZ: number): ChunkGeometry {
  const key = `${chunkX}:${chunkZ}`;
  const cached = chunkCache.get(key);
  if (cached) return cached;

  const terrain: VoxelBlock[] = [];
  const details: VoxelBlock[] = [];
  const startX = chunkX * CHUNK_TILES;
  const startZ = chunkZ * CHUNK_TILES;
  for (let localX = 0; localX < CHUNK_TILES; localX += 1) {
    for (let localZ = 0; localZ < CHUNK_TILES; localZ += 1) {
      const cell = getTerrainCell(startX + localX, startZ + localZ);
      if (cell.surface === "void") continue;
      const columnHeight = Math.max(0.05, cell.height - WORLD_FLOOR);
      terrain.push({
        color: getSurfaceColorAtCell(cell.cellX, cell.cellZ),
        position: [cell.x, WORLD_FLOOR + columnHeight * 0.5, cell.z],
        scale: [TILE_SIZE + 0.035, columnHeight, TILE_SIZE + 0.035]
      });

      const variant = proceduralHash(cell.cellX, cell.cellZ, 507);
      if (cell.feature === "tree") addTree(details, cell.x, cell.height, cell.z, variant);
      else if (cell.feature === "rock") addRock(details, cell.x, cell.height, cell.z, variant);
      else if (cell.feature === "flowers") addFlowers(details, cell.x, cell.height, cell.z, variant);
      else if (cell.feature === "crops") addCrops(details, cell.x, cell.height, cell.z);
      else if (cell.feature === "hedge") addHedge(details, cell.x, cell.height, cell.z, variant);
      else if (cell.feature === "lamp") addLamp(details, cell.x, cell.height, cell.z);
      else if (cell.feature === "solar") addSolar(details, cell.x, cell.height, cell.z);
      else if (cell.feature === "dome") addDome(details, cell.x, cell.height, cell.z);
      else if (cell.feature === "turbine") addTurbine(details, cell.x, cell.height, cell.z);
      else if (cell.feature === "sign") addSign(details, cell.x, cell.height, cell.z, cell.cellX);
    }
  }

  const built = { terrain, details };
  chunkCache.set(key, built);
  return built;
}

export function ProceduralTerrain() {
  const playerPosition = useGameStore((state) => state.playerPosition);
  const quality = useGameStore((state) => state.settings.quality);
  const birdView = useGameStore((state) => (state as typeof state & { viewMode?: string }).viewMode === "bird");
  const centerChunkX = Math.floor((playerPosition.x + CHUNK_WORLD_SIZE * 0.5) / CHUNK_WORLD_SIZE);
  const centerChunkZ = Math.floor((playerPosition.z + CHUNK_WORLD_SIZE * 0.5) / CHUNK_WORLD_SIZE);
  const radius = quality === "high" ? 3 : 2;

  const visible = useMemo(() => {
    const terrain: VoxelBlock[] = [];
    const details: VoxelBlock[] = [];
    const minX = birdView ? MIN_CHUNK_X : Math.max(MIN_CHUNK_X, centerChunkX - radius);
    const maxX = birdView ? MAX_CHUNK_X : Math.min(MAX_CHUNK_X, centerChunkX + radius);
    const minZ = birdView ? MIN_CHUNK_Z : Math.max(MIN_CHUNK_Z, centerChunkZ - radius);
    const maxZ = birdView ? MAX_CHUNK_Z : Math.min(MAX_CHUNK_Z, centerChunkZ + radius);
    for (let x = minX; x <= maxX; x += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        const chunk = buildChunk(x, z);
        terrain.push(...chunk.terrain);
        details.push(...chunk.details);
      }
    }
    return { terrain, details };
  }, [birdView, centerChunkX, centerChunkZ, radius]);

  return (
    <group dispose={null}>
      <VoxelInstances blocks={visible.terrain} castShadow={false} receiveShadow />
      <VoxelInstances blocks={visible.details} castShadow={quality === "high" && !birdView} receiveShadow />
    </group>
  );
}
