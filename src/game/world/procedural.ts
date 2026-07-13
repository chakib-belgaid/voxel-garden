import type { WorldPosition } from "../types";
import { WEBSITE_MAP_ANCHORS } from "./generated/terminalDashboardMap";
import {
  getElevationAtCell,
  getPropNameAtCell,
  getSurfaceNameAtCell,
  getWebsiteSectionAt,
  type WebsitePropName,
  type WebsiteSurfaceName
} from "./map";
import { WEBSITE_MAP_TILE_SIZE } from "./map/schema";

/** Retained for stable ambient variation and save-compatible robot palettes. */
export const WORLD_SEED = 731_947;
export const TILE_SIZE = WEBSITE_MAP_TILE_SIZE;
export const CHUNK_TILES = 12;
export const CHUNK_WORLD_SIZE = TILE_SIZE * CHUNK_TILES;
export const WORLD_FLOOR = -5;

export type TerrainBiome = "meadow" | "grove" | "highland" | "bloom";
export type TerrainFeature = Exclude<WebsitePropName, "none"> | null;

export interface TerrainCell {
  cellX: number;
  cellZ: number;
  x: number;
  z: number;
  height: number;
  biome: TerrainBiome;
  shade: number;
  trail: boolean;
  feature: TerrainFeature;
  surface: WebsiteSurfaceName;
}

const CLEARINGS: readonly WorldPosition[] = Object.freeze([
  WEBSITE_MAP_ANCHORS.spawn,
  WEBSITE_MAP_ANCHORS.gardenHeart,
  ...Object.values(WEBSITE_MAP_ANCHORS.systems),
  ...Object.values(WEBSITE_MAP_ANCHORS.labs)
]);
const LAB_CLEARINGS: readonly WorldPosition[] = Object.freeze(Object.values(WEBSITE_MAP_ANCHORS.labs));

function fract(value: number): number {
  return value - Math.floor(value);
}

/** Stable integer-cell random used by both rendering and collision details. */
export function proceduralHash(x: number, z: number, salt = 0): number {
  const mixed = Math.sin(
    x * 127.1 + z * 311.7 + (WORLD_SEED + salt * 1013) * 0.017
  ) * 43_758.545_312_3;
  return fract(mixed);
}

export function worldToCell(value: number): number {
  return Math.floor(value / TILE_SIZE + 0.5);
}

export function cellToWorld(cell: number): number {
  return cell * TILE_SIZE;
}

export function isTrailAt(x: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  return getSurfaceNameAtCell(worldToCell(x), worldToCell(z)) === "trail";
}

export function isInClearing(x: number, z: number, radius = 7): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  return CLEARINGS.some((position) => Math.hypot(x - position.x, z - position.z) <= radius);
}

export function isInLabClearing(x: number, z: number, radius = 9): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  return LAB_CLEARINGS.some((position) => Math.hypot(x - position.x, z - position.z) <= radius);
}

export function getCellHeight(cellX: number, cellZ: number): number {
  if (!Number.isInteger(cellX) || !Number.isInteger(cellZ)) return 0;
  return getElevationAtCell(cellX, cellZ);
}

export function getTerrainHeight(x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 0;
  return getCellHeight(worldToCell(x), worldToCell(z));
}

export function getCellBiome(cellX: number, cellZ: number): TerrainBiome {
  const surface = getSurfaceNameAtCell(cellX, cellZ);
  if (surface === "grass-mid" || surface === "water") return "grove";
  if (surface === "stone" || surface === "brass" || surface === "cream") return "highland";
  if (surface === "cyan" || surface === "lime") return "bloom";
  return "meadow";
}

export function getCellFeature(cellX: number, cellZ: number): TerrainFeature {
  const feature = getPropNameAtCell(cellX, cellZ);
  return feature === "none" ? null : feature;
}

export function getTerrainCell(cellX: number, cellZ: number): TerrainCell {
  const x = cellToWorld(cellX);
  const z = cellToWorld(cellZ);
  const surface = getSurfaceNameAtCell(cellX, cellZ);
  return {
    cellX,
    cellZ,
    x,
    z,
    height: getCellHeight(cellX, cellZ),
    biome: getCellBiome(cellX, cellZ),
    shade: proceduralHash(cellX, cellZ, 401),
    trail: surface === "trail",
    feature: getCellFeature(cellX, cellZ),
    surface
  };
}

export function getRegionName(position: WorldPosition): string {
  const section = getWebsiteSectionAt(position);
  if (section) return section.label;
  const biome = getCellBiome(worldToCell(position.x), worldToCell(position.z));
  if (Math.hypot(position.x - WEBSITE_MAP_ANCHORS.gardenHeart.x, position.z - WEBSITE_MAP_ANCHORS.gardenHeart.z) < 12) {
    return "Garden Heart";
  }
  if (biome === "grove") return "Cultivation Grid";
  if (biome === "highland") return "Terminal Terrace";
  if (biome === "bloom") return "Signal Bloom";
  return "Dashboard Walkway";
}

