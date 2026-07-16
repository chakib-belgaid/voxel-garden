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

const VISIT_TRANSFER_STORAGE_KEY = "systems-garden:visit-transfer-bytes:v1";

let accumulateDocumentVisitBytes: VisitTransferredBytesAccumulator | null = null;

function readPreviousViewBytes(): number {
  try {
    return Number(window.sessionStorage.getItem(VISIT_TRANSFER_STORAGE_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function persistVisitBytes(bytes: number): void {
  try {
    window.sessionStorage.setItem(VISIT_TRANSFER_STORAGE_KEY, String(bytes));
  } catch {
    // The live measurement still works when session storage is unavailable.
  }
}

function getDocumentVisitAccumulator(): VisitTransferredBytesAccumulator {
  accumulateDocumentVisitBytes ??= createVisitTransferredBytesAccumulator(readPreviousViewBytes());
  return accumulateDocumentVisitBytes;
}

export function usePageFootprint(): TransferFootprint | null {
  const [footprint, setFootprint] = useState<TransferFootprint | null>(null);

  useEffect(() => {
    let animationFrame = 0;
    const timeouts: number[] = [];

    const measure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const visitBytes = getDocumentVisitAccumulator()(
          readPageTransferredBytes(window.performance)
        );
        persistVisitBytes(visitBytes);
        setFootprint(estimateTransferFootprint(visitBytes));
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
  }, []);

  return footprint;
}
