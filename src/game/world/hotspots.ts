export const BIRD_HOTSPOT_TRANSITION_MS = 900;
export const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

export interface ReducedMotionMediaQueryList {
  readonly matches: boolean;
  addEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
  removeEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
  addListener?: (listener: (event: { matches: boolean }) => void) => void;
  removeListener?: (listener: (event: { matches: boolean }) => void) => void;
}

export type ReducedMotionMatchMedia = (query: string) => ReducedMotionMediaQueryList;

export function readOsReducedMotion(matchMedia?: ReducedMotionMatchMedia): boolean {
  return matchMedia?.(REDUCED_MOTION_MEDIA_QUERY).matches ?? false;
}

/** Subscribes to the OS preference and supports both modern and legacy MediaQueryList APIs. */
export function subscribeOsReducedMotion(
  matchMedia: ReducedMotionMatchMedia | undefined,
  onChange: (reduced: boolean) => void
): () => void {
  if (!matchMedia) return () => undefined;
  const query = matchMedia(REDUCED_MOTION_MEDIA_QUERY);
  const handleChange = (event: { matches: boolean }) => onChange(event.matches);
  onChange(query.matches);
  if (query.addEventListener && query.removeEventListener) {
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener?.("change", handleChange);
  }
  query.addListener?.(handleChange);
  return () => query.removeListener?.(handleChange);
}

export interface BirdHotspotActivationState {
  birdView: boolean;
  reducedMotion: boolean;
  deterministicQa: boolean;
}

/** Null means disabled; zero enables immediately; otherwise wait for the camera transition. */
export function getBirdHotspotActivationDelay({
  birdView,
  reducedMotion,
  deterministicQa
}: Readonly<BirdHotspotActivationState>): number | null {
  if (!birdView) return null;
  return reducedMotion || deterministicQa ? 0 : BIRD_HOTSPOT_TRANSITION_MS;
}
