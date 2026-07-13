import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { validateChallenge } from "./challenges";
import {
  clampToWorld,
  findNearestWalkablePosition,
  isPositionWalkable,
  resolveMovement
} from "./collision";
import {
  PLAYER_START,
  getSystemById,
  isSystemUnlocked,
  isSystemId
} from "./content";
import type {
  GameSettings,
  GameState,
  GameStore,
  ChallengeValidation,
  InputState,
  ViewMode,
  WorldPosition
} from "./types";
import { SYSTEM_IDS } from "./types";

export const SAVE_KEY = "systems-garden-save";
export const SAVE_VERSION = 6;
export const SAVE_WRITE_DEBOUNCE_MS = 180;

export const DEFAULT_SETTINGS: Readonly<GameSettings> = Object.freeze({
  sound: true,
  volume: 0.7,
  reducedMotion: false,
  highContrast: false,
  quality: "high",
  robotColorSeed: 731_947
});

export const EMPTY_INPUT: Readonly<InputState> = Object.freeze({
  up: false,
  down: false,
  left: false,
  right: false,
  jump: false
});

export interface PersistedGameState {
  restoredIds: string[];
  playerPosition: WorldPosition;
  settings: GameSettings;
  completed: boolean;
  endingSeen: boolean;
  hasSave: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberInUnitRange(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback;
}

function safeColorSeed(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.abs(Math.trunc(value)) % 2_147_483_647;
}

export function createRobotColorSeed(current: number, entropy = Date.now()): number {
  const safeCurrent = safeColorSeed(current, DEFAULT_SETTINGS.robotColorSeed);
  const safeEntropy = safeColorSeed(entropy, 104_729);
  const mixed = (Math.imul(safeCurrent ^ safeEntropy, 1_664_525) + 1_013_904_223) >>> 0;
  const next = mixed % 2_147_483_647;
  return next === safeCurrent ? (next + 104_729) % 2_147_483_647 : next;
}

export function sanitizeSettings(value: unknown): GameSettings {
  const source = isRecord(value) ? value : {};
  return {
    sound: typeof source.sound === "boolean" ? source.sound : DEFAULT_SETTINGS.sound,
    volume: numberInUnitRange(source.volume, DEFAULT_SETTINGS.volume),
    reducedMotion:
      typeof source.reducedMotion === "boolean"
        ? source.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
    highContrast:
      typeof source.highContrast === "boolean"
        ? source.highContrast
        : DEFAULT_SETTINGS.highContrast,
    quality: source.quality === "low" || source.quality === "high"
      ? source.quality
      : DEFAULT_SETTINGS.quality,
    robotColorSeed: safeColorSeed(source.robotColorSeed, DEFAULT_SETTINGS.robotColorSeed)
  };
}

function sanitizeRestoredIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const supplied = new Set(value.filter((id): id is string => isSystemId(id)));
  const orderedPrefix: string[] = [];
  for (const id of SYSTEM_IDS) {
    if (!supplied.has(id)) break;
    orderedPrefix.push(id);
  }
  return orderedPrefix;
}

function sanitizePosition(value: unknown): WorldPosition {
  if (!isRecord(value)) return { ...PLAYER_START };
  const candidate = { x: value.x, z: value.z };
  if (typeof candidate.x !== "number" || typeof candidate.z !== "number") {
    return { ...PLAYER_START };
  }
  if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.z)) {
    return { ...PLAYER_START };
  }

  const clamped = clampToWorld({ x: candidate.x, z: candidate.z });
  if (isPositionWalkable(clamped)) return clamped;
  return findNearestWalkablePosition(clamped) ?? { ...PLAYER_START };
}

function unwrapSave(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  // Accept a full Zustand envelope as a convenience for recovery tools/tests.
  return isRecord(value.state) ? value.state : value;
}

/**
 * Validates the current schema and migrates the v0/v1 field names. A future
 * incompatible version recovers clean progress while retaining safe settings.
 */
