import type { ViewMode } from "../types";
import type { WebsiteMapBounds } from "./map/schema";

export const EXPLORE_CAMERA_MIN_DISTANCE = 6.5;
export const EXPLORE_CAMERA_MAX_DISTANCE = 16;
export const BIRD_VIEW_FOV = 18;
export const BIRD_VIEW_PADDING = 0.08;
export const BIRD_VIEW_TRANSITION_SECONDS = 0.9;
export const BIRD_VIEW_ENTER_INTENT = 1.5;
export const BIRD_VIEW_EXIT_INTENT = 0.75;
export const CAMERA_UNITS_PER_WHEEL_PIXEL = 0.012;
export const WHEEL_PIXELS_PER_LINE = 16;
export const DEFAULT_WHEEL_PAGE_PIXELS = 800;

export const WHEEL_DELTA_MODE = Object.freeze({
  pixel: 0,
  line: 1,
  page: 2
} as const);

export interface BirdViewCameraFit {
  readonly centerX: number;
  readonly centerZ: number;
  readonly targetY: number;
  readonly distance: number;
  readonly positionY: number;
  readonly far: number;
  readonly fogNear: number;
  readonly fogFar: number;
}

/**
 * Fits a flat, north-up map inside a perspective frustum. The usable fraction
 * leaves the requested padding on every viewport edge, and the camera targets
 * the map's highest authored plane so lower terrain can only gain clearance.
 */
export function calculateBirdViewCameraFit(
  bounds: WebsiteMapBounds,
  aspect: number,
  fovDegrees = BIRD_VIEW_FOV,
  padding = BIRD_VIEW_PADDING
): BirdViewCameraFit {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const safeFov = Math.min(120, Math.max(1, fovDegrees));
  const safePadding = Math.min(0.24, Math.max(0, padding));
  const usableFraction = 1 - safePadding * 2;
  const halfWidth = Math.max(0.5, (bounds.maxX - bounds.minX) / 2);
  const halfDepth = Math.max(0.5, (bounds.maxZ - bounds.minZ) / 2);
  const verticalTangent = Math.tan((safeFov * Math.PI) / 360);
  const horizontalTangent = verticalTangent * safeAspect;
  const distanceForWidth = halfWidth / (horizontalTangent * usableFraction);
  const distanceForDepth = halfDepth / (verticalTangent * usableFraction);
  const distance = Math.max(distanceForWidth, distanceForDepth);
  const elevationRange = Math.max(0, bounds.maxY - bounds.minY);
  const mapDiagonal = Math.hypot(halfWidth * 2, halfDepth * 2);

  return {
    centerX: bounds.center.x,
    centerZ: bounds.center.z,
    targetY: bounds.maxY,
    distance,
    positionY: bounds.maxY + distance,
    far: Math.max(210, distance * 2.4 + elevationRange),
    fogNear: Math.max(180, distance * 1.15),
    fogFar: Math.max(520, distance * 2.2 + mapDiagonal * 0.25)
  };
}

export interface CameraWheelIntentState {
  readonly outward: number;
  readonly inward: number;
}

export interface CameraWheelResult {
  readonly distance: number;
  readonly intent: CameraWheelIntentState;
  readonly action: "none" | "enter-bird" | "exit-bird";
}

export const EMPTY_CAMERA_WHEEL_INTENT: CameraWheelIntentState = Object.freeze({
  outward: 0,
  inward: 0
});

export interface CameraWheelEventLike {
  readonly deltaY: number;
  readonly deltaMode: number;
  readonly ctrlKey: boolean;
  preventDefault(): void;
}

/** Converts every native WheelEvent delta mode into camera-distance units. */
export function normalizeCameraWheelDelta(
  deltaY: number,
  deltaMode: number,
  pagePixels = DEFAULT_WHEEL_PAGE_PIXELS
): number {
  if (!Number.isFinite(deltaY)) return 0;
  const safePagePixels = Number.isFinite(pagePixels) && pagePixels > 0
    ? pagePixels
    : DEFAULT_WHEEL_PAGE_PIXELS;
  const pixelDelta = deltaMode === WHEEL_DELTA_MODE.line
    ? deltaY * WHEEL_PIXELS_PER_LINE
    : deltaMode === WHEEL_DELTA_MODE.page
      ? deltaY * safePagePixels
      : deltaY;
  return pixelDelta * CAMERA_UNITS_PER_WHEEL_PIXEL;
}

/**
 * Applies a normalized wheel delta (the existing wheel delta multiplied by
 * 0.012). Separate entry and exit accumulators provide trackpad hysteresis.
 */
export function reduceCameraWheel(
  viewMode: ViewMode,
  currentDistance: number,
  normalizedDelta: number,
  intent: CameraWheelIntentState = EMPTY_CAMERA_WHEEL_INTENT
): CameraWheelResult {
  const delta = Number.isFinite(normalizedDelta) ? normalizedDelta : 0;
  const distance = Math.min(
    EXPLORE_CAMERA_MAX_DISTANCE,
    Math.max(EXPLORE_CAMERA_MIN_DISTANCE, currentDistance)
  );

  if (viewMode === "bird") {
    if (delta >= 0) {
      return {
        distance,
        intent: EMPTY_CAMERA_WHEEL_INTENT,
        action: "none"
      };
    }
    const inward = intent.inward + Math.abs(delta);
    return {
      distance,
      intent: inward >= BIRD_VIEW_EXIT_INTENT
        ? EMPTY_CAMERA_WHEEL_INTENT
        : { outward: 0, inward },
      action: inward >= BIRD_VIEW_EXIT_INTENT ? "exit-bird" : "none"
    };
  }

  if (delta <= 0) {
    return {
      distance: Math.max(EXPLORE_CAMERA_MIN_DISTANCE, distance + delta),
      intent: EMPTY_CAMERA_WHEEL_INTENT,
      action: "none"
    };
  }

  const unclampedDistance = distance + delta;
  const nextDistance = Math.min(EXPLORE_CAMERA_MAX_DISTANCE, unclampedDistance);
  const overflow = Math.max(0, unclampedDistance - EXPLORE_CAMERA_MAX_DISTANCE);
  const outward = overflow > 0 ? intent.outward + overflow : 0;
  return {
    distance: nextDistance,
    intent: outward >= BIRD_VIEW_ENTER_INTENT
      ? EMPTY_CAMERA_WHEEL_INTENT
      : { outward, inward: 0 },
    action: outward >= BIRD_VIEW_ENTER_INTENT ? "enter-bird" : "none"
  };
}

/**
 * Browser integration boundary for the pure reducer. Ctrl+wheel is reserved
 * for browser zoom and trackpad pinch, so it remains completely untouched.
 */
export function processCameraWheelEvent(
  event: CameraWheelEventLike,
  viewMode: ViewMode,
  currentDistance: number,
  intent: CameraWheelIntentState = EMPTY_CAMERA_WHEEL_INTENT,
  pagePixels = DEFAULT_WHEEL_PAGE_PIXELS
): CameraWheelResult | null {
  if (event.ctrlKey) return null;
  event.preventDefault();
  return reduceCameraWheel(
    viewMode,
    currentDistance,
    normalizeCameraWheelDelta(event.deltaY, event.deltaMode, pagePixels),
    intent
  );
}

export function shouldUseImmediateCameraMotion(
  savedReducedMotion: boolean,
  prefersReducedMotion: boolean,
  referenceQaMode: boolean
): boolean {
  return savedReducedMotion || prefersReducedMotion || referenceQaMode;
}

export function smoothCameraTransition(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return t * t * (3 - 2 * t);
}
