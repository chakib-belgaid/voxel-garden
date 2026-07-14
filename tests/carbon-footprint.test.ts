import { describe, expect, it } from "vitest";
import {
  estimateTransferFootprint,
  formatCarbon,
  formatEnergy,
  formatTransferSize,
  sumTransferredBytes
} from "../src/sustainability/footprint";

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

  it("formats the compact values shown by the meter", () => {
    expect(formatTransferSize(2_450_000)).toBe("2.45 MB");
    expect(formatCarbon(0.0425)).toBe("42.5 mg CO₂e");
    expect(formatEnergy(0.00042)).toBe("0.42 Wh");
  });
});
