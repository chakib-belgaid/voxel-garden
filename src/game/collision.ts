import type { Collider, WorldBounds, WorldPosition } from "./types";
import { PLAYER_START, SYSTEMS } from "./content";
import {
  TILE_SIZE,
  cellToWorld,
  getCellFeature,
  getTerrainHeight,
  worldToCell
} from "./world/procedural";
import { LAB_SITES } from "./world/labs";
import { WEBSITE_MAP_BOUNDS } from "./world/generated/terminalDashboardMap";
import {
  getSurfaceNameAtCell,
  isPropSolidAtCell
} from "./world/map";
import {
  ROBOT_COLLIDER_RADIUS,
  ROBOT_DEFINITIONS,
  getRobotPose
} from "./world/robots";
import { BOOK_PICKUP, WATER_REFILL } from "./world/drones";

export const WORLD_BOUNDS: Readonly<WorldBounds> = Object.freeze({
  minX: WEBSITE_MAP_BOUNDS.minX,
  maxX: WEBSITE_MAP_BOUNDS.maxX,
  minZ: WEBSITE_MAP_BOUNDS.minZ,
  maxZ: WEBSITE_MAP_BOUNDS.maxZ
});

export const PLAYER_RADIUS = 0.38;
export const MAX_STEP_HEIGHT = 0.7;

export interface CollisionContext {
  robotElapsed?: number;
}

function rectangularCollider(
  id: string,
  center: WorldPosition,
  halfWidth: number,
  halfDepth: number
): Collider {
  return {
    id,
    kind: "structure",
    minX: center.x - halfWidth,
    maxX: center.x + halfWidth,
    minZ: center.z - halfDepth,
    maxZ: center.z + halfDepth
  };
}

function relativeCollider(
  id: string,
  origin: WorldPosition,
  offsetX: number,
  offsetZ: number,
  halfWidth: number,
  halfDepth: number
): Collider {
  return rectangularCollider(
    id,
    { x: origin.x + offsetX, z: origin.z + offsetZ },
    halfWidth,
    halfDepth
  );
}

function buildSystemColliders(): Collider[] {
  const colliders: Collider[] = [];
  for (const system of SYSTEMS) {
    const origin = system.position;
    if (system.id === "wattch") {
      colliders.push(
        relativeCollider("system-wattch-panel-west", origin, -2.3, 0.25, 1.55, 1.03),
        relativeCollider("system-wattch-panel-east", origin, 2.3, 0.25, 1.55, 1.03),
        relativeCollider("system-wattch-mast", origin, 0, -2.35, 0.38, 0.38)
      );
    } else if (system.id === "whispbook") {
      colliders.push(relativeCollider("system-whispbook-terminal", origin, 0, -0.35, 1.1, 0.55));
      for (let index = 0; index < 5; index += 1) {
        const angle = (index / 5) * Math.PI * 2;
        colliders.push(relativeCollider(
          `system-whispbook-spire-${index}`,
          origin,
          Math.cos(angle) * 2.35,
          Math.sin(angle) * 2.35,
          0.35,
          0.35
        ));
      }
    } else if (system.id === "agent-commerce") {
      for (const [index, x] of [-1.8, 0, 1.8].entries()) {
        colliders.push(relativeCollider(
          `system-agent-commerce-crate-${index}`,
          origin,
          x,
          1.7,
          0.63,
          0.63
        ));
      }
      colliders.push(
        relativeCollider("system-agent-commerce-gantry-west", origin, -2.7, -0.6, 0.2, 0.2),
        relativeCollider("system-agent-commerce-gantry-east", origin, 2.7, -0.6, 0.2, 0.2)
      );
    } else {
      for (const [index, x] of [-2.2, 0, 2.2].entries()) {
        colliders.push(relativeCollider(
          `system-dev-tools-rack-${index}`,
          origin,
          x,
          -0.6,
          0.78,
          0.73
        ));
      }
    }
  }
  return colliders;
}

