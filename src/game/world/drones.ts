import type { WorldPosition } from "../types";
import { WEBSITE_MAP_ANCHORS } from "./generated/terminalDashboardMap";

export type DroneJob = "library" | "watering";
export type DroneStage =
  | "to-pickup"
  | "picking-up"
  | "to-library"
  | "dropping-off"
  | "library-idle"
  | "refilling"
  | "to-flowers"
  | "watering"
  | "returning";

export interface DroneDefinition {
  id: string;
  job: DroneJob;
  phase: number;
  cycleDuration: number;
  cruiseAltitude: number;
  pickup: WorldPosition;
  destination: WorldPosition;
  lateralArc: number;
}

export interface DronePose extends WorldPosition {
  altitude: number;
  yaw: number;
  stage: DroneStage;
  stageProgress: number;
  carryingBook: boolean;
  bookDropDistance: number;
  wateringIntensity: number;
}

export const LIBRARY_DROPOFF: Readonly<WorldPosition> = WEBSITE_MAP_ANCHORS.libraryDropoff;
export const BOOK_PICKUP: Readonly<WorldPosition> = WEBSITE_MAP_ANCHORS.bookPickup;
export const WATER_REFILL: Readonly<WorldPosition> = WEBSITE_MAP_ANCHORS.waterRefill;
export const FLOWER_BEDS: readonly Readonly<WorldPosition>[] = WEBSITE_MAP_ANCHORS.flowerBeds;

export const DRONE_DEFINITIONS: readonly DroneDefinition[] = Object.freeze([
  {
    id: "archive-courier-1",
    job: "library",
    phase: 0,
    cycleDuration: 18,
    cruiseAltitude: 3.45,
    pickup: BOOK_PICKUP,
    destination: LIBRARY_DROPOFF,
    lateralArc: 0.8
  },
  {
    id: "archive-courier-2",
    job: "library",
    phase: 8.4,
    cycleDuration: 20,
    cruiseAltitude: 3.8,
    pickup: { x: BOOK_PICKUP.x - 0.9, z: BOOK_PICKUP.z + 0.5 },
    destination: { x: LIBRARY_DROPOFF.x + 0.55, z: LIBRARY_DROPOFF.z - 0.15 },
    lateralArc: -0.9
  },
  ...FLOWER_BEDS.map((destination, index): DroneDefinition => ({
    id: `garden-tender-${index + 1}`,
    job: "watering",
    phase: index * 5.4,
    cycleDuration: 17 + index,
    cruiseAltitude: 3.05 + index * 0.18,
    pickup: WATER_REFILL,
    destination,
    lateralArc: index === 1 ? -0.7 : (index - 1) * 0.55
  }))
]);

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function flightPose(
  from: WorldPosition,
  to: WorldPosition,
  progress: number,
  lateralArc: number
): Pick<DronePose, "x" | "z" | "yaw"> {
  const t = smoothstep(progress);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const arc = Math.sin(t * Math.PI) * lateralArc;
  const x = from.x + dx * t + (-dz / length) * arc;
  const z = from.z + dz * t + (dx / length) * arc;
  const lookT = Math.min(1, t + 0.015);
  const lookArc = Math.sin(lookT * Math.PI) * lateralArc;
  const lookX = from.x + dx * lookT + (-dz / length) * lookArc;
  const lookZ = from.z + dz * lookT + (dx / length) * lookArc;
  return { x, z, yaw: Math.atan2(lookX - x, lookZ - z) };
}

function stationaryPose(position: WorldPosition, yaw: number): Pick<DronePose, "x" | "z" | "yaw"> {
  return { x: position.x, z: position.z, yaw };
}