export function validateAndMigrateSave(value: unknown, version = SAVE_VERSION): PersistedGameState {
  const source = unwrapSave(value);
  const settings = sanitizeSettings(source.settings);

  if (!Number.isInteger(version) || version > SAVE_VERSION) {
    return {
      restoredIds: [],
      playerPosition: { ...PLAYER_START },
      settings,
      completed: false,
      endingSeen: false,
      hasSave: false
    };
  }

  const legacyPlayer = isRecord(source.player) ? source.player : {};
  const restoredSource = source.restoredIds ?? source.restoredSystemIds ?? source.restored;
  const positionSource = source.playerPosition ?? source.position ?? legacyPlayer.position;
  const restoredIds = sanitizeRestoredIds(restoredSource);
  const playerPosition = sanitizePosition(positionSource);
  const allRestored = SYSTEM_IDS.every((id) => restoredIds.includes(id));
  const requestedCompleted =
    source.completed === true || source.endingState === "complete" || source.phase === "complete";
  const endingSeen = source.endingSeen === true || source.postgame === true;
  const hasValidRestoredShape =
    Array.isArray(restoredSource) &&
    (restoredSource.length === 0 || restoredSource.some((id) => isSystemId(id)));
  const hasValidPositionShape =
    isRecord(positionSource) &&
    typeof positionSource.x === "number" &&
    Number.isFinite(positionSource.x) &&
    typeof positionSource.z === "number" &&
    Number.isFinite(positionSource.z);
  const recognizedProgress =
    hasValidRestoredShape ||
    hasValidPositionShape ||
    typeof source.completed === "boolean" ||
    source.endingState === "complete" ||
    source.endingState === "playing";
  const hasSave = typeof source.hasSave === "boolean" ? source.hasSave : recognizedProgress;

  return {
    restoredIds,
    playerPosition,
    settings,
    completed: allRestored && (requestedCompleted || restoredIds.length === SYSTEM_IDS.length),
    endingSeen: allRestored && endingSeen,
    hasSave
  };
}

const QA_BUILD_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_REFERENCE_QA === "1";

export function isReferenceQaMode(search?: string, enabled = QA_BUILD_ENABLED): boolean {
  if (!enabled) return false;
  const query = search ?? (typeof window !== "undefined" ? window.location.search : "");
  try {
    return new URLSearchParams(query).get("qa") === "reference";
  } catch {
    return false;
  }
}

export const REFERENCE_QA_MODE = isReferenceQaMode();
export const REFERENCE_QA_PLAYER_POSITION = Object.freeze({ x: 0, z: 0 });

let pendingWrite: { key: string; value: string } | null = null;
let pendingWriteTimer: ReturnType<typeof setTimeout> | null = null;

