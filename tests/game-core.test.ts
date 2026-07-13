// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  AGENT_COMMERCE_ROUTES,
  DEV_TOOLS_PIPELINE,
  WHISPBOOK_SEQUENCE,
  validateAgentCommerce,
  validateChallenge,
  validateDevTools,
  validateWattch,
  validateWhispbook
} from "../src/game/challenges";
import {
  COLLIDERS,
  PLAYER_RADIUS,
  WORLD_BOUNDS,
  clampToWorld,
  getCollidingCollider,
  isInsideIsland,
  isPositionWalkable,
  resolveMovement,
  resolveRobotOverlap
} from "../src/game/collision";
import {
  PLAYER_START,
  SYSTEMS,
  getNearestEligibleSystem,
  getNearestSystem,
  getNextSystem,
  getSystemById,
  isSystemUnlocked
} from "../src/game/content";
import {
  WORLD_SEED,
  cellToWorld,
  getCellFeature,
  getTerrainCell,
  getTerrainHeight,
  isInClearing,
  isInLabClearing,
  isTrailAt,
  proceduralHash,
  worldToCell
} from "../src/game/world/procedural";
import {
  WEBSITE_MAP_ANCHORS,
  WEBSITE_MAP_BOUNDS
} from "../src/game/world/generated/terminalDashboardMap";
import { LAB_SITES } from "../src/game/world/labs";
import { getRobotPalette } from "../src/game/entities/RobotSwarm";
import {
  ROBOT_COLLIDER_RADIUS,
  ROBOT_DEFINITIONS,
  getRobotPose
} from "../src/game/world/robots";
import {
  BOOK_PICKUP,
  DRONE_DEFINITIONS,
  FLOWER_BEDS,
  LIBRARY_DROPOFF,
  WATER_REFILL,
  getDronePose
} from "../src/game/world/drones";
import {
  advanceJump,
  createGroundedJumpState,
  getJumpRequestSequence,
  queueJumpRequest
} from "../src/game/jump";
import {
  createRobotColorSeed,
  DEFAULT_SETTINGS,
  EMPTY_INPUT,
  SAVE_KEY,
  SAVE_VERSION,
  SAVE_WRITE_DEBOUNCE_MS,
  REFERENCE_QA_PLAYER_POSITION,
  cancelPendingSave,
  installSaveFlushLifecycle,
  isReferenceQaMode,
  sanitizeSettings,
  validateAndMigrateSave,
  useGameStore
} from "../src/game/store";
import type { SystemId } from "../src/game/types";
import { GameUI } from "../src/ui";

const VALID_ANSWERS: Record<SystemId, unknown> = {
  wattch: { value: 87 },
  whispbook: { steps: [...WHISPBOOK_SEQUENCE] },
  "agent-commerce": { assignments: { ...AGENT_COMMERCE_ROUTES } },
  "dev-tools": { activated: [...DEV_TOOLS_PIPELINE], testsPassed: true }
};

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(String(key)) ?? null;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(String(key));
  }

  setItem(key: string, value: string): void {
    this.items.set(String(key), String(value));
  }
}

function installLocalStorage(): void {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: new MemoryStorage()
  });
}

function resetSingletonStore(): void {
  cancelPendingSave();
  installLocalStorage();
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
  useGameStore.setState({
    phase: "title",
    restoredIds: [],
    activeSystemId: null,
    playerPosition: { ...PLAYER_START },
    endingSeen: false,
    input: { ...EMPTY_INPUT },
    settings: { ...DEFAULT_SETTINGS },
    hasSave: false,
    notice: null
  });
  cancelPendingSave();
  window.localStorage.clear();
}

beforeEach(() => {
  vi.useRealTimers();
  resetSingletonStore();
});

