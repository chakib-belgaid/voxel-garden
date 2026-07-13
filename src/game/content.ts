import type {
  NearestSystemOptions,
  SystemDefinition,
  SystemId,
  WorldPosition
} from "./types";
import { SYSTEM_IDS } from "./types";
import { WEBSITE_MAP_ANCHORS } from "./world/generated/terminalDashboardMap";

export const PLAYER_START: Readonly<WorldPosition> = WEBSITE_MAP_ANCHORS.spawn;

export const SYSTEMS = [
  {
    id: "wattch",
    name: "Wattch",
    kicker: "Measure · Analyze · Optimize",
    description: "Cross the northern meadow and calibrate its energy monitor inside the efficient band.",
    restoredDescription: "The northern energy station is balancing demand with the garden's clean supply.",
    accent: "lime",
    order: 0,
    position: WEBSITE_MAP_ANCHORS.systems.wattch,
    interactionRadius: 4.25,
    unlockAfter: null,
    challenge: {
      kind: "calibration",
      min: 0,
      max: 100,
      targetMin: 84,
      targetMax: 90,
      initialValue: 42,
      unit: "%"
    }
  },
  {
    id: "whispbook",
    name: "Whispbook",
    kicker: "Speak · Structure · Refine",
    description: "Find the archive grove and reconnect its voice pipeline into a useful flow.",
    restoredDescription: "The archive grove now turns spoken ideas into clear, structured notes.",
    accent: "violet",
    order: 1,
    position: WEBSITE_MAP_ANCHORS.systems.whispbook,
    interactionRadius: 4.25,
    unlockAfter: "wattch",
    challenge: {
      kind: "sequence",
      steps: [
        { id: "speak", label: "Speak" },
        { id: "structure", label: "Structure" },
        { id: "refine", label: "Refine" }
      ]
    }
  },
  {
    id: "agent-commerce",
    name: "Agent Commerce",
    kicker: "Plan · Act · Verify",
    description: "Reach the eastern exchange and route three jobs through accountable stages.",
    restoredDescription: "Every exchange job is planned, performed, and checked before it closes.",
    accent: "cyan",
    order: 2,
    position: WEBSITE_MAP_ANCHORS.systems["agent-commerce"],
    interactionRadius: 4.25,
    unlockAfter: "whispbook",
    challenge: {
      kind: "routing",
      stages: [
        { id: "plan", label: "Plan" },
        { id: "act", label: "Act" },
        { id: "verify", label: "Verify" }
      ],
      jobs: [
        { id: "energy-audit", label: "Energy audit" },
        { id: "seed-order", label: "Seed order" },
        { id: "helper-deploy", label: "Helper deploy" }
      ]
    }
  },
  {
    id: "dev-tools",
    name: "Dev Tools",
    kicker: "Inspect · Compose · Ship",
    description: "Climb to the western workshop and bring its local-first delivery pipeline online.",
    restoredDescription: "The highland pipeline is green from local source to verified release.",
    accent: "orange",
    order: 3,
    position: WEBSITE_MAP_ANCHORS.systems["dev-tools"],
    interactionRadius: 4.25,
    unlockAfter: "agent-commerce",
    challenge: {
      kind: "pipeline",
      nodes: [
        { id: "source", label: "Local source" },
        { id: "inspect", label: "Inspect source" },
        { id: "compose", label: "Compose build" },
        { id: "test", label: "Run checks" },
        { id: "ship", label: "Ship release" }
      ],
      requiresVerification: true
    }
  }
] as const satisfies readonly SystemDefinition[];

const SYSTEM_BY_ID = new Map<SystemId, SystemDefinition>(
  SYSTEMS.map((system) => [system.id, system])
);

export function isSystemId(value: unknown): value is SystemId {
  return typeof value === "string" && (SYSTEM_IDS as readonly string[]).includes(value);
}

export function getSystemById(id: string | null | undefined): SystemDefinition | undefined {
  return isSystemId(id) ? SYSTEM_BY_ID.get(id) : undefined;
}

export function isSystemUnlocked(id: string, restoredIds: readonly string[]): boolean {
  const system = getSystemById(id);
  if (!system) return false;
  return system.unlockAfter === null || restoredIds.includes(system.unlockAfter);
}

export function getNextSystem(restoredIds: readonly string[]): SystemDefinition | undefined {
  return SYSTEMS.find((system) => !restoredIds.includes(system.id) && isSystemUnlocked(system.id, restoredIds));
}

export function getNearestSystem(
  position: WorldPosition,
  options: NearestSystemOptions = {}
): SystemDefinition | null {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return null;

  const restoredIds = options.restoredIds ?? [];
  const includeLocked = options.includeLocked ?? true;
  const includeRestored = options.includeRestored ?? true;
  const maxDistance = Number.isFinite(options.maxDistance)
    ? Math.max(0, options.maxDistance ?? Number.POSITIVE_INFINITY)
    : Number.POSITIVE_INFINITY;
  const maxDistanceSquared = maxDistance * maxDistance;

  let nearest: SystemDefinition | null = null;
  let nearestDistanceSquared = maxDistanceSquared;

  for (const system of SYSTEMS) {
    if (!includeRestored && restoredIds.includes(system.id)) continue;
    if (!includeLocked && !isSystemUnlocked(system.id, restoredIds)) continue;

    const dx = system.position.x - position.x;
    const dz = system.position.z - position.z;
    const distanceSquared = dx * dx + dz * dz;

    if (distanceSquared <= nearestDistanceSquared) {
      nearest = system;
      nearestDistanceSquared = distanceSquared;
    }
  }

  return nearest;
}

export function getNearestEligibleSystem(
  position: WorldPosition,
  restoredIds: readonly string[],
  maxDistance = Number.POSITIVE_INFINITY
): SystemDefinition | null {
  return getNearestSystem(position, {
    restoredIds,
    maxDistance,
    includeLocked: false,
    includeRestored: false
  });
}