function bookDronePose(drone: DroneDefinition, cycle: number): DronePose {
  const outboundYaw = Math.atan2(
    drone.pickup.x - drone.destination.x,
    drone.pickup.z - drone.destination.z
  );
  const inboundYaw = Math.atan2(
    drone.destination.x - drone.pickup.x,
    drone.destination.z - drone.pickup.z
  );

  if (cycle < 0.28) {
    const stageProgress = cycle / 0.28;
    return {
      ...flightPose(drone.destination, drone.pickup, stageProgress, drone.lateralArc),
      altitude: drone.cruiseAltitude + Math.sin(stageProgress * Math.PI) * 0.3,
      stage: "to-pickup",
      stageProgress,
      carryingBook: false,
      bookDropDistance: 0,
      wateringIntensity: 0
    };
  }
  if (cycle < 0.4) {
    const stageProgress = (cycle - 0.28) / 0.12;
    return {
      ...stationaryPose(drone.pickup, inboundYaw),
      altitude: drone.cruiseAltitude - Math.sin(stageProgress * Math.PI) * 1.35,
      stage: "picking-up",
      stageProgress,
      carryingBook: stageProgress >= 0.5,
      bookDropDistance: 0,
      wateringIntensity: 0
    };
  }
  if (cycle < 0.76) {
    const stageProgress = (cycle - 0.4) / 0.36;
    return {
      ...flightPose(drone.pickup, drone.destination, stageProgress, -drone.lateralArc),
      altitude: drone.cruiseAltitude + Math.sin(stageProgress * Math.PI) * 0.36,
      stage: "to-library",
      stageProgress,
      carryingBook: true,
      bookDropDistance: 0,
      wateringIntensity: 0
    };
  }
  if (cycle < 0.89) {
    const stageProgress = (cycle - 0.76) / 0.13;
    const carryingBook = stageProgress < 0.74;
    return {
      ...stationaryPose(drone.destination, outboundYaw),
      altitude: drone.cruiseAltitude - Math.sin(stageProgress * Math.PI) * 0.72,
      stage: "dropping-off",
      stageProgress,
      carryingBook,
      bookDropDistance: carryingBook ? smoothstep((stageProgress - 0.18) / 0.56) * 1.08 : 0,
      wateringIntensity: 0
    };
  }

  const stageProgress = (cycle - 0.89) / 0.11;
  return {
    ...stationaryPose(drone.destination, outboundYaw),
    x: drone.destination.x + Math.sin(stageProgress * Math.PI * 2) * 0.16,
    altitude: drone.cruiseAltitude + Math.sin(stageProgress * Math.PI) * 0.2,
    stage: "library-idle",
    stageProgress,
    carryingBook: false,
    bookDropDistance: 0,
    wateringIntensity: 0
  };
}

function wateringDronePose(drone: DroneDefinition, cycle: number): DronePose {
  const outboundYaw = Math.atan2(
    drone.destination.x - drone.pickup.x,
    drone.destination.z - drone.pickup.z
  );
  const returnYaw = Math.atan2(
    drone.pickup.x - drone.destination.x,
    drone.pickup.z - drone.destination.z
  );

  if (cycle < 0.12) {
    const stageProgress = cycle / 0.12;
    return {
      ...stationaryPose(drone.pickup, outboundYaw),
      altitude: drone.cruiseAltitude - Math.sin(stageProgress * Math.PI) * 0.88,
      stage: "refilling",
      stageProgress,
      carryingBook: false,
      bookDropDistance: 0,
      wateringIntensity: 0
    };
  }
  if (cycle < 0.38) {
    const stageProgress = (cycle - 0.12) / 0.26;
    return {
      ...flightPose(drone.pickup, drone.destination, stageProgress, drone.lateralArc),
      altitude: drone.cruiseAltitude + Math.sin(stageProgress * Math.PI) * 0.32,
      stage: "to-flowers",
      stageProgress,
      carryingBook: false,
      bookDropDistance: 0,
      wateringIntensity: 0
    };
  }
  if (cycle < 0.7) {
    const stageProgress = (cycle - 0.38) / 0.32;
    return {
      ...stationaryPose(drone.destination, returnYaw),
      altitude: drone.cruiseAltitude - 0.78 + Math.sin(stageProgress * Math.PI * 4) * 0.06,
      stage: "watering",
      stageProgress,
      carryingBook: false,
      bookDropDistance: 0,
      wateringIntensity: Math.sin(stageProgress * Math.PI)
    };
  }

  const stageProgress = (cycle - 0.7) / 0.3;
  return {
    ...flightPose(drone.destination, drone.pickup, stageProgress, -drone.lateralArc),
    altitude: drone.cruiseAltitude + Math.sin(stageProgress * Math.PI) * 0.28,
    stage: "returning",
    stageProgress,
    carryingBook: false,
    bookDropDistance: 0,
    wateringIntensity: 0
  };
}

/** Shared deterministic job simulation used by animation and unit tests. */
export function getDronePose(drone: DroneDefinition, elapsed: number): DronePose {
  const safeElapsed = Number.isFinite(elapsed) ? elapsed : 0;
  const cycle = positiveModulo(safeElapsed + drone.phase, drone.cycleDuration) / drone.cycleDuration;
  return drone.job === "library"
    ? bookDronePose(drone, cycle)
    : wateringDronePose(drone, cycle);
}
