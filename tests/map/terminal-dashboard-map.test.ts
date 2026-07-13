import { describe, expect, it } from "vitest";
import {
  ELEVATION_LAYER,
  PROPS_LAYER,
  SURFACE_LAYER,
  TERMINAL_DASHBOARD_CELL_COUNT,
  WEBSITE_MAP_ANCHORS,
  WEBSITE_MAP_BOUNDS,
  WEBSITE_SECTIONS,
  ZONES_LAYER
} from "../../src/game/world/generated/terminalDashboardMap";
import {
  getElevationAtCell,
  getPropNameAtCell,
  getSurfaceNameAtCell,
  getWebsiteSectionAt,
  isPropSolidAtCell,
  isSurfaceWalkableAtCell,
  worldCellToMapCell,
  worldToMapCell
} from "../../src/game/world/map";
import {
  WEBSITE_MAP_HEIGHT,
  WEBSITE_MAP_WIDTH,
  mapCellToWorld
} from "../../src/game/world/map/schema";
import { getCollidingCollider, isInsideIsland, isPositionWalkable } from "../../src/game/collision";
import { getTerrainCell } from "../../src/game/world/procedural";

describe("terminal dashboard bitmap map", () => {
  it("publishes four compact 128x72 typed layers and exact world bounds", () => {
    expect(TERMINAL_DASHBOARD_CELL_COUNT).toBe(128 * 72);
    expect(WEBSITE_MAP_WIDTH).toBe(128);
    expect(WEBSITE_MAP_HEIGHT).toBe(72);
    for (const layer of [SURFACE_LAYER, ELEVATION_LAYER, PROPS_LAYER, ZONES_LAYER]) {
      expect(layer).toBeInstanceOf(Uint8Array);
      expect(layer).toHaveLength(9_216);
    }
    expect(WEBSITE_MAP_BOUNDS).toMatchObject({
      minX: -129,
      maxX: 127,
      minZ: -73,
      maxZ: 71,
      center: { x: -1, z: -1 }
    });
  });

  it("round-trips authored cells through the existing two-meter world grid", () => {
    const world = mapCellToWorld(64, 39);
    expect(world).toEqual(WEBSITE_MAP_ANCHORS.spawn);
    expect(worldToMapCell(world.x, world.z)).toEqual({ column: 64, row: 39, index: 39 * 128 + 64 });
    expect(worldCellToMapCell(0, 3)).toEqual({ column: 64, row: 39, index: 39 * 128 + 64 });
    expect(worldCellToMapCell(-65, 0)).toBeNull();
  });

  it("keeps elevations quantized to 0.45m and rendering queries on the same bitmap truth", () => {
    expect(Math.max(...ELEVATION_LAYER)).toBeLessThanOrEqual(7);
    for (const [cellX, cellZ] of [[0, 3], [-54, -31], [34, 22], [55, -20]]) {
      const cell = getTerrainCell(cellX, cellZ);
      expect(cell.height % 0.45).toBeCloseTo(0, 8);
      expect(cell.height).toBe(getElevationAtCell(cellX, cellZ));
      expect(cell.surface).toBe(getSurfaceNameAtCell(cellX, cellZ));
      expect(cell.feature).toBe(getPropNameAtCell(cellX, cellZ) === "none" ? null : getPropNameAtCell(cellX, cellZ));
    }
  });

  it("keeps every semantic section non-overlapping and discoverable in world space", () => {
    expect(WEBSITE_SECTIONS).toHaveLength(12);
    for (let index = 0; index < WEBSITE_SECTIONS.length; index += 1) {
      const section = WEBSITE_SECTIONS[index];
      const center = {
        x: (section.worldBounds.minX + section.worldBounds.maxX) * 0.5,
        z: (section.worldBounds.minZ + section.worldBounds.maxZ) * 0.5
      };
      expect(getWebsiteSectionAt(center)?.id).toBe(section.id);
      for (let other = 0; other < index; other += 1) {
        const candidate = WEBSITE_SECTIONS[other];
        const overlaps = section.worldBounds.minX < candidate.worldBounds.maxX &&
          section.worldBounds.maxX > candidate.worldBounds.minX &&
          section.worldBounds.minZ < candidate.worldBounds.maxZ &&
          section.worldBounds.maxZ > candidate.worldBounds.minZ;
        expect(overlaps, `${section.id} overlaps ${candidate.id}`).toBe(false);
      }
    }
  });

  it("derives void, water, and solid-prop collision from the source layers", () => {
    const waterIndex = SURFACE_LAYER.findIndex((code) => code === 10);
    const waterColumn = waterIndex % WEBSITE_MAP_WIDTH;
    const waterRow = Math.floor(waterIndex / WEBSITE_MAP_WIDTH);
    const water = mapCellToWorld(waterColumn, waterRow);
    expect(isInsideIsland(water)).toBe(true);
    expect(isSurfaceWalkableAtCell(waterColumn - 64, waterRow - 36)).toBe(false);
    expect(isPositionWalkable(water)).toBe(false);
    expect(getCollidingCollider(water)).toMatchObject({ kind: "water" });

    const tree = mapCellToWorld(8, 3);
    expect(getPropNameAtCell(-56, -33)).toBe("tree");
    expect(isPropSolidAtCell(-56, -33)).toBe(true);
    expect(isPositionWalkable(tree)).toBe(false);
    expect(getCollidingCollider(tree)).toMatchObject({ id: "tree--56--33", kind: "prop" });

    expect(isInsideIsland(mapCellToWorld(0, 0))).toBe(false);
    expect(isPositionWalkable(WEBSITE_MAP_ANCHORS.spawn)).toBe(true);
  });
});

