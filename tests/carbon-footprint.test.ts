import { describe, expect, it } from "vitest";
import {
  estimateTransferFootprint,
  formatCarbon,
  formatCarbonAscii,
  formatEnergy,
  formatTransferSize,
  sumTransferredBytes
} from "../src/sustainability/footprint";
import { createVisitTransferredBytesAccumulator } from "../src/sustainability/transfer-energy";

describe("CO2.js page footprint model", () => {
  it("uses SWDM v4 to estimate carbon and energy from transferred bytes", () => {
    const footprint = estimateTransferFootprint(1_000_000_000);

    expect(footprint.bytes).toBe(1_000_000_000);
    expect(footprint.co2Grams).toBeCloseTo(148.2, 5);
    expect(footprint.energyKwh).toBeCloseTo(0.3, 8);
  });

  it("sums only finite positive transfer sizes", () => {
    expect(sumTransferredBytes([
      { transferSize: 1_024 },
      { transferSize: 2_048 },
      { transferSize: 0 },
      { transferSize: -1 },
      { transferSize: Number.NaN }
    ])).toBe(3_072);
  });

  it("preserves the visit total when switching to a cached view", () => {
    const firstView = createVisitTransferredBytesAccumulator();
    expect(firstView(180_000)).toBe(180_000);
    expect(firstView(240_000)).toBe(240_000);
    expect(firstView(240_000)).toBe(240_000);

    const cachedNextView = createVisitTransferredBytesAccumulator(240_000);
    expect(cachedNextView(0)).toBe(240_000);
    expect(cachedNextView(60_000)).toBe(300_000);
  });

  it("formats the compact values shown by the meter", () => {
    expect(formatTransferSize(2_450_000)).toBe("2.45 MB");
    expect(formatCarbon(0.0425)).toBe("42.5 mg CO₂e");
    expect(formatCarbonAscii(0.0425)).toBe("42.5 mg CO2e");
    expect(formatEnergy(0.00042)).toBe("0.42 Wh");
  });
});
