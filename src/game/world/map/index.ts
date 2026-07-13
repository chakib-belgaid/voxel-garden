import type { WorldPosition } from "../../types";
import {
  ELEVATION_LAYER,
  NON_WALKABLE_SURFACE_CODES,
  PROPS_LAYER,
  PROPS_NAMES,
  SOLID_PROP_CODES,
  SURFACE_COLORS,
  SURFACE_LAYER,
  SURFACE_NAMES,
  TERMINAL_DASHBOARD_ELEVATION_STEP,
  WEBSITE_SECTIONS,
  ZONES_LAYER,
  ZONES_NAMES
} from "../generated/terminalDashboardMap";
import {
  WEBSITE_MAP_HEIGHT,
  WEBSITE_MAP_ORIGIN_CELL,
  WEBSITE_MAP_TILE_SIZE,
  WEBSITE_MAP_WIDTH,
  type WebsiteSection
} from "./schema";

export type WebsiteSurfaceName = (typeof SURFACE_NAMES)[number];
export type WebsitePropName = (typeof PROPS_NAMES)[number];
export type WebsiteZoneName = (typeof ZONES_NAMES)[number];

export interface WebsiteMapCell {
  column: number;
  row: number;
  index: number;
}

const nonWalkableCodes = new Set<number>(NON_WALKABLE_SURFACE_CODES);
const solidPropCodes = new Set<number>(SOLID_PROP_CODES);

export function worldCellToMapCell(cellX: number, cellZ: number): WebsiteMapCell | null {
  if (!Number.isInteger(cellX) || !Number.isInteger(cellZ)) return null;
  const column = cellX + WEBSITE_MAP_ORIGIN_CELL.column;
  const row = cellZ + WEBSITE_MAP_ORIGIN_CELL.row;
  if (column < 0 || row < 0 || column >= WEBSITE_MAP_WIDTH || row >= WEBSITE_MAP_HEIGHT) return null;
  return { column, row, index: row * WEBSITE_MAP_WIDTH + column };
}

export function worldToMapCell(x: number, z: number): WebsiteMapCell | null {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return worldCellToMapCell(
    Math.floor(x / WEBSITE_MAP_TILE_SIZE + 0.5),
    Math.floor(z / WEBSITE_MAP_TILE_SIZE + 0.5)
  );
}

export function getSurfaceCodeAtCell(cellX: number, cellZ: number): number {
  const cell = worldCellToMapCell(cellX, cellZ);
  return cell ? SURFACE_LAYER[cell.index] : 0;
}

export function getSurfaceNameAtCell(cellX: number, cellZ: number): WebsiteSurfaceName {
  return SURFACE_NAMES[getSurfaceCodeAtCell(cellX, cellZ)] ?? "void";
}

export function getSurfaceColorAtCell(cellX: number, cellZ: number): string {
  return SURFACE_COLORS[getSurfaceCodeAtCell(cellX, cellZ)] ?? SURFACE_COLORS[0];
}

export function getElevationLevelAtCell(cellX: number, cellZ: number): number {
  const cell = worldCellToMapCell(cellX, cellZ);
  return cell ? ELEVATION_LAYER[cell.index] : 0;
}

export function getElevationAtCell(cellX: number, cellZ: number): number {
  return getElevationLevelAtCell(cellX, cellZ) * TERMINAL_DASHBOARD_ELEVATION_STEP;
}

export function getPropCodeAtCell(cellX: number, cellZ: number): number {
  const cell = worldCellToMapCell(cellX, cellZ);
  return cell ? PROPS_LAYER[cell.index] : 0;
}

export function getPropNameAtCell(cellX: number, cellZ: number): WebsitePropName {
  return PROPS_NAMES[getPropCodeAtCell(cellX, cellZ)] ?? "none";
}

export function getZoneNameAtCell(cellX: number, cellZ: number): WebsiteZoneName {
  const cell = worldCellToMapCell(cellX, cellZ);
  return cell ? (ZONES_NAMES[ZONES_LAYER[cell.index]] ?? "none") : "none";
}

export function isSurfaceWalkableAtCell(cellX: number, cellZ: number): boolean {
  return !nonWalkableCodes.has(getSurfaceCodeAtCell(cellX, cellZ));
}

export function isPropSolidAtCell(cellX: number, cellZ: number): boolean {
  return solidPropCodes.has(getPropCodeAtCell(cellX, cellZ));
}

export function getWebsiteSectionAt(position: WorldPosition): WebsiteSection | null {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return null;
  return WEBSITE_SECTIONS.find((section) => (
    position.x >= section.worldBounds.minX &&
    position.x <= section.worldBounds.maxX &&
    position.z >= section.worldBounds.minZ &&
    position.z <= section.worldBounds.maxZ
  )) ?? null;
}

