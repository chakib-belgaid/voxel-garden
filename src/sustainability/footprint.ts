import { co2 } from "@tgwf/co2";

const BYTES_PER_GIGABYTE = 1_000_000_000;

// SWDM v4 models 0.194 kWh of operational energy and 0.106 kWh of
// embodied energy per GB transferred across device, network and data centre.
const SWDM_V4_KWH_PER_GIGABYTE = 0.3;

const carbonCalculator = new co2({ model: "swd", version: 4 });

export interface TransferFootprint {
  readonly bytes: number;
  readonly co2Grams: number;
  readonly energyKwh: number;
}

interface TransferEntry {
  readonly transferSize?: number;
}

function finitePositive(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

export function sumTransferredBytes(entries: readonly TransferEntry[]): number {
  return Math.round(entries.reduce((total, entry) => total + finitePositive(entry.transferSize), 0));
}

export function readPageTransferredBytes(source: Pick<Performance, "getEntriesByType">): number {
  const navigation = source.getEntriesByType("navigation") as unknown as TransferEntry[];
  const resources = source.getEntriesByType("resource") as unknown as TransferEntry[];
  return sumTransferredBytes([...navigation, ...resources]);
}

export function estimateTransferFootprint(rawBytes: number): TransferFootprint {
  const bytes = finitePositive(rawBytes);
  const result = carbonCalculator.perByte(bytes, false);
  const co2Grams = typeof result === "number" ? result : result.total;

  return {
    bytes,
    co2Grams,
    energyKwh: (bytes / BYTES_PER_GIGABYTE) * SWDM_V4_KWH_PER_GIGABYTE
  };
}

export function formatTransferSize(bytes: number): string {
  if (bytes < 1_000) return `${Math.round(bytes)} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(bytes < 10_000 ? 1 : 0)} kB`;
  return `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 2 : 1)} MB`;
}

export function formatCarbon(co2Grams: number): string {
  if (co2Grams <= 0) return "0 mg CO₂e";
  if (co2Grams < 0.1) return `${(co2Grams * 1_000).toFixed(1)} mg CO₂e`;
  return `${co2Grams.toFixed(co2Grams < 10 ? 3 : 2)} g CO₂e`;
}

export function formatEnergy(energyKwh: number): string {
  const wattHours = energyKwh * 1_000;
  if (wattHours <= 0) return "0 Wh";
  if (wattHours < 0.1) return `${(wattHours * 1_000).toFixed(1)} mWh`;
  return `${wattHours.toFixed(wattHours < 10 ? 2 : 1)} Wh`;
}
