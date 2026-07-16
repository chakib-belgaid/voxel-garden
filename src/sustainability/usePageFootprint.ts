import { useEffect, useState } from "react";
import {
  estimateTransferFootprint,
  readPageTransferredBytes,
  type TransferFootprint
} from "./footprint";
import {
  createVisitTransferredBytesAccumulator,
  type VisitTransferredBytesAccumulator
} from "./transfer-energy";
import type { ExperienceMode } from "./ExperienceModeSwitch";

const MODE_TRANSFER_STORAGE_KEY = "systems-garden:mode-transfer-bytes:v1";
const EXPERIENCE_MODES: readonly ExperienceMode[] = ["ascii", "live", "game"];

export type ModeTransferredBytes = Partial<Record<ExperienceMode, number>>;

export interface PageFootprintSnapshot {
  readonly current: TransferFootprint | null;
  readonly byMode: Readonly<Partial<Record<ExperienceMode, TransferFootprint>>>;
}

const documentAccumulators = new Map<ExperienceMode, VisitTransferredBytesAccumulator>();

export function parseModeTransferredBytes(raw: string | null): ModeTransferredBytes {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const result: ModeTransferredBytes = {};
    for (const mode of EXPERIENCE_MODES) {
      const value = (parsed as Record<string, unknown>)[mode];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        result[mode] = Math.round(value);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function updateModeTransferredBytes(
  current: ModeTransferredBytes,
  mode: ExperienceMode,
  bytes: number
): ModeTransferredBytes {
  return { ...current, [mode]: Math.max(0, Math.round(bytes)) };
}

function readModeBytes(): ModeTransferredBytes {
  try {
    return parseModeTransferredBytes(
      window.sessionStorage.getItem(MODE_TRANSFER_STORAGE_KEY)
    );
  } catch {
    return {};
  }
}

function persistModeBytes(mode: ExperienceMode, bytes: number): ModeTransferredBytes {
  const totals = updateModeTransferredBytes(readModeBytes(), mode, bytes);
  try {
    window.sessionStorage.setItem(MODE_TRANSFER_STORAGE_KEY, JSON.stringify(totals));
  } catch {
    // The live measurement still works when session storage is unavailable.
  }
  return totals;
}

function getDocumentModeAccumulator(mode: ExperienceMode): VisitTransferredBytesAccumulator {
  const existing = documentAccumulators.get(mode);
  if (existing) return existing;

  const accumulator = createVisitTransferredBytesAccumulator(readModeBytes()[mode] ?? 0);
  documentAccumulators.set(mode, accumulator);
  return accumulator;
}

function estimateModes(bytesByMode: ModeTransferredBytes): PageFootprintSnapshot["byMode"] {
  return Object.fromEntries(
    EXPERIENCE_MODES.flatMap((mode) => {
      const bytes = bytesByMode[mode];
      return bytes === undefined ? [] : [[mode, estimateTransferFootprint(bytes)]];
    })
  );
}

export function usePageFootprint(mode: ExperienceMode = "live"): PageFootprintSnapshot {
  const [snapshot, setSnapshot] = useState<PageFootprintSnapshot>({
    current: null,
    byMode: {}
  });

  useEffect(() => {
    let animationFrame = 0;
    const timeouts: number[] = [];

    const measure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const modeBytes = getDocumentModeAccumulator(mode)(
          readPageTransferredBytes(window.performance)
        );
        const totals = persistModeBytes(mode, modeBytes);
        setSnapshot({
          current: estimateTransferFootprint(modeBytes),
          byMode: estimateModes(totals)
        });
      });
    };

    measure();
    window.addEventListener("load", measure);
    timeouts.push(window.setTimeout(measure, 250), window.setTimeout(measure, 1_500));

    let observer: PerformanceObserver | null = null;
    if ("PerformanceObserver" in window) {
      observer = new PerformanceObserver(measure);
      try {
        observer.observe({ type: "resource", buffered: true });
      } catch {
        observer.observe({ entryTypes: ["resource"] });
      }
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      window.removeEventListener("load", measure);
      observer?.disconnect();
    };
  }, [mode]);

  return snapshot;
}
