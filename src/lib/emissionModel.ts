/**
 * GreenCart emission estimates combine:
 * 1) Lifecycle intensity (farm + processing + packaging) — order-of-magnitude aligned with
 *    Poore & Nemecek, "Reducing food's environmental impacts through producers and consumers"
 *    (Science, 2018). Published figures are per-kg protein by category; we map to g CO₂e per kg
 *    product using typical protein fractions for grocery categories.
 * 2) Transport — tonne-km style factors (DEFRA 2024 / EPA SMART Freight order of magnitude):
 *    truck ~60–80, rail ~20–30, sea ~10–20, air ~500–1200 g CO₂e per t·km (simplified midpoints).
 *
 * For production, swap Open Food Facts category tags + this model for Agribalyse / EXIOBASE
 * when you add a backend.
 */

import type { ScannedItem } from "@/data/mockData";

export type TransportMode = ScannedItem["transport"];

/** Midpoint g CO₂e per tonne-km (short-haul truck / deep-sea / air cargo — illustrative). */
export const TONNE_KM_G: Record<TransportMode, number> = {
  truck: 72,
  rail: 25,
  ship: 15,
  air: 600,
};

/** Base lifecycle g CO₂e per kg product (retail), before distance — heuristic by aisle. */
const CATEGORY_BASE_G_PER_KG: Record<ScannedItem["category"], number> = {
  fruit: 900,
  vegetable: 550,
  meat: 18500,
  dairy: 3400,
  grain: 1800,
  packaged: 2800,
  bakery: 900,
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Guess transport from great-circle distance and whether origin is overseas from user. */
export function inferTransport(
  distanceKm: number,
  sameCountry: boolean,
  category: ScannedItem["category"]
): TransportMode {
  if (distanceKm < 400 && sameCountry) return "truck";
  if (sameCountry && distanceKm < 2000) return distanceKm > 800 ? "rail" : "truck";
  if (!sameCountry && distanceKm > 6000) {
    if (category === "meat" || category === "fruit") return "air";
    return "ship";
  }
  if (!sameCountry) return "ship";
  return "truck";
}

export interface EmissionEstimateInput {
  category: ScannedItem["category"];
  massKg: number;
  distanceKm: number;
  transport: TransportMode;
  sameCountry: boolean;
}

/** Returns total g CO₂e and a four-part breakdown (percentages sum ~100). */
export function estimateItemEmissions(input: EmissionEstimateInput): {
  totalG: number;
  breakdown: ScannedItem["breakdown"];
} {
  const base = CATEGORY_BASE_G_PER_KG[input.category] * input.massKg;
  const tkm = (input.massKg * input.distanceKm) / 1000;
  const transportG = TONNE_KM_G[input.transport] * tkm;
  const processing = input.category === "packaged" || input.category === "bakery" ? 0.22 : 0.12;
  const packaging = input.category === "packaged" ? 0.18 : 0.1;
  const farm = Math.max(0.35, 1 - processing - packaging - 0.25);
  const farmRest = base * farm;
  const procRest = base * processing;
  const packRest = base * packaging;
  const total = farmRest + procRest + packRest + transportG;
  const trPct = Math.round((transportG / total) * 100);
  const farmPct = Math.round((farmRest / total) * 100);
  const procPct = Math.round((procRest / total) * 100);
  const packPct = Math.max(0, 100 - trPct - farmPct - procPct);
  return {
    totalG: Math.round(total),
    breakdown: {
      farming: farmPct,
      processing: procPct,
      transport: trPct,
      packaging: packPct,
    },
  };
}

export function distanceFromCoords(
  user: { lat: number; lng: number } | null | undefined,
  origin: { lat: number; lng: number } | null | undefined
): number {
  if (
    !user ||
    !origin ||
    typeof user.lat !== "number" ||
    typeof origin.lat !== "number" ||
    Number.isNaN(user.lat) ||
    Number.isNaN(origin.lat)
  ) {
    return 0;
  }
  return Math.round(haversineKm(user.lat, user.lng, origin.lat, origin.lng));
}
