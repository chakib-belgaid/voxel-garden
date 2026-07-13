import { PLAYER_START } from "../content";
import type { WorldPosition } from "../types";
import { LAB_SITES } from "./labs";

export interface RobotDefinition {
  homeX: number;
  homeZ: number;
  phase: number;
  radiusX: number;
  radiusZ: number;
  speed: number;
}

export interface RobotPose extends WorldPosition {
  yaw: number;
}

export const ROBOT_COLLIDER_RADIUS = 0.52;

const ROBOT_HOMES = [PLAYER_START, ...LAB_SITES.map((site) => site.position)];

export const ROBOT_DEFINITIONS: readonly RobotDefinition[] = Object.freeze(
  ROBOT_HOMES.flatMap((home, homeIndex) => Array.from({ length: 3 }, (_, localIndex) => ({
    homeX: home.x,
    homeZ: home.z,
    phase: homeIndex * 1.37 + localIndex * 2.11,
    radiusX: 5.2 + localIndex * 1.05,
    radiusZ: 4.6 + ((localIndex + homeIndex) % 3) * 0.9,
    speed: 0.16 + ((homeIndex * 3 + localIndex) % 5) * 0.024
  })))
);

export function getRobotPose(robot: RobotDefinition, elapsed: number): RobotPose {
  const safeElapsed = Number.isFinite(elapsed) ? elapsed : 0;
  const angle = robot.phase + safeElapsed * robot.speed;
  const drift = Math.sin(angle * 0.43 + robot.phase) * 0.55;
  const x = robot.homeX + Math.cos(angle) * robot.radiusX + drift;
  const z = robot.homeZ + Math.sin(angle) * robot.radiusZ;
  const lookAhead = angle + 0.015;
  const nextX = robot.homeX + Math.cos(lookAhead) * robot.radiusX + Math.sin(lookAhead * 0.43 + robot.phase) * 0.55;
  const nextZ = robot.homeZ + Math.sin(lookAhead) * robot.radiusZ;
  return { x, z, yaw: Math.atan2(nextX - x, nextZ - z) };
}