function browserStorage(): Storage | null {
  if (REFERENCE_QA_MODE || typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function cancelPendingSave(): void {
  if (pendingWriteTimer !== null) {
    globalThis.clearTimeout(pendingWriteTimer);
    pendingWriteTimer = null;
  }
  pendingWrite = null;
}

export function flushPendingSave(): void {
  if (pendingWriteTimer !== null) {
    globalThis.clearTimeout(pendingWriteTimer);
    pendingWriteTimer = null;
  }
  const write = pendingWrite;
  pendingWrite = null;
  if (!write) return;

  try {
    browserStorage()?.setItem(write.key, write.value);
  } catch {
    // Storage can be disabled or exhausted. The in-memory game remains usable.
  }
}

/** Flushes debounced state when a browser backgrounds or closes the game. */
export function installSaveFlushLifecycle(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => undefined;
  const flush = () => flushPendingSave();
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") flush();
  };
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    window.removeEventListener("pagehide", flush);
    window.removeEventListener("beforeunload", flush);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

const debouncedStorage: StateStorage = {
  getItem: (key) => {
    if (REFERENCE_QA_MODE) return null;
    try {
      return browserStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    if (REFERENCE_QA_MODE) return;
    pendingWrite = { key, value };
    if (pendingWriteTimer !== null) globalThis.clearTimeout(pendingWriteTimer);
    pendingWriteTimer = globalThis.setTimeout(flushPendingSave, SAVE_WRITE_DEBOUNCE_MS);
  },
  removeItem: (key) => {
    if (REFERENCE_QA_MODE) return;
    cancelPendingSave();
    try {
      browserStorage()?.removeItem(key);
    } catch {
      // A reset still succeeds in memory when storage is unavailable.
    }
  }
};

function freshState(phase: GameState["phase"]): GameState {
  return {
    phase,
    viewMode: "explore",
    requestedWebsiteSection: null,
    restoredIds: [],
    endingSeen: false,
    activeSystemId: null,
    playerPosition: { ...PLAYER_START },
    input: { ...EMPTY_INPUT },
    settings: { ...DEFAULT_SETTINGS },
    hasSave: false,
    notice: null
  };
}

export function getInitialGameState(): GameState {
  const state = freshState(REFERENCE_QA_MODE ? "playing" : "title");
  if (REFERENCE_QA_MODE) state.playerPosition = { ...REFERENCE_QA_PLAYER_POSITION };
  return state;
}

function persistImmediately(): void {
  // Zustand calls storage.setItem before returning from set(), so this flushes
  // the state produced by the action that just completed.
  flushPendingSave();
}

const jsonStorage = createJSONStorage<PersistedGameState>(() => debouncedStorage);

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...getInitialGameState(),

      enterBirdView: () => {
        const state = get();
        if (state.phase !== "playing" || state.viewMode === "bird") return;
        set({
          viewMode: "bird",
          requestedWebsiteSection: null,
          input: { ...EMPTY_INPUT },
          notice: null
        });
      },

      exitBirdView: () => {
        const state = get();
        if (state.phase !== "playing" || state.viewMode === "explore") return;
        set({
          viewMode: "explore",
          requestedWebsiteSection: null,
          input: { ...EMPTY_INPUT },
          notice: null
        });
      },

      toggleBirdView: () => {
        const state = get();
        if (state.phase !== "playing") return;
        const viewMode: ViewMode = state.viewMode === "bird" ? "explore" : "bird";
        set({
          viewMode,
          requestedWebsiteSection: null,
          input: { ...EMPTY_INPUT },
          notice: null
        });
      },

      requestWebsiteSection: (id) => {
        const state = get();
        if (state.phase !== "playing" || state.viewMode !== "bird") return;
        set({ requestedWebsiteSection: id, input: { ...EMPTY_INPUT } });
      },

      consumeWebsiteSection: () => {
        if (get().requestedWebsiteSection === null) return;
        set({ requestedWebsiteSection: null });
      },

      startNewGame: () => {
        const settings = get().settings;
        set({
          ...freshState("playing"),
          settings: { ...settings },
          hasSave: true
        });
        persistImmediately();
      },

      continueGame: () => {
        const state = get();
        if (!state.hasSave) {
          set({ notice: "No saved garden is available yet." });
          return;
        }
        const complete = SYSTEM_IDS.every((id) => state.restoredIds.includes(id));
        set({
          phase: complete && !state.endingSeen ? "complete" : "playing",
          viewMode: "explore",
          requestedWebsiteSection: null,
          activeSystemId: null,
          input: { ...EMPTY_INPUT },
          notice: null
        });
      },

      pauseGame: () => {
        if (get().phase !== "playing") return;
        set({ phase: "paused", input: { ...EMPTY_INPUT }, notice: null });
      },

      resumeGame: () => {
        const state = get();
        if (state.phase !== "paused" && state.phase !== "complete") return;
        const leavingEnding = state.phase === "complete";
        set({
          phase: "playing",
          viewMode: leavingEnding ? "explore" : state.viewMode,
          requestedWebsiteSection: null,
          endingSeen: leavingEnding ? true : state.endingSeen,
          input: { ...EMPTY_INPUT },
          notice: leavingEnding ? "The restored garden is open to explore." : null
        });
        if (leavingEnding) persistImmediately();
      },

      inspectSystem: (id) => {
        const state = get();
        const system = getSystemById(id);
        if (!system) {
          set({ notice: "That garden system could not be found." });
          return;
        }
        if (state.phase !== "playing") return;
        set({
          phase: "project",
          requestedWebsiteSection: null,
          activeSystemId: system.id,
          input: { ...EMPTY_INPUT },
          notice: null
        });
      },

      openSystem: (id) => {
        const state = get();
        const system = getSystemById(id);
        if (!system) {
          set({ notice: "That garden system could not be found." });
          return;
        }
        if (state.phase !== "playing") return;
        if (!state.restoredIds.includes(system.id) && !isSystemUnlocked(system.id, state.restoredIds)) {
          set({ notice: "Restore the preceding system to wake this beacon." });
          return;
        }
        const distance = Math.hypot(
          state.playerPosition.x - system.position.x,
          state.playerPosition.z - system.position.z
        );
        if (distance > system.interactionRadius + 0.5) {
          set({ notice: `Walk closer to ${system.name}'s beacon to interact.` });
          return;
        }
        set({
          phase: "project",
          requestedWebsiteSection: null,
          activeSystemId: system.id,
          input: { ...EMPTY_INPUT },
          notice: null
        });
      },

      closeSystem: () => {
        if (get().phase !== "project") return;
        set({
          phase: "playing",
          requestedWebsiteSection: null,
          activeSystemId: null,
          input: { ...EMPTY_INPUT },
          notice: null
        });
      },

      submitChallenge: (id, answer): ChallengeValidation => {
        const reject = (message: string): ChallengeValidation => ({
          success: false,
          progress: 0,
          message
        });
        const system = getSystemById(id);
        if (!system) {
          const failure = reject("That garden system could not be restored.");
          set({ notice: failure.message });
          return failure;
        }

        const state = get();
        if (state.phase !== "project" || state.activeSystemId !== system.id) {
          const failure = reject(`Open ${system.name}'s beacon and complete its restoration challenge first.`);
          set({ notice: failure.message });
          return failure;
        }
        if (state.restoredIds.includes(system.id)) {
          const alreadyRestored: ChallengeValidation = {
            success: true,
            progress: 1,
            message: `${system.name} is already thriving.`
          };
          set({
            phase: state.phase === "project" ? "playing" : state.phase,
            activeSystemId: null,
            notice: alreadyRestored.message
          });
          return alreadyRestored;
        }
        if (!isSystemUnlocked(system.id, state.restoredIds)) {
          const failure = reject("This system is still dormant. Restore the preceding beacon first.");
          set({ notice: failure.message });
          return failure;
        }
        const distance = Math.hypot(
          state.playerPosition.x - system.position.x,
          state.playerPosition.z - system.position.z
        );
        if (state.viewMode !== "bird" && distance > system.interactionRadius + 0.5) {
          const failure = reject(`Walk closer to ${system.name}'s beacon to restore it.`);
          set({ notice: failure.message });
          return failure;
        }

        const validation = validateChallenge(system.id, answer);
        if (!validation.success) {
          set({ notice: validation.message });
          return validation;
        }

        const restoredIds = [...state.restoredIds, system.id];
        const complete = SYSTEM_IDS.every((systemId) => restoredIds.includes(systemId));
        set({
          restoredIds,
          phase: complete ? "complete" : "playing",
          requestedWebsiteSection: null,
          endingSeen: false,
          activeSystemId: null,
          input: { ...EMPTY_INPUT },
          hasSave: true,
          notice: complete
            ? "The whole Systems Garden is thriving."
            : `${system.name} restored. A new beacon is awake.`
        });
        persistImmediately();
        return validation;
      },

      setPlayerPosition: (position) => {
        if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return;
        const resolved = resolveMovement(get().playerPosition, position);
        set({ playerPosition: resolved, hasSave: get().hasSave || get().phase !== "title" });
      },

      setInput: (direction, active) => {
        const state = get();
        if ((state.phase !== "playing" || state.viewMode !== "explore") && active) return;
        if (state.input[direction] === active) return;
        set({ input: { ...state.input, [direction]: active } });
      },

      setSettings: (settings) => {
        set({ settings: sanitizeSettings({ ...get().settings, ...settings }) });
      },

      resetProgress: () => {
        const settings = get().settings;
        set({
          ...freshState(REFERENCE_QA_MODE ? "playing" : "title"),
          settings: { ...settings }
        });
        useGameStore.persist.clearStorage();
        // Persist accessibility/audio preferences without marking progress as resumable.
        set({ settings: { ...settings }, hasSave: false });
      },

      completeGame: () => {
        const state = get();
        if (!SYSTEM_IDS.every((id) => state.restoredIds.includes(id))) {
          set({ notice: "Restore all four systems before completing the garden." });
          return;
        }
        set({
          phase: "complete",
          requestedWebsiteSection: null,
          endingSeen: false,
          activeSystemId: null,
          input: { ...EMPTY_INPUT },
          hasSave: true,
          notice: "The whole Systems Garden is thriving."
        });
        persistImmediately();
      },

      setNotice: (notice) => set({ notice })
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: jsonStorage,
      partialize: (state): PersistedGameState => ({
        restoredIds: state.restoredIds,
        playerPosition: state.playerPosition,
        settings: state.settings,
        completed: state.phase === "complete",
        endingSeen: state.endingSeen,
        hasSave: state.hasSave
      }),
      migrate: (persistedState, version) => validateAndMigrateSave(persistedState, version),
      merge: (persistedState, currentState) => {
        if (REFERENCE_QA_MODE || persistedState === undefined) return currentState;
        const saved = validateAndMigrateSave(persistedState, SAVE_VERSION);
        return {
          ...currentState,
          phase: "title",
          viewMode: "explore",
          requestedWebsiteSection: null,
          restoredIds: saved.restoredIds,
          endingSeen: saved.endingSeen,
          activeSystemId: null,
          playerPosition: saved.playerPosition,
          input: { ...EMPTY_INPUT },
          settings: saved.settings,
          hasSave: saved.hasSave,
          notice: null
        };
      }
    }
  )
);
