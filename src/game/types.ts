import type { WebsiteSectionId } from "./world/map/schema";

export const SYSTEM_IDS = [
  "wattch",
  "whispbook",
  "agent-commerce",
  "dev-tools"
] as const;

export type SystemId = (typeof SYSTEM_IDS)[number];

export type GamePhase = "title" | "playing" | "paused" | "project" | "complete";

/** Presentation mode shared by the DOM HUD and React Three Fiber scene. */
export type ViewMode = "explore" | "bird";

export interface WorldPosition {
  x: number;
  z: number;
}

export interface ThirdPersonCameraState {
  yaw: number;
  pitch: number;
  distance: number;
}

export type InputDirection = "up" | "down" | "left" | "right";

export type InputAction = InputDirection | "jump";

export type InputState = Record<InputAction, boolean>;

export interface GameSettings {
  sound: boolean;
  volume: number;
  reducedMotion: boolean;
  highContrast: boolean;
  quality: "low" | "high";
  robotColorSeed: number;
}

export type SystemAccent = "lime" | "violet" | "cyan" | "orange";

export interface CalibrationChallenge {
  kind: "calibration";
  min: number;
  max: number;
  targetMin: number;
  targetMax: number;
  initialValue: number;
  unit: string;
}

export interface SequenceChallenge {
  kind: "sequence";
  steps: readonly { id: string; label: string }[];
}

export interface RoutingChallenge {
  kind: "routing";
  stages: readonly { id: string; label: string }[];
  jobs: readonly { id: string; label: string }[];
}

export interface PipelineChallenge {
  kind: "pipeline";
  nodes: readonly { id: string; label: string }[];
  requiresVerification: boolean;
}

export type ChallengeDefinition =
  | CalibrationChallenge
  | SequenceChallenge
  | RoutingChallenge
  | PipelineChallenge;

export interface SystemDefinition {
  id: SystemId;
  name: string;
  kicker: string;
  description: string;
  restoredDescription: string;
  accent: SystemAccent;
  order: number;
  position: WorldPosition;
  interactionRadius: number;
  unlockAfter: SystemId | null;
  challenge: ChallengeDefinition;
}

export interface NearestSystemOptions {
  maxDistance?: number;
  restoredIds?: readonly string[];
  includeLocked?: boolean;
  includeRestored?: boolean;
}

export type ColliderKind = "structure" | "garden-bed" | "water" | "prop" | "robot";

export interface Collider {
  id: string;
  kind: ColliderKind;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ChallengeValidation {
  success: boolean;
  progress: number;
  message: string;
  fieldErrors?: Readonly<Record<string, string>>;
}

export interface WattchAnswer {
  value: number;
}

export interface WhispbookAnswer {
  steps: readonly string[];
}

export interface AgentCommerceAnswer {
  routes: Readonly<Record<string, readonly string[]>>;
}

export interface DevToolsAnswer {
  activated: readonly string[];
  testsPassed: boolean;
}

export interface GameState {
  phase: GamePhase;
  viewMode: ViewMode;
  requestedWebsiteSection: WebsiteSectionId | null;
  restoredIds: string[];
  endingSeen: boolean;
  activeSystemId: string | null;
  playerPosition: WorldPosition;
  input: InputState;
  settings: GameSettings;
  hasSave: boolean;
  notice: string | null;
}

export interface GameActions {
  enterBirdView: () => void;
  exitBirdView: () => void;
  toggleBirdView: () => void;
  requestWebsiteSection: (id: WebsiteSectionId) => void;
  consumeWebsiteSection: () => void;
  startNewGame: () => void;
  continueGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  inspectSystem: (id: string) => void;
  openSystem: (id: string) => void;
  closeSystem: () => void;
  submitChallenge: (id: string, answer: unknown) => ChallengeValidation;
  setPlayerPosition: (position: WorldPosition) => void;
  setInput: (input: InputAction, active: boolean) => void;
  setSettings: (settings: Partial<GameSettings>) => void;
  resetProgress: () => void;
  completeGame: () => void;
  setNotice: (notice: string | null) => void;
}

export type GameStore = GameState & GameActions;

export type Position = WorldPosition;