/** Authored structure footprints; procedural props and robots are added at query time. */
export const COLLIDERS: readonly Collider[] = Object.freeze([
  relativeCollider("garden-heart-rail-north", PLAYER_START, 0, -2.8, 1.43, 0.16),
  relativeCollider("garden-heart-rail-south", PLAYER_START, 0, 2.8, 1.43, 0.16),
  relativeCollider("garden-heart-rail-west", PLAYER_START, -2.8, 0, 0.16, 1.43),
  relativeCollider("garden-heart-rail-east", PLAYER_START, 2.8, 0, 0.16, 1.43),
  ...LAB_SITES.map((site) => rectangularCollider(
    `lab-${site.id}`,
    site.position,
    site.footprint.halfWidth,
    site.footprint.halfDepth
  )),
  rectangularCollider("worksite-library-book-depot", BOOK_PICKUP, 0.9, 0.75),
  rectangularCollider("worksite-mossglass-water-refill", WATER_REFILL, 0.68, 0.68),
  ...buildSystemColliders()
]);

function finitePosition(position: WorldPosition): boolean {
  return Number.isFinite(position.x) && Number.isFinite(position.z);
}

function cellSurfaceIntersects(
  position: WorldPosition,
  radius: number,
  predicate: (surface: ReturnType<typeof getSurfaceNameAtCell>) => boolean
): { cellX: number; cellZ: number; surface: ReturnType<typeof getSurfaceNameAtCell> } | null {
  const centerX = worldToCell(position.x);
  const centerZ = worldToCell(position.z);
  const range = Math.max(1, Math.ceil((radius + TILE_SIZE * 0.5) / TILE_SIZE));
  for (let offsetX = -range; offsetX <= range; offsetX += 1) {
    for (let offsetZ = -range; offsetZ <= range; offsetZ += 1) {
      const cellX = centerX + offsetX;
      const cellZ = centerZ + offsetZ;
      const surface = getSurfaceNameAtCell(cellX, cellZ);
      if (!predicate(surface)) continue;
      const half = TILE_SIZE * 0.5;
      const cellCollider: Collider = {
        id: `map-${surface}-${cellX}-${cellZ}`,
        kind: "water",
        minX: cellToWorld(cellX) - half,
        maxX: cellToWorld(cellX) + half,
        minZ: cellToWorld(cellZ) - half,
        maxZ: cellToWorld(cellZ) + half
      };
      if (circleIntersectsCollider(position, radius, cellCollider)) return { cellX, cellZ, surface };
    }
  }
  return null;
}

/** True only when the complete player footprint sits on the authored island. */
export function isInsideIsland(position: WorldPosition, radius = PLAYER_RADIUS): boolean {
  if (!finitePosition(position)) return false;
  const safeRadius = Number.isFinite(radius) ? Math.max(0, radius) : PLAYER_RADIUS;
  if (position.x < WORLD_BOUNDS.minX + safeRadius ||
      position.x > WORLD_BOUNDS.maxX - safeRadius ||
      position.z < WORLD_BOUNDS.minZ + safeRadius ||
      position.z > WORLD_BOUNDS.maxZ - safeRadius) return false;
  return cellSurfaceIntersects(position, safeRadius, (surface) => surface === "void") === null;
}

