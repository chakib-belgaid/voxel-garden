import { describe, expect, it } from "vitest";
import type { WebsiteMapBounds } from "../src/game/world/map/schema";
import {
  BIRD_VIEW_ENTER_INTENT,
  BIRD_VIEW_EXIT_INTENT,
  BIRD_VIEW_FOV,
  BIRD_VIEW_PADDING,
  CAMERA_UNITS_PER_WHEEL_PIXEL,
  DEFAULT_WHEEL_PAGE_PIXELS,
  EMPTY_CAMERA_WHEEL_INTENT,
  EXPLORE_CAMERA_MAX_DISTANCE,
  WHEEL_DELTA_MODE,
  WHEEL_PIXELS_PER_LINE,
  calculateBirdViewCameraFit,
  normalizeCameraWheelDelta,
  processCameraWheelEvent,
  reduceCameraWheel,
  shouldUseImmediateCameraMotion,
  smoothCameraTransition
} from "../src/game/world/camera";

const MAP_BOUNDS: WebsiteMapBounds = {
  minX: -128,
  maxX: 128,
  minZ: -72,
  maxZ: 72,
  minY: 0,
  maxY: 3.15,
  center: { x: 0, z: 0 }
};

function visibleHalfExtents(distance: number, aspect: number) {
  const vertical = Math.tan((BIRD_VIEW_FOV * Math.PI) / 360) * distance;
  return { vertical, horizontal: vertical * aspect };
}

describe("bird-view camera fit", () => {
  it("fits the whole island with eight-percent padding on a desktop viewport", () => {
    const aspect = 1.5;
    const fit = calculateBirdViewCameraFit(MAP_BOUNDS, aspect);
    const visible = visibleHalfExtents(fit.distance, aspect);
    const usable = 1 - BIRD_VIEW_PADDING * 2;

    expect(128).toBeLessThanOrEqual(visible.horizontal * usable);
    expect(72).toBeLessThanOrEqual(visible.vertical * usable);
    expect(fit.centerX).toBe(0);
    expect(fit.centerZ).toBe(0);
    expect(fit.positionY).toBeGreaterThan(MAP_BOUNDS.maxY);
  });

  it("uses width as the limiting dimension in portrait", () => {
    const portrait = calculateBirdViewCameraFit(MAP_BOUNDS, 390 / 844);
    const landscape = calculateBirdViewCameraFit(MAP_BOUNDS, 1536 / 1024);
    const visible = visibleHalfExtents(portrait.distance, 390 / 844);

    expect(portrait.distance).toBeGreaterThan(landscape.distance);
    expect(visible.horizontal * (1 - BIRD_VIEW_PADDING * 2)).toBeCloseTo(128, 8);
    expect(portrait.far).toBeGreaterThan(portrait.distance);
    expect(portrait.fogNear).toBeGreaterThan(portrait.distance);
  });

  it("smooths a 0..1 transition without overshoot", () => {
    expect(smoothCameraTransition(-1)).toBe(0);
    expect(smoothCameraTransition(0.5)).toBe(0.5);
    expect(smoothCameraTransition(2)).toBe(1);
  });
});