afterEach(() => {
  cleanup();
  cancelPendingSave();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function openNearbySystem(id: SystemId): void {
  const system = getSystemById(id);
  if (!system) throw new Error(`Missing test system ${id}`);
  act(() => {
    useGameStore.setState({ playerPosition: { ...system.position } });
    useGameStore.getState().openSystem(id);
  });
}

describe("open-world game content", () => {
  it("publishes the four outposts across the expanded world", () => {
    expect(SYSTEMS.map(({ id, position }) => ({ id, position }))).toEqual([
      { id: "wattch", position: WEBSITE_MAP_ANCHORS.systems.wattch },
      { id: "whispbook", position: WEBSITE_MAP_ANCHORS.systems.whispbook },
      { id: "agent-commerce", position: WEBSITE_MAP_ANCHORS.systems["agent-commerce"] },
      { id: "dev-tools", position: WEBSITE_MAP_ANCHORS.systems["dev-tools"] }
    ]);
    expect(PLAYER_START).toEqual(WEBSITE_MAP_ANCHORS.spawn);
    expect(getSystemById("not-a-system")).toBeUndefined();
    expect(getSystemById("wattch")?.challenge).toMatchObject({
      kind: "calibration",
      targetMin: 84,
      targetMax: 90
    });
  });

  it("finds nearest systems with range, restored, and unlock filters", () => {
    expect(getNearestSystem({ x: -26, z: 43 })?.id).toBe("whispbook");
    expect(getNearestSystem({ x: 0, z: 0 }, { maxDistance: 1 })).toBeNull();
    expect(
      getNearestSystem(
        { x: 42, z: -36 },
        { restoredIds: ["wattch"], includeRestored: false }
      )?.id
    ).not.toBe("wattch");

    expect(getNearestEligibleSystem(PLAYER_START, [], 100)?.id).toBe("wattch");
    expect(getNearestEligibleSystem(PLAYER_START, ["wattch"], 100)?.id).toBe("whispbook");
    expect(getNextSystem(["wattch", "whispbook"])?.id).toBe("agent-commerce");
    expect(isSystemUnlocked("dev-tools", ["agent-commerce"])).toBe(true);
    expect(isSystemUnlocked("dev-tools", [])).toBe(false);
  });
});

describe("collision simulation", () => {
  it("keeps spawn and usable outpost approaches walkable", () => {
    expect(isPositionWalkable(PLAYER_START)).toBe(true);
    expect(getCollidingCollider({ x: PLAYER_START.x, z: PLAYER_START.z - 2.8 })).toMatchObject({
      id: "garden-heart-rail-north",
      kind: "structure"
    });
    for (const system of SYSTEMS) {
      expect(isInClearing(system.position.x, system.position.z)).toBe(true);
      const approach = { x: system.position.x, z: system.position.z + 3.3 };
      expect(isPositionWalkable(approach)).toBe(true);
      expect(COLLIDERS.some((collider) => collider.id.startsWith(`system-${system.id}`))).toBe(true);
    }
    expect(isInsideIsland({ x: 120, z: 60 })).toBe(true);
    expect(isInsideIsland({ x: WEBSITE_MAP_BOUNDS.maxX + 1, z: 0 })).toBe(false);
    expect(isPositionWalkable({ x: WEBSITE_MAP_BOUNDS.maxX + 1, z: 0 })).toBe(false);
  });

  it("generates deterministic terrain, biomes, and trail clearances", () => {
    expect(WORLD_SEED).toBe(731_947);
    expect(proceduralHash(18, -7, 9)).toBe(proceduralHash(18, -7, 9));
    expect(getTerrainCell(8, -4)).toEqual(getTerrainCell(8, -4));
    expect(getTerrainHeight(16, -8) % 0.45).toBeCloseTo(0, 8);
    expect(isTrailAt(8, 4)).toBe(true);
    expect(getCellFeature(0, 3)).toBeNull();
  });

  it("uses the same generated feature cells for rendering and collision", () => {
    expect(COLLIDERS.length).toBeGreaterThan(LAB_SITES.length);
    expect(getCellFeature(-56, -33)).toBe("tree");
    const propCenter = { x: cellToWorld(-56), z: cellToWorld(-33) };
    expect(isPositionWalkable(propCenter)).toBe(false);
    expect(getCollidingCollider(propCenter)).toMatchObject({
      id: "tree--56--33",
      kind: "prop"
    });
    expect(isPositionWalkable({ x: Number.NaN, z: 0 })).toBe(false);
  });

  it("keeps lab approaches clear while matching building collision footprints", () => {
    expect(LAB_SITES).toHaveLength(4);
    expect(new Set(LAB_SITES.map((site) => site.id)).size).toBe(LAB_SITES.length);
    for (const site of LAB_SITES) {
      expect(isInClearing(site.position.x, site.position.z)).toBe(true);
      expect(isInLabClearing(site.position.x + 8, site.position.z)).toBe(true);
      expect(getCellFeature(worldToCell(site.position.x), worldToCell(site.position.z))).toBeNull();
      expect(getCollidingCollider(site.position)).toMatchObject({
        id: `lab-${site.id}`,
        kind: "structure"
      });
      const approach = {
        x: site.position.x,
        z: site.position.z + site.footprint.halfDepth + 1.2
      };
      expect(isPositionWalkable(approach)).toBe(true);
    }
  });

  it("clamps boundaries and sweeps long movement without tunnelling", () => {
    expect(clampToWorld({ x: 999, z: -999 })).toEqual({
      x: WORLD_BOUNDS.maxX - 0.38,
      z: WORLD_BOUNDS.minZ + 0.38
    });

    const resolved = resolveMovement({ x: -62, z: 44.25 }, { x: -46, z: 44.25 });
    expect(resolved.x).toBeLessThan(-58.1);
    expect(isPositionWalkable(resolved)).toBe(true);
  });

  it("slides along an obstacle when one movement axis remains open", () => {
    const from = { x: -64, z: -49 };
    const target = { x: -56, z: -47 };
    const resolved = resolveMovement(from, target);
    expect(isPositionWalkable(resolved)).toBe(true);
    expect(resolved.z).toBeGreaterThan(-47.1);
    expect(resolved.x).toBeGreaterThan(from.x);
  });

  it("blocks moving robots and separates a player caught by a patrol", () => {
    const elapsed = 0;
    const robotPose = getRobotPose(ROBOT_DEFINITIONS[0], elapsed);
    expect(getCollidingCollider(robotPose, PLAYER_RADIUS, { robotElapsed: elapsed })).toMatchObject({
      id: "robot-0",
      kind: "robot"
    });

    const separated = resolveRobotOverlap(robotPose, elapsed);
    expect(Math.hypot(separated.x - robotPose.x, separated.z - robotPose.z)).toBeGreaterThanOrEqual(
      PLAYER_RADIUS + ROBOT_COLLIDER_RADIUS
    );
    expect(isPositionWalkable(separated)).toBe(true);

    const resolved = resolveMovement(
      { x: robotPose.x - 2, z: robotPose.z },
      { x: robotPose.x + 2, z: robotPose.z },
      PLAYER_RADIUS,
      { robotElapsed: elapsed }
    );
    expect(resolved.x).toBeLessThan(robotPose.x - PLAYER_RADIUS - ROBOT_COLLIDER_RADIUS + 0.02);
  });
});

describe("ambient drone jobs", () => {
  it("assigns archive couriers and one garden tender per flower bed", () => {
    expect(DRONE_DEFINITIONS.filter((drone) => drone.job === "library")).toHaveLength(2);
    expect(DRONE_DEFINITIONS.filter((drone) => drone.job === "watering")).toHaveLength(FLOWER_BEDS.length);
    expect(new Set(DRONE_DEFINITIONS.map((drone) => drone.id)).size).toBe(DRONE_DEFINITIONS.length);
  });

  it("carries a book from the depot and lowers it into the library receiver", () => {
    const courier = DRONE_DEFINITIONS.find((drone) => drone.job === "library");
    expect(courier).toBeDefined();
    if (!courier) return;

    const carrying = getDronePose(courier, courier.cycleDuration * 0.55 - courier.phase);
    expect(carrying.stage).toBe("to-library");
    expect(carrying.carryingBook).toBe(true);
    expect(Math.hypot(carrying.x - BOOK_PICKUP.x, carrying.z - BOOK_PICKUP.z)).toBeGreaterThan(1);

    const dropping = getDronePose(courier, courier.cycleDuration * 0.83 - courier.phase);
    expect(dropping.stage).toBe("dropping-off");
    expect(dropping.carryingBook).toBe(true);
    expect(dropping.bookDropDistance).toBeGreaterThan(0.5);
    expect(dropping).toMatchObject(LIBRARY_DROPOFF);
    expect(getDronePose(courier, courier.cycleDuration * 0.83 - courier.phase)).toEqual(dropping);
  });

  it("refills, waters the authored beds, and gives solid equipment collision", () => {
    const tender = DRONE_DEFINITIONS.find((drone) => drone.job === "watering");
    expect(tender).toBeDefined();
    if (!tender) return;

    const watering = getDronePose(tender, tender.cycleDuration * 0.54 - tender.phase);
    expect(watering.stage).toBe("watering");
    expect(watering.wateringIntensity).toBeCloseTo(1, 5);
    expect(watering).toMatchObject(tender.destination);
    expect(getCollidingCollider(BOOK_PICKUP)).toMatchObject({ id: "worksite-library-book-depot" });
    expect(getCollidingCollider(WATER_REFILL)).toMatchObject({ id: "worksite-mossglass-water-refill" });
  });
});

describe("jump simulation", () => {
  it("launches once, reaches a readable apex, and lands cleanly", () => {
    const requestBefore = getJumpRequestSequence();
    expect(queueJumpRequest()).toBe(requestBefore + 1);
    let state = createGroundedJumpState();
    let apex = 0;
    for (let frame = 0; frame < 180; frame += 1) {
      state = advanceJump(state, 1 / 60, frame < 8);
      apex = Math.max(apex, state.height);
      if (frame > 8 && state.grounded) break;
    }
    expect(apex).toBeGreaterThan(1.35);
    expect(apex).toBeLessThan(1.6);
    expect(state).toEqual(createGroundedJumpState());
  });
});

describe("roaming robot crews", () => {
  it("assigns three terrain patrols to the Garden Heart and each lab", () => {
    expect(ROBOT_DEFINITIONS).toHaveLength((LAB_SITES.length + 1) * 3);
    const robot = ROBOT_DEFINITIONS[0];
    const start = getRobotPose(robot, 0);
    const later = getRobotPose(robot, 12);
    expect(Math.hypot(later.x - start.x, later.z - start.z)).toBeGreaterThan(0.5);
    expect(Math.hypot(later.x - robot.homeX, later.z - robot.homeZ)).toBeLessThan(8.5);
    expect(Number.isFinite(later.yaw)).toBe(true);
  });

  it("derives stable varied palettes and advances the saved randomizer seed", () => {
    const firstPass = ROBOT_DEFINITIONS.map((_, index) => getRobotPalette(index, 731_947));
    const repeat = ROBOT_DEFINITIONS.map((_, index) => getRobotPalette(index, 731_947));
    const rerolled = ROBOT_DEFINITIONS.map((_, index) => getRobotPalette(index, 123_456_789));
    expect(repeat).toEqual(firstPass);
    expect(new Set(firstPass.map((palette) => palette.body)).size).toBeGreaterThan(3);
    expect(rerolled).not.toEqual(firstPass);
    expect(createRobotColorSeed(731_947, 99_991)).not.toBe(731_947);
    expect(sanitizeSettings({ robotColorSeed: -88.9 }).robotColorSeed).toBe(88);
  });
});

describe("restoration challenge validation", () => {
  it("calibrates Wattch around the reference's 87% reading", () => {
    expect(validateWattch(87)).toMatchObject({ success: true, progress: 1 });
    expect(validateWattch({ value: 90 }).success).toBe(true);
    expect(validateWattch(25)).toMatchObject({ success: false });
    expect(validateWattch(Number.NaN).progress).toBe(0);
  });

  it("requires Whispbook's exact ordered voice flow", () => {
    expect(validateWhispbook([...WHISPBOOK_SEQUENCE]).success).toBe(true);
    expect(validateWhispbook({ steps: ["speak"] })).toMatchObject({
      success: false,
      progress: 1 / 3
    });
    expect(validateWhispbook(["refine", "structure", "speak"]).success).toBe(false);
  });

  it("routes each Agent Commerce job to its accountable stage", () => {
    expect(validateAgentCommerce({ routes: AGENT_COMMERCE_ROUTES }).success).toBe(true);
    const invalid = validateAgentCommerce({
      "energy-audit": ["act", "verify"],
      "seed-order": ["plan", "act", "verify"]
    });
    expect(invalid).toMatchObject({ success: false, progress: 1 / 3 });
    expect(invalid.fieldErrors).toHaveProperty("energy-audit");
    expect(invalid.fieldErrors).toHaveProperty("helper-deploy");
  });

  it("requires ordered Dev Tools nodes and a passing verification", () => {
    expect(
      validateDevTools({ activated: [...DEV_TOOLS_PIPELINE], testsPassed: true }).success
    ).toBe(true);
    expect(
      validateDevTools({ activated: [...DEV_TOOLS_PIPELINE], testsPassed: false })
    ).toMatchObject({ success: false, progress: 5 / 6 });
    expect(
      validateDevTools({ activated: ["ship", "inspect"], testsPassed: true }).success
    ).toBe(false);
  });

  it("routes generic validation and rejects unknown systems safely", () => {
    expect(validateChallenge("wattch", { value: 87 }).success).toBe(true);
    expect(validateChallenge("unknown", {}).success).toBe(false);
  });
});

describe("versioned save validation and migration", () => {
  it("migrates legacy field names, deduplicates progress, and clamps settings", () => {
    const migrated = validateAndMigrateSave(
      {
        restoredSystemIds: ["wattch", "wattch", "bogus", "whispbook"],
        position: { x: 0, z: 9 },
        settings: {
          sound: false,
          volume: 4,
          reducedMotion: true,
          highContrast: true,
          quality: "low"
        },
        endingState: "playing"
      },
      0
    );

    expect(migrated).toMatchObject({
      restoredIds: ["wattch", "whispbook"],
      settings: {
        ...DEFAULT_SETTINGS,
        sound: false,
        volume: 1,
        reducedMotion: true,
        highContrast: true,
        quality: "low"
      },
      completed: false,
      endingSeen: false,
      hasSave: true
    });
    expect(isPositionWalkable(migrated.playerPosition)).toBe(true);
    expect(Math.hypot(migrated.playerPosition.x, migrated.playerPosition.z - 9)).toBeLessThan(0.75);
  });

  it("retains walkable old positions and repairs colliding positions before falling back", () => {
    const colliding = validateAndMigrateSave({
      hasSave: true,
      playerPosition: { ...SYSTEMS[0].position },
      restoredIds: ["wattch"]
    });
    expect(colliding.playerPosition).not.toEqual(PLAYER_START);
    expect(isPositionWalkable(colliding.playerPosition)).toBe(true);
    expect(Math.hypot(
      colliding.playerPosition.x - SYSTEMS[0].position.x,
      colliding.playerPosition.z - SYSTEMS[0].position.z
    )).toBeLessThan(24.1);

    const malformed = validateAndMigrateSave("not a save");
    expect(malformed).toMatchObject({
      restoredIds: [],
      playerPosition: PLAYER_START,
      completed: false,
      hasSave: false
    });
  });

  it("rejects future progress while preserving independently valid settings", () => {
    const recovered = validateAndMigrateSave(
      {
        restoredIds: ["wattch"],
        settings: { ...DEFAULT_SETTINGS, sound: false, volume: 0.2 }
      },
      SAVE_VERSION + 1
    );
    expect(recovered.restoredIds).toEqual([]);
    expect(recovered.hasSave).toBe(false);
    expect(recovered.settings).toMatchObject({ sound: false, volume: 0.2 });
  });

  it("repairs out-of-order save progress to the longest valid prefix", () => {
    expect(validateAndMigrateSave({ restoredIds: ["whispbook", "agent-commerce"] }).restoredIds).toEqual([]);
    expect(validateAndMigrateSave({ restoredIds: ["wattch", "agent-commerce"] }).restoredIds).toEqual(["wattch"]);
  });

  it("only accepts completion when all canonical systems are restored", () => {
    expect(
      validateAndMigrateSave({
        restoredIds: ["wattch"],
        completed: true,
        hasSave: true
      }).completed
    ).toBe(false);
    expect(
      validateAndMigrateSave({
        restoredIds: SYSTEMS.map((system) => system.id),
        completed: true,
        hasSave: true
      }).completed
    ).toBe(true);
  });
});

describe("game store progression", () => {
  it("handles title, pause, project, idempotent restoration, and ending phases", () => {
    const actions = useGameStore.getState();
    actions.startNewGame();
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", hasSave: true });

    actions.pauseGame();
    expect(useGameStore.getState().phase).toBe("paused");
    actions.resumeGame();
    expect(useGameStore.getState().phase).toBe("playing");

    actions.openSystem("dev-tools");
    expect(useGameStore.getState()).toMatchObject({
      phase: "playing",
      activeSystemId: null
    });
    expect(useGameStore.getState().notice).toContain("preceding");

    useGameStore.setState({ playerPosition: { ...getSystemById("wattch")!.position } });
    actions.openSystem("wattch");
    expect(useGameStore.getState()).toMatchObject({
      phase: "project",
      activeSystemId: "wattch"
    });
    actions.submitChallenge("wattch", VALID_ANSWERS.wattch);
    actions.submitChallenge("wattch", VALID_ANSWERS.wattch);
    expect(useGameStore.getState().restoredIds).toEqual(["wattch"]);

    for (const id of ["whispbook", "agent-commerce", "dev-tools"] as const) {
      useGameStore.setState({ playerPosition: { ...getSystemById(id)!.position } });
      actions.openSystem(id);
      actions.submitChallenge(id, VALID_ANSWERS[id]);
    }
    expect(useGameStore.getState()).toMatchObject({
      phase: "complete",
      restoredIds: ["wattch", "whispbook", "agent-commerce", "dev-tools"],
      activeSystemId: null,
      hasSave: true
    });

    actions.resumeGame();
    expect(useGameStore.getState()).toMatchObject({
      phase: "playing",
      endingSeen: true,
      restoredIds: ["wattch", "whispbook", "agent-commerce", "dev-tools"]
    });
    actions.pauseGame();
    actions.resumeGame();
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", endingSeen: true });
  });

  it("requires a nearby active project before accepting restoration", () => {
    const actions = useGameStore.getState();
    actions.startNewGame();
    actions.submitChallenge("wattch", VALID_ANSWERS.wattch);
    expect(useGameStore.getState()).toMatchObject({ restoredIds: [], phase: "playing" });

    actions.openSystem("wattch");
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", activeSystemId: null });
    expect(useGameStore.getState().notice).toContain("Walk closer");

    useGameStore.setState({ playerPosition: { ...getSystemById("wattch")!.position } });
    actions.openSystem("wattch");
    actions.submitChallenge("whispbook", VALID_ANSWERS.whispbook);
    expect(useGameStore.getState()).toMatchObject({
      phase: "project",
      activeSystemId: "wattch",
      restoredIds: []
    });
    actions.submitChallenge("wattch", { value: 25 });
    expect(useGameStore.getState()).toMatchObject({
      phase: "project",
      activeSystemId: "wattch",
      restoredIds: []
    });
    actions.submitChallenge("wattch", VALID_ANSWERS.wattch);
    expect(useGameStore.getState().restoredIds).toEqual(["wattch"]);
  });

  it("gates input behind gameplay and clears held input for overlays", () => {
    const actions = useGameStore.getState();
    actions.setInput("up", true);
    expect(useGameStore.getState().input.up).toBe(false);
    actions.startNewGame();
    actions.setInput("up", true);
    expect(useGameStore.getState().input.up).toBe(true);
    actions.setInput("jump", true);
    expect(useGameStore.getState().input.jump).toBe(true);
    actions.pauseGame();
    expect(useGameStore.getState().input).toEqual(EMPTY_INPUT);
  });

  it("keeps player positions finite, in bounds, and outside colliders", () => {
    const actions = useGameStore.getState();
    actions.startNewGame();
    actions.setPlayerPosition({ x: Number.NaN, z: 4 });
    expect(useGameStore.getState().playerPosition).toEqual(PLAYER_START);

    actions.setPlayerPosition({ x: -60, z: -48 });
    expect(isPositionWalkable(useGameStore.getState().playerPosition)).toBe(true);
    expect(useGameStore.getState().playerPosition).not.toEqual({ x: -60, z: -48 });
  });

  it("does not complete early and reports unavailable continue state", () => {
    const actions = useGameStore.getState();
    actions.continueGame();
    expect(useGameStore.getState().phase).toBe("title");
    expect(useGameStore.getState().notice).toContain("No saved");
    actions.startNewGame();
    actions.completeGame();
    expect(useGameStore.getState().phase).toBe("playing");
    expect(useGameStore.getState().notice).toContain("four systems");
  });
});

describe("DOM challenge integration", () => {
  it("exposes a dedicated touch jump control during play", () => {
    act(() => useGameStore.getState().startNewGame());
    render(createElement(GameUI));
    expect(screen.getByRole("button", { name: "Jump" })).toBeTruthy();
  });

  it("completes all four visible challenge flows through the authoritative store", () => {
    act(() => useGameStore.getState().startNewGame());
    render(createElement(GameUI));

    openNearbySystem("wattch");
    fireEvent.change(screen.getByLabelText("Energy calibration percentage"), {
      target: { value: "87" }
    });
    fireEvent.click(screen.getByRole("button", { name: /restore system/i }));
    expect(useGameStore.getState().restoredIds).toEqual(["wattch"]);

    openNearbySystem("whispbook");
    for (const label of ["SPEAK", "STRUCTURE", "REFINE"]) {
      const button = screen.getByText(label, { selector: "button span" }).closest("button");
      if (!button) throw new Error(`Missing Whispbook button ${label}`);
      fireEvent.click(button);
    }
    fireEvent.click(screen.getByRole("button", { name: /restore system/i }));
    expect(useGameStore.getState().restoredIds).toEqual(["wattch", "whispbook"]);

    openNearbySystem("agent-commerce");
    for (const job of ["ENERGY AUDIT", "SEED ORDER", "HELPER DEPLOY"]) {
      const row = screen.getByText(job).closest(".agent-job");
      if (!(row instanceof HTMLElement)) throw new Error(`Missing Agent Commerce row ${job}`);
      for (const stage of ["PLAN", "ACT", "VERIFY"]) {
        fireEvent.click(within(row).getByRole("button", { name: new RegExp(stage, "i") }));
      }
    }
    fireEvent.click(screen.getByRole("button", { name: /restore system/i }));
    expect(useGameStore.getState().restoredIds).toEqual([
      "wattch",
      "whispbook",
      "agent-commerce"
    ]);

    openNearbySystem("dev-tools");
    for (const node of ["SOURCE", "INSPECT", "COMPOSE", "TEST", "SHIP"]) {
      const button = screen.getByText(node, { selector: "button span" }).closest("button");
      if (!button) throw new Error(`Missing Dev Tools node ${node}`);
      fireEvent.click(button);
    }
    fireEvent.click(screen.getByRole("button", { name: /restore system/i }));

    expect(useGameStore.getState()).toMatchObject({
      phase: "complete",
      restoredIds: ["wattch", "whispbook", "agent-commerce", "dev-tools"]
    });
    expect(screen.getByTestId("completion-screen")).toBeTruthy();
  });
});

describe("persistence behaviour", () => {
  it("flushes a pending save when the page is hidden or closed", () => {
    vi.useFakeTimers();
    const actions = useGameStore.getState();
    actions.setSettings({ volume: 0.33 });
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();

    const removeLifecycle = installSaveFlushLifecycle();
    window.dispatchEvent(new Event("pagehide"));
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "{}").state.settings.volume).toBe(0.33);
    removeLifecycle();
  });

  it("debounces ordinary writes but flushes meaningful progress immediately", () => {
    vi.useFakeTimers();
    const actions = useGameStore.getState();
    actions.setSettings({ volume: 0.25 });
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    vi.advanceTimersByTime(SAVE_WRITE_DEBOUNCE_MS - 1);
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    vi.advanceTimersByTime(1);
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "{}").state.settings.volume).toBe(0.25);

    window.localStorage.clear();
    actions.startNewGame();
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "{}")).toMatchObject({
      version: SAVE_VERSION,
      state: { hasSave: true }
    });
    useGameStore.setState({ playerPosition: { ...getSystemById("wattch")!.position } });
    actions.openSystem("wattch");
    actions.submitChallenge("wattch", VALID_ANSWERS.wattch);
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "{}").state.restoredIds).toEqual([
      "wattch"
    ]);
  });

  it("reset removes progress while retaining settings as non-resumable preferences", () => {
    vi.useFakeTimers();
    const actions = useGameStore.getState();
    actions.startNewGame();
    actions.setSettings({ sound: false, volume: 0.4 });
    useGameStore.setState({ playerPosition: { ...getSystemById("wattch")!.position } });
    actions.openSystem("wattch");
    actions.submitChallenge("wattch", VALID_ANSWERS.wattch);
    actions.resetProgress();
    expect(useGameStore.getState()).toMatchObject({
      phase: "title",
      restoredIds: [],
      hasSave: false,
      settings: { sound: false, volume: 0.4 }
    });
    vi.advanceTimersByTime(SAVE_WRITE_DEBOUNCE_MS);
    expect(JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "{}").state).toMatchObject({
      restoredIds: [],
      hasSave: false,
      settings: { sound: false, volume: 0.4 }
    });
  });

  it("hydrates and migrates a legacy Zustand save envelope", async () => {
    cancelPendingSave();
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          restoredSystemIds: ["wattch"],
          position: { x: 0, z: 9 },
          settings: { ...DEFAULT_SETTINGS, highContrast: true }
        }
      })
    );
    vi.resetModules();
    const freshStoreModule = await import("../src/game/store");
    const hydratedState = freshStoreModule.useGameStore.getState();
    expect(hydratedState).toMatchObject({
      phase: "title",
      restoredIds: ["wattch"],
      hasSave: true,
      settings: { highContrast: true }
    });
    expect(isPositionWalkable(hydratedState.playerPosition)).toBe(true);
    expect(Math.hypot(hydratedState.playerPosition.x, hydratedState.playerPosition.z - 9)).toBeLessThan(0.75);
    freshStoreModule.cancelPendingSave();
  });

  it("uses a deterministic reference state without reading or mutating the normal save", async () => {
    cancelPendingSave();
    const original = JSON.stringify({ version: SAVE_VERSION, state: { sentinel: "player-save" } });
    window.localStorage.setItem(SAVE_KEY, original);
    window.history.replaceState({}, "", "/?qa=reference");
    const getItem = vi.spyOn(window.localStorage, "getItem");
    const setItem = vi.spyOn(window.localStorage, "setItem");
    const removeItem = vi.spyOn(window.localStorage, "removeItem");

    vi.resetModules();
    const referenceStoreModule = await import("../src/game/store");
    expect(referenceStoreModule.useGameStore.getState()).toMatchObject({
      phase: "playing",
      restoredIds: [],
      playerPosition: REFERENCE_QA_PLAYER_POSITION,
      hasSave: false
    });
    expect(getItem).not.toHaveBeenCalled();

    const referenceActions = referenceStoreModule.useGameStore.getState();
    referenceActions.startNewGame();
    referenceActions.submitChallenge("wattch", VALID_ANSWERS.wattch);
    referenceActions.setSettings({ volume: 0.1 });
    referenceActions.resetProgress();

    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(original);
  });

  it("ignores the reference query when the build has not enabled QA mode", () => {
    expect(isReferenceQaMode("?qa=reference", false)).toBe(false);
    expect(isReferenceQaMode("?qa=reference", true)).toBe(true);
  });
});
