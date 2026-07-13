import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { REFERENCE_QA_MODE, useGameStore } from "../store";
import { WEBSITE_MAP_BOUNDS, WEBSITE_SECTIONS } from "./generated/terminalDashboardMap";
import {
  getBirdHotspotActivationDelay,
  readOsReducedMotion,
  subscribeOsReducedMotion,
  type ReducedMotionMatchMedia
} from "./hotspots";

function browserMatchMedia(): ReducedMotionMatchMedia | undefined {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
  return window.matchMedia.bind(window) as ReducedMotionMatchMedia;
}

/** Bird-view-only scene hit targets; the DOM sections menu mirrors every action. */
export function WebsiteSectionHotspots() {
  const birdView = useGameStore((state) => state.viewMode === "bird");
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  const [osReducedMotion, setOsReducedMotion] = useState(() => readOsReducedMotion(browserMatchMedia()));
  const [interactive, setInteractive] = useState(false);
  const previousCursorRef = useRef<string | null>(null);
  const activationDelay = getBirdHotspotActivationDelay({
    birdView,
    reducedMotion: reducedMotion || osReducedMotion,
    deterministicQa: REFERENCE_QA_MODE
  });

  const resetCursor = useCallback(() => {
    if (typeof document === "undefined" || previousCursorRef.current === null) return;
    document.body.style.cursor = previousCursorRef.current;
    previousCursorRef.current = null;
  }, []);

  const showPointerCursor = useCallback(() => {
    if (typeof document === "undefined" || previousCursorRef.current !== null) return;
    previousCursorRef.current = document.body.style.cursor;
    document.body.style.cursor = "pointer";
  }, []);

  useLayoutEffect(() => {
    resetCursor();
    if (activationDelay === null) {
      setInteractive(false);
      return;
    }
    if (activationDelay === 0) {
      setInteractive(true);
      return;
    }
    setInteractive(false);
    const timer = globalThis.setTimeout(() => setInteractive(true), activationDelay);
    return () => {
      globalThis.clearTimeout(timer);
      resetCursor();
    };
  }, [activationDelay, resetCursor]);

  useEffect(() => resetCursor, [resetCursor]);
  useEffect(() => subscribeOsReducedMotion(browserMatchMedia(), setOsReducedMotion), []);

  const immediate = activationDelay === 0;
  if (!birdView || (!interactive && !immediate)) return null;

  return (
    <group name="website-section-hotspots" dispose={null}>
      {WEBSITE_SECTIONS.map((section) => {
        const width = section.worldBounds.maxX - section.worldBounds.minX;
        const depth = section.worldBounds.maxZ - section.worldBounds.minZ;
        const centerX = (section.worldBounds.minX + section.worldBounds.maxX) * 0.5;
        const centerZ = (section.worldBounds.minZ + section.worldBounds.maxZ) * 0.5;
        return (
          <mesh
            key={section.id}
            name={`website-section-${section.id}`}
            position={[centerX, WEBSITE_MAP_BOUNDS.maxY + 0.35, centerZ]}
            scale={[width, 0.12, depth]}
            renderOrder={20}
            onPointerOver={(event) => {
              event.stopPropagation();
              showPointerCursor();
            }}
            onPointerOut={(event) => {
              event.stopPropagation();
              resetCursor();
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              resetCursor();
              useGameStore.getState().requestWebsiteSection(section.id);
            }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}