describe("bird-view wheel hysteresis", () => {
  it("requires 1.5 units of outward intent after reaching maximum zoom", () => {
    let result = reduceCameraWheel("explore", EXPLORE_CAMERA_MAX_DISTANCE, 0.7);
    expect(result.action).toBe("none");
    expect(result.intent.outward).toBeCloseTo(0.7);

    result = reduceCameraWheel("explore", result.distance, BIRD_VIEW_ENTER_INTENT - 0.71, result.intent);
    expect(result.action).toBe("none");

    result = reduceCameraWheel("explore", result.distance, 0.02, result.intent);
    expect(result.action).toBe("enter-bird");
    expect(result.intent).toEqual(EMPTY_CAMERA_WHEEL_INTENT);
  });

  it("resets outward intent when the wheel direction reverses", () => {
    const outward = reduceCameraWheel("explore", EXPLORE_CAMERA_MAX_DISTANCE, 1);
    const reversed = reduceCameraWheel("explore", outward.distance, -0.1, outward.intent);
    const outwardAgain = reduceCameraWheel("explore", EXPLORE_CAMERA_MAX_DISTANCE, 0.6, reversed.intent);

    expect(reversed.intent).toEqual(EMPTY_CAMERA_WHEEL_INTENT);
    expect(outwardAgain.action).toBe("none");
    expect(outwardAgain.intent.outward).toBeCloseTo(0.6);
  });

  it("requires a separate 0.75-unit inward gesture to leave bird view", () => {
    let result = reduceCameraWheel("bird", EXPLORE_CAMERA_MAX_DISTANCE, -0.4);
    expect(result.action).toBe("none");
    expect(result.intent.inward).toBeCloseTo(0.4);

    result = reduceCameraWheel(
      "bird",
      result.distance,
      -(BIRD_VIEW_EXIT_INTENT - 0.39),
      result.intent
    );
    expect(result.action).toBe("exit-bird");
    expect(result.intent).toEqual(EMPTY_CAMERA_WHEEL_INTENT);
  });
});

describe("native wheel normalization", () => {
  it("normalizes pixel, line, and page deltas into the same camera units", () => {
    expect(normalizeCameraWheelDelta(100, WHEEL_DELTA_MODE.pixel)).toBeCloseTo(
      100 * CAMERA_UNITS_PER_WHEEL_PIXEL
    );
    expect(normalizeCameraWheelDelta(3, WHEEL_DELTA_MODE.line)).toBeCloseTo(
      3 * WHEEL_PIXELS_PER_LINE * CAMERA_UNITS_PER_WHEEL_PIXEL
    );
    expect(normalizeCameraWheelDelta(1, WHEEL_DELTA_MODE.page, 720)).toBeCloseTo(
      720 * CAMERA_UNITS_PER_WHEEL_PIXEL
    );
  });

  it("uses a stable page fallback and rejects non-finite input", () => {
    expect(normalizeCameraWheelDelta(1, WHEEL_DELTA_MODE.page, 0)).toBeCloseTo(
      DEFAULT_WHEEL_PAGE_PIXELS * CAMERA_UNITS_PER_WHEEL_PIXEL
    );
    expect(normalizeCameraWheelDelta(Number.NaN, WHEEL_DELTA_MODE.pixel)).toBe(0);
  });

  it("feeds normalized native events into the existing hysteresis reducer", () => {
    let prevented = false;
    const result = processCameraWheelEvent(
      {
        deltaY: 3,
        deltaMode: WHEEL_DELTA_MODE.line,
        ctrlKey: false,
        preventDefault: () => { prevented = true; }
      },
      "explore",
      EXPLORE_CAMERA_MAX_DISTANCE
    );

    expect(prevented).toBe(true);
    expect(result?.action).toBe("none");
    expect(result?.intent.outward).toBeCloseTo(
      3 * WHEEL_PIXELS_PER_LINE * CAMERA_UNITS_PER_WHEEL_PIXEL
    );
  });

  it("passes Ctrl+wheel browser zoom and trackpad pinch through untouched", () => {
    let prevented = false;
    const result = processCameraWheelEvent(
      {
        deltaY: 300,
        deltaMode: WHEEL_DELTA_MODE.pixel,
        ctrlKey: true,
        preventDefault: () => { prevented = true; }
      },
      "explore",
      EXPLORE_CAMERA_MAX_DISTANCE,
      { outward: 1.4, inward: 0 }
    );

    expect(result).toBeNull();
    expect(prevented).toBe(false);
  });
});

describe("reduced camera motion", () => {
  it("snaps for either the saved setting, OS preference, or deterministic QA", () => {
    expect(shouldUseImmediateCameraMotion(false, false, false)).toBe(false);
    expect(shouldUseImmediateCameraMotion(true, false, false)).toBe(true);
    expect(shouldUseImmediateCameraMotion(false, true, false)).toBe(true);
    expect(shouldUseImmediateCameraMotion(false, false, true)).toBe(true);
  });
});
