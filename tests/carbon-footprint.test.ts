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
import {
  parseModeTransferredBytes,
  updateModeTransferredBytes
} from "../src/sustainability/usePageFootprint";

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

  it("keeps cumulative transfer totals independent for each experience mode", () => {
    const ascii = createVisitTransferredBytesAccumulator();
    const live = createVisitTransferredBytesAccumulator();
    const game = createVisitTransferredBytesAccumulator();

    expect(ascii(60_000)).toBe(60_000);
    expect(live(240_000)).toBe(240_000);
    expect(game(1_800_000)).toBe(1_800_000);

    const cachedAsciiView = createVisitTransferredBytesAccumulator(60_000);
    expect(cachedAsciiView(0)).toBe(60_000);
    expect(cachedAsciiView(15_000)).toBe(75_000);
    expect(live(240_000)).toBe(240_000);
    expect(game(1_800_000)).toBe(1_800_000);
  });

  it("stores only validated totals and updates one mode without blending the others", () => {
    const stored = parseModeTransferredBytes(JSON.stringify({
      ascii: 75_000,
      live: 240_000.4,
      game: 1_800_000,
      ignored: 99,
      poisoned: "1000"
    }));

    expect(stored).toEqual({ ascii: 75_000, live: 240_000, game: 1_800_000 });
    expect(updateModeTransferredBytes(stored, "ascii", 90_000)).toEqual({
      ascii: 90_000,
      live: 240_000,
      game: 1_800_000
    });
    expect(parseModeTransferredBytes("not-json")).toEqual({});
  });

  it("formats the compact values shown by the meter", () => {
    expect(formatTransferSize(2_450_000)).toBe("2.45 MB");
    expect(formatCarbon(0.0425)).toBe("42.5 mg CO₂e");
    expect(formatCarbonAscii(0.0425)).toBe("42.5 mg CO2e");
    expect(formatEnergy(0.00042)).toBe("0.42 Wh");
  });
});