function circleIntersectsCollider(position: WorldPosition, radius: number, collider: Collider): boolean {
  const closestX = Math.max(collider.minX, Math.min(position.x, collider.maxX));
  const closestZ = Math.max(collider.minZ, Math.min(position.z, collider.maxZ));
  const dx = position.x - closestX;
  const dz = position.z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

function featureCollider(cellX: number, cellZ: number): Collider | null {
  const feature = getCellFeature(cellX, cellZ);
  if (!feature || !isPropSolidAtCell(cellX, cellZ)) return null;
  const x = cellToWorld(cellX);
  const z = cellToWorld(cellZ);
  const halfSize = feature === "tree"
    ? 0.34
    : feature === "hedge"
      ? 0.72
      : feature === "solar" || feature === "dome"
        ? 0.82
        : 0.46;
  return {
    id: `${feature}-${cellX}-${cellZ}`,
    kind: "prop",
    minX: x - halfSize,
    maxX: x + halfSize,
    minZ: z - halfSize,
    maxZ: z + halfSize
  };
}

function authoredCollider(position: WorldPosition, radius: number): Collider | null {
  return COLLIDERS.find((collider) => circleIntersectsCollider(position, radius, collider)) ?? null;
}

function robotCollider(position: WorldPosition, radius: number, elapsed: number): Collider | null {
  for (let index = 0; index < ROBOT_DEFINITIONS.length; index += 1) {
    const pose = getRobotPose(ROBOT_DEFINITIONS[index], elapsed);
    const collider: Collider = {
      id: `robot-${index}`,
      kind: "robot",
      minX: pose.x - ROBOT_COLLIDER_RADIUS,
      maxX: pose.x + ROBOT_COLLIDER_RADIUS,
      minZ: pose.z - ROBOT_COLLIDER_RADIUS,
      maxZ: pose.z + ROBOT_COLLIDER_RADIUS
    };
    if (circleIntersectsCollider(position, radius, collider)) return collider;
  }
  return null;
}

export function clampToWorld(position: WorldPosition, radius = PLAYER_RADIUS): WorldPosition {
  const safeRadius = Number.isFinite(radius) ? Math.max(0, radius) : PLAYER_RADIUS;
  if (!finitePosition(position)) return { ...PLAYER_START };
  return {
    x: Math.min(WORLD_BOUNDS.maxX - safeRadius, Math.max(WORLD_BOUNDS.minX + safeRadius, position.x)),
    z: Math.min(WORLD_BOUNDS.maxZ - safeRadius, Math.max(WORLD_BOUNDS.minZ + safeRadius, position.z))
  };
}

export function getCollidingCollider(
  position: WorldPosition,
  radius = PLAYER_RADIUS,
  context: Readonly<CollisionContext> = {}
): Collider | null {
  if (!finitePosition(position)) return null;
  const safeRadius = Number.isFinite(radius) ? Math.max(0, radius) : PLAYER_RADIUS;
  const authored = authoredCollider(position, safeRadius);
  if (authored) return authored;
  const blockedSurface = cellSurfaceIntersects(position, safeRadius, (surface) => surface === "water");
  if (blockedSurface) {
    const half = TILE_SIZE * 0.5;
    return {
      id: `map-water-${blockedSurface.cellX}-${blockedSurface.cellZ}`,
      kind: "water",
      minX: cellToWorld(blockedSurface.cellX) - half,
      maxX: cellToWorld(blockedSurface.cellX) + half,
      minZ: cellToWorld(blockedSurface.cellZ) - half,
      maxZ: cellToWorld(blockedSurface.cellZ) + half
    };
  }
  const centerX = worldToCell(position.x);
  const centerZ = worldToCell(position.z);
  const range = Math.max(1, Math.ceil((safeRadius + TILE_SIZE * 0.5) / TILE_SIZE));
  for (let offsetX = -range; offsetX <= range; offsetX += 1) {
    for (let offsetZ = -range; offsetZ <= range; offsetZ += 1) {
      const collider = featureCollider(centerX + offsetX, centerZ + offsetZ);
      if (collider && circleIntersectsCollider(position, safeRadius, collider)) return collider;
    }
  }
  if (typeof context.robotElapsed === "number" && Number.isFinite(context.robotElapsed)) {
    return robotCollider(position, safeRadius, context.robotElapsed);
  }
  return null;
}

export function isPositionWalkable(
  position: WorldPosition,
  radius = PLAYER_RADIUS,
  context: Readonly<CollisionContext> = {}
): boolean {
  if (!isInsideIsland(position, radius)) return false;
  return getCollidingCollider(position, radius, context) === null;
}

/** Finds a nearby valid point for saves made before authored structures became solid. */
export function findNearestWalkablePosition(
  position: WorldPosition,
  radius = PLAYER_RADIUS,
  searchDistance = 24
): WorldPosition | null {
  if (!finitePosition(position)) return null;
  const safeRadius = Number.isFinite(radius) ? Math.max(0.01, radius) : PLAYER_RADIUS;
  const origin = clampToWorld(position, safeRadius);
  if (isPositionWalkable(origin, safeRadius)) return origin;
  const safeSearchDistance = Number.isFinite(searchDistance) ? Math.max(0, searchDistance) : 24;
  for (let distance = 0.25; distance <= safeSearchDistance; distance += 0.25) {
    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2;
      const candidate = clampToWorld({
        x: origin.x + Math.cos(angle) * distance,
        z: origin.z + Math.sin(angle) * distance
      }, safeRadius);
      if (isPositionWalkable(candidate, safeRadius)) return candidate;
    }
  }
  return null;
}

