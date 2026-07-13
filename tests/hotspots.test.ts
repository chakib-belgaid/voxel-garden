import { describe, expect, it, vi } from "vitest";
import {
  BIRD_HOTSPOT_TRANSITION_MS,
  REDUCED_MOTION_MEDIA_QUERY,
  getBirdHotspotActivationDelay,
  readOsReducedMotion,
  subscribeOsReducedMotion,
  type ReducedMotionMediaQueryList
} from "../src/game/world/hotspots";

describe("bird-view scene hotspot activation", () => {
  it("waits for the normal camera transition and resets on exit", () => {
    expect(getBirdHotspotActivationDelay({
      birdView: true,
      reducedMotion: false,
      deterministicQa: false
    })).toBe(BIRD_HOTSPOT_TRANSITION_MS);
    expect(getBirdHotspotActivationDelay({
      birdView: false,
      reducedMotion: false,
      deterministicQa: false
    })).toBeNull();
  });

  it("enables immediately for reduced motion and deterministic reference QA", () => {
    expect(getBirdHotspotActivationDelay({
      birdView: true,
      reducedMotion: true,
      deterministicQa: false
    })).toBe(0);
    expect(getBirdHotspotActivationDelay({
      birdView: true,
      reducedMotion: false,
      deterministicQa: true
    })).toBe(0);
  });

  it("reads, observes, and cleans up the OS reduced-motion media query", () => {
    let listener: ((event: { matches: boolean }) => void) | null = null;
    const addEventListener = vi.fn((_type: "change", next: (event: { matches: boolean }) => void) => {
      listener = next;
    });
    const removeEventListener = vi.fn((_type: "change", previous: (event: { matches: boolean }) => void) => {
      expect(previous).toBe(listener);
    });
    const media: ReducedMotionMediaQueryList = {
      matches: true,
      addEventListener,
      removeEventListener
    };
    const matchMedia = vi.fn(() => media);
    const changes: boolean[] = [];

    expect(readOsReducedMotion(matchMedia)).toBe(true);
    const cleanup = subscribeOsReducedMotion(matchMedia, (reduced) => changes.push(reduced));
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_MEDIA_QUERY);
    expect(changes).toEqual([true]);
    expect(listener).not.toBeNull();
    (listener as ((event: { matches: boolean }) => void) | null)?.({ matches: false });
    expect(changes).toEqual([true, false]);
    cleanup();
    expect(removeEventListener).toHaveBeenCalledOnce();
  });
});
