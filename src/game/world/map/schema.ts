import type { SystemId, WorldPosition } from "../../types";

export const WEBSITE_MAP_WIDTH = 128;
export const WEBSITE_MAP_HEIGHT = 72;
export const WEBSITE_MAP_TILE_SIZE = 2;
export const WEBSITE_MAP_ORIGIN_CELL = Object.freeze({ column: 64, row: 36 });

export type WebsiteSectionId =
  | "home"
  | "about"
  | "projects"
  | "blog"
  | "experiments"
  | "contact"
  | "stats"
  | "cultivation"
  | SystemId;

export type WebsiteDrawerId =
  | "profile"
  | "stats"
  | "projects"
  | "cultivation"
  | "contact";

export type WebsiteSectionAction =
  | Readonly<{ kind: "open-drawer"; drawer: WebsiteDrawerId }>
  | Readonly<{ kind: "open-project"; projectId: SystemId }>
  | Readonly<{ kind: "open-field-log" }>
  | Readonly<{ kind: "none" }>;

export interface CellBounds {
  minColumn: number;
  maxColumn: number;
  minRow: number;
  maxRow: number;
}

export interface WorldBounds2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WebsiteMapBounds extends WorldBounds2D {
  minY: number;
  maxY: number;
  center: Readonly<WorldPosition>;
}

export interface WebsiteSection {
  id: WebsiteSectionId;
  label: string;
  cellBounds: Readonly<CellBounds>;
  worldBounds: Readonly<WorldBounds2D>;
  action: WebsiteSectionAction;
}

export interface WebsiteMapAnchors {
  spawn: Readonly<WorldPosition>;
  gardenHeart: Readonly<WorldPosition>;
  systems: Readonly<Record<SystemId, Readonly<WorldPosition>>>;
  labs: Readonly<Record<string, Readonly<WorldPosition>>>;
  bookPickup: Readonly<WorldPosition>;
  libraryDropoff: Readonly<WorldPosition>;
  waterRefill: Readonly<WorldPosition>;
  flowerBeds: readonly Readonly<WorldPosition>[];
}

export function mapCellToWorld(column: number, row: number): WorldPosition {
  return {
    x: (column - WEBSITE_MAP_ORIGIN_CELL.column) * WEBSITE_MAP_TILE_SIZE,
    z: (row - WEBSITE_MAP_ORIGIN_CELL.row) * WEBSITE_MAP_TILE_SIZE
  };
}