function canStep(
  from: WorldPosition,
  to: WorldPosition,
  radius: number,
  context: Readonly<CollisionContext>
): boolean {
  return isPositionWalkable(to, radius, context) &&
    Math.abs(getTerrainHeight(to.x, to.z) - getTerrainHeight(from.x, from.z)) <= MAX_STEP_HEIGHT;
}

/** Swept movement with terrain-step checks and permissive obstacle sliding. */
export function resolveMovement(
  from: WorldPosition,
  to: WorldPosition,
  radius = PLAYER_RADIUS,
  context: Readonly<CollisionContext> = {}
): WorldPosition {
  const safeRadius = Number.isFinite(radius) ? Math.max(0.01, radius) : PLAYER_RADIUS;
  if (!finitePosition(from) || !finitePosition(to)) return clampToWorld(from, safeRadius);

  const start = clampToWorld(from, safeRadius);
  const target = clampToWorld(to, safeRadius);
  const dx = target.x - start.x;
  const dz = target.z - start.z;
  const distance = Math.hypot(dx, dz);
  const stepLength = Math.max(0.08, safeRadius * 0.5);
  const stepCount = Math.max(1, Math.ceil(distance / stepLength));
  const stepX = dx / stepCount;
  const stepZ = dz / stepCount;
  let current = start;

  for (let index = 0; index < stepCount; index += 1) {
    const diagonal = clampToWorld({ x: current.x + stepX, z: current.z + stepZ }, safeRadius);
    if (canStep(current, diagonal, safeRadius, context)) {
      current = diagonal;
      continue;
    }

    const xOnly = clampToWorld({ x: current.x + stepX, z: current.z }, safeRadius);
    const zOnly = clampToWorld({ x: current.x, z: current.z + stepZ }, safeRadius);
    const canMoveX = canStep(current, xOnly, safeRadius, context);
    const canMoveZ = canStep(current, zOnly, safeRadius, context);
    if (canMoveX && canMoveZ) current = Math.abs(dx) >= Math.abs(dz) ? xOnly : zOnly;
    else if (canMoveX) current = xOnly;
    else if (canMoveZ) current = zOnly;
  }

  return current;
}

/** Gently separates a stationary player when a patrol reaches them. */
export function resolveRobotOverlap(
  position: WorldPosition,
  elapsed: number,
  radius = PLAYER_RADIUS
): WorldPosition {
  if (!finitePosition(position) || !Number.isFinite(elapsed)) return clampToWorld(position, radius);
  const safeRadius = Number.isFinite(radius) ? Math.max(0.01, radius) : PLAYER_RADIUS;
  const minimumDistance = safeRadius + ROBOT_COLLIDER_RADIUS + 0.035;
  let current = clampToWorld(position, safeRadius);

  ROBOT_DEFINITIONS.forEach((robot, index) => {
    const pose = getRobotPose(robot, elapsed);
    let dx = current.x - pose.x;
    let dz = current.z - pose.z;
    let distance = Math.hypot(dx, dz);
    if (distance >= minimumDistance) return;
    if (distance < 0.0001) {
      const angle = robot.phase + index * 0.73;
      dx = Math.cos(angle);
      dz = Math.sin(angle);
      distance = 1;
    }
    const candidate = clampToWorld({
      x: pose.x + (dx / distance) * minimumDistance,
      z: pose.z + (dz / distance) * minimumDistance
    }, safeRadius);
    if (isPositionWalkable(candidate, safeRadius)) current = candidate;
  });

  return current;
}
