import { useEffect, useState } from "react";
import {
  estimateTransferFootprint,
  readPageTransferredBytes,
  type TransferFootprint
} from "./footprint";

export function usePageFootprint(): TransferFootprint | null {
  const [footprint, setFootprint] = useState<TransferFootprint | null>(null);

  useEffect(() => {
    let animationFrame = 0;
    const timeouts: number[] = [];

    const measure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setFootprint(estimateTransferFootprint(readPageTransferredBytes(window.performance)));
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
