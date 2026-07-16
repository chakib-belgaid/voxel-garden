import { co2 } from "@tgwf/co2";
import { estimateTransferEnergy, type TransferEnergy } from "./transfer-energy";

export {
  formatEnergy,
  formatTransferSize,
  readPageTransferredBytes,
  sumTransferredBytes
} from "./transfer-energy";

const carbonCalculator = new co2({ model: "swd", version: 4 });

export interface TransferFootprint extends TransferEnergy {
  readonly co2Grams: number;
}

export function estimateTransferFootprint(rawBytes: number): TransferFootprint {
  const transfer = estimateTransferEnergy(rawBytes);
  const result = carbonCalculator.perByte(transfer.bytes, false);
  const co2Grams = typeof result === "number" ? result : result.total;

  return {
    ...transfer,
    co2Grams,
  };
}

export function formatCarbon(co2Grams: number): string {
  if (co2Grams <= 0) return "0 mg CO₂e";
  if (co2Grams < 0.1) return `${(co2Grams * 1_000).toFixed(1)} mg CO₂e`;
  return `${co2Grams.toFixed(co2Grams < 10 ? 3 : 2)} g CO₂e`;
}

export function formatCarbonAscii(co2Grams: number): string {
  if (co2Grams <= 0) return "0 mg CO2e";
  if (co2Grams < 0.1) return `${(co2Grams * 1_000).toFixed(1)} mg CO2e`;
  return `${co2Grams.toFixed(co2Grams < 10 ? 3 : 2)} g CO2e`;
}
