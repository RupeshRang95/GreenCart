import type { ScannedItem } from "@/data/mockData";
import { userData, userLocation } from "@/data/mockData";
import { USER_HOME_COUNTRY_KEY } from "@/lib/region";
import { coordsForCountryOrDefault } from "@/lib/countryCoords";
import {
  distanceFromCoords,
  estimateItemEmissions,
  inferTransport,
} from "@/lib/emissionModel";
import {
  categoryFromOffTags,
  countryFromProduct,
  parseMassKg,
  searchProducts,
  type OFFProduct,
  type OFFSearchHit,
} from "@/services/openFoodFacts";
import {
  cleanGroceryLineName,
  grocerySearchVariants,
  inferCategoryFromName,
} from "@/lib/receiptLineNormalize";
import { resolveBarcodeToProduct } from "@/services/barcodeResolver";
import { searchUsdaBrandedByName } from "@/services/usdaFdc";
import { resolveProductOrigin } from "@/lib/brandOriginDb";

const USER_COUNTRY = USER_HOME_COUNTRY_KEY;

function itemEsgFromCo2(co2g: number): number {
  return Math.max(
    12,
    Math.min(98, Math.round(100 - Math.log10(co2g + 10) * 28)),
  );
}

function offToItemBase(
  p: OFFProduct | OFFSearchHit,
  price: number,
): {
  name: string;
  brand?: string;
  category: ScannedItem["category"];
  massKg: number;
  countryKey: string | null;
} {
  const name = (p.product_name || "Grocery item").trim().slice(0, 60);
  const brand =
    "brands" in p && p.brands ? p.brands.split(",")[0]?.trim() : undefined;
  const category = categoryFromOffTags(p.categories_tags);
  const massKg = parseMassKg(p.quantity);
  const countryRaw = countryFromProduct(p);
  const countryKey = countryRaw
    ? countryRaw.toLowerCase().replace(/-/g, " ").trim()
    : null;
  return { name, brand, category, massKg, countryKey };
}

export async function itemFromBarcode(
  barcode: string,
  priceFallback = 2.99,
): Promise<ScannedItem | null> {
  const p = await resolveBarcodeToProduct(barcode);
  if (!p) return null;
  const code = p.code.replace(/\D/g, "") || barcode.replace(/\D/g, "");
  return buildScannedItemFromOff(p, priceFallback, `bc-${code}`, code);
}

function buildScannedItemFromOff(
  p: OFFProduct | OFFSearchHit,
  price: number,
  id: string,
  barcode?: string,
): ScannedItem {
  const base = offToItemBase(p, price);

  // Use Open Food Facts country if available; otherwise check our brand origin DB
  let resolvedCountry = base.countryKey;
  let resolvedRegion: string | undefined;
  let resolvedTransport: ScannedItem["transport"] | undefined;

  // 🔥 ALWAYS try to improve origin using your DB (even if OFF says "Canada")
  const known = resolveProductOrigin(base.name, base.brand);

  let geo;

  if (known) {
    geo = {
      country: known.country,
      flag: known.flag,
      lat: known.lat,
      lng: known.lng,
    };
    resolvedCountry = known.country.toLowerCase();
    resolvedRegion = known.region;
    resolvedTransport = known.transport;
  } else {
    geo = coordsForCountryOrDefault(base.countryKey?.trim() || undefined);
  }

  const sameCountry = !resolvedCountry || resolvedCountry === USER_COUNTRY;
  const dist = distanceFromCoords(userLocation, geo);
  const transport =
    resolvedTransport ?? inferTransport(dist, sameCountry, base.category);
  const { totalG, breakdown } = estimateItemEmissions({
    category: base.category,
    massKg: base.massKg,
    distanceKm: dist,
    transport,
    sameCountry,
  });

  // Pick the most specific region available
  const region =
    resolvedRegion || (resolvedCountry === "canada" ? "Ontario" : geo.country);
  const inSeason =
    base.category === "fruit" || base.category === "vegetable"
      ? sameCountry
      : true;

  let localAlt: ScannedItem["localAlt"] | undefined;
  if (!sameCountry && dist > 400) {
    localAlt = {
      name: `Local ${base.name.split(" ").slice(-2).join(" ") || "alternative"}`,
      origin: "Ontario",
      distance: Math.min(200, Math.round(dist * 0.05)),
      co2: Math.max(80, Math.round(totalG * 0.18)),
      price: Math.round((price * 1.08 + Number.EPSILON) * 100) / 100,
    };
  }

  return {
    id,
    name: base.name,
    brand: base.brand,
    category: base.category,
    price,
    co2: totalG,
    origin: {
      country: geo.country,
      flag: geo.flag,
      region,
      lat: geo.lat,
      lng: geo.lng,
      distance: dist,
    },
    transport,
    esgScore: itemEsgFromCo2(totalG),
    inSeason,
    localAlt,
    breakdown,
    barcode,
  };
}

export async function itemFromSearchLine(
  line: { name: string; price: number; barcode?: string },
  index: number,
  signal?: AbortSignal,
): Promise<ScannedItem | null> {
  if (line.barcode) {
    const resolved = await resolveBarcodeToProduct(line.barcode);
    if (resolved) {
      const code =
        resolved.code.replace(/\D/g, "") || line.barcode.replace(/\D/g, "");
      return buildScannedItemFromOff(
        resolved,
        line.price,
        `line-${index}-${code}`,
        code,
      );
    }
  }
  const cleaned = cleanGroceryLineName(line.name);
  const variants = grocerySearchVariants(cleaned || line.name);
  for (const q of variants) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const hits = await searchProducts(q, signal);
    if (hits.length) {
      const hit =
        hits.find((h) =>
          (h.product_name || "")
            .toLowerCase()
            .includes(q.toLowerCase().slice(0, Math.min(5, q.length))),
        ) ?? hits[0];
      return buildScannedItemFromOff(
        hit,
        line.price,
        `line-${index}-${hit.code}`,
      );
    }
  }
  const usda = await searchUsdaBrandedByName(
    variants[0] || cleaned || line.name,
  );
  if (usda) {
    const bc = usda.code.replace(/\D/g, "") || undefined;
    return buildScannedItemFromOff(
      usda,
      line.price,
      `line-${index}-usda-${usda.code}`,
      bc,
    );
  }

  // ── Fallback: infer category from name, build a generic item ──────────────
  // This ensures store-brand products not in any database still get ESG scored.
  const inferredCategory = inferCategoryFromName(line.name);
  if (!inferredCategory) return null; // confirmed non-food

  const fallbackName = cleanGroceryLineName(line.name) || line.name;

  // 1. Try our brand/produce origin database first — most accurate
  const knownOrigin = resolveProductOrigin(fallbackName);

  // 2. Category-level typical origins as last resort
  const CATEGORY_TYPICAL_ORIGIN: Record<
    string,
    {
      country: string;
      flag: string;
      region: string;
      transport: ScannedItem["transport"];
    }
  > = {
    meat: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Alberta",
      transport: "truck",
    },
    dairy: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Ontario",
      transport: "truck",
    },
    bakery: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Ontario",
      transport: "truck",
    },
    grain: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Saskatchewan",
      transport: "truck",
    },
    fruit: {
      country: "USA",
      flag: "🇺🇸",
      region: "California",
      transport: "truck",
    },
    vegetable: {
      country: "USA",
      flag: "🇺🇸",
      region: "California",
      transport: "truck",
    },
    packaged: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Ontario",
      transport: "truck",
    },
  };

  const originHint = knownOrigin
    ? {
        country: knownOrigin.country,
        flag: knownOrigin.flag,
        region: knownOrigin.region,
        transport: knownOrigin.transport,
      }
    : (CATEGORY_TYPICAL_ORIGIN[inferredCategory] ?? {
        country: "Canada",
        flag: "🇨🇦",
        region: "Ontario",
        transport: "truck" as const,
      });

  const geo = knownOrigin
    ? {
        country: knownOrigin.country,
        flag: knownOrigin.flag,
        lat: knownOrigin.lat,
        lng: knownOrigin.lng,
      }
    : coordsForCountryOrDefault(originHint.country.toLowerCase());
  const sameCountry = originHint.country === "Canada";
  const dist = distanceFromCoords(userLocation, geo);
  const transport =
    originHint.transport ??
    inferTransport(
      dist,
      sameCountry,
      inferredCategory as ScannedItem["category"],
    );
  const { totalG, breakdown } = estimateItemEmissions({
    category: inferredCategory as ScannedItem["category"],
    massKg: 0.4,
    distanceKm: dist,
    transport,
    sameCountry,
  });

  return {
    id: `line-${index}-inferred`,
    name: fallbackName.slice(0, 60),
    category: inferredCategory as ScannedItem["category"],
    price: line.price,
    co2: totalG,
    origin: {
      country: originHint.country,
      flag: originHint.flag,
      region: originHint.region,
      lat: geo.lat,
      lng: geo.lng,
      distance: dist,
    },
    transport,
    esgScore: itemEsgFromCo2(totalG),
    inSeason: sameCountry,
    breakdown,
  };
}

export type PipelineStep = 1 | 2 | 3 | 4;

export interface ScanPipelineOptions {
  signal?: AbortSignal;
  onStep?: (step: PipelineStep, detail: string) => void;
}

/** Parse pasted order confirmation / email (same line parser as OCR). */
export async function runPasteOrderPipeline(
  pasted: string,
  options: ScanPipelineOptions = {},
): Promise<ScannedItem[]> {
  const { signal, onStep } = options;
  onStep?.(1, "Parsing pasted text");
  const { parseReceiptLines } = await import("@/lib/receiptOcr");
  const lines = parseReceiptLines(pasted);
  if (lines.length === 0) {
    throw new Error(
      "No lines with prices found. Paste lines like: Strawberries 4.99",
    );
  }
  onStep?.(2, `Open Food Facts matching (${lines.length} lines)`);
  const items: ScannedItem[] = [];
  const limit = 4;
  for (let i = 0; i < lines.length; i += limit) {
    const chunk = lines.slice(i, i + limit);
    const resolved = await Promise.all(
      chunk.map((line, j) => itemFromSearchLine(line, i + j, signal)),
    );
    for (const it of resolved) {
      if (it) items.push(it);
    }
    onStep?.(3, `Looking up origins… (${items.length} matched)`);
  }
  if (items.length === 0) {
    throw new Error("Could not match lines to Open Food Facts.");
  }
  onStep?.(4, "Poore & Nemecek-style factors → ESG score");
  return items;
}

/** Full receipt: OCR → search OFF per line → emissions (with concurrency limit). */
export async function runReceiptPipeline(
  imageFile: File,
  options: ScanPipelineOptions = {},
): Promise<ScannedItem[]> {
  const { signal, onStep } = options;
  onStep?.(1, "OpenCV preprocessing → Tesseract OCR (--psm 6)");
  const { ocrReceiptImage, parseReceiptLines } =
    await import("@/lib/receiptOcr");
  const text = await ocrReceiptImage(imageFile);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const lines = parseReceiptLines(text);
  if (lines.length === 0) {
    throw new Error(
      "No line items with prices found. Try a clearer photo, or paste your order text from the Scan screen.",
    );
  }

  onStep?.(2, `LLM parsing → Open Food Facts matching (${lines.length} lines)`);
  const items: ScannedItem[] = [];
  const limit = 4;
  for (let i = 0; i < lines.length; i += limit) {
    const chunk = lines.slice(i, i + limit);
    const resolved = await Promise.all(
      chunk.map((line, j) => itemFromSearchLine(line, i + j, signal)),
    );
    for (const it of resolved) {
      if (it) items.push(it);
    }
    onStep?.(3, `Looking up origins… (${items.length} matched)`);
  }

  if (items.length === 0) {
    throw new Error(
      "Could not match products to Open Food Facts. Try product barcodes or a clearer receipt.",
    );
  }

  onStep?.(4, "Poore & Nemecek-style factors → ESG score");
  return items;
}

export function aggregateTripScore(items: ScannedItem[]): {
  score: number;
  grade: string;
  change: number;
} {
  const avg =
    items.reduce((s, i) => s + i.esgScore, 0) / Math.max(items.length, 1);
  const score = Math.round(300 + avg * 5.5);
  const clamped = Math.max(320, Math.min(850, score));
  let grade = "C";
  if (clamped >= 750) grade = "A";
  else if (clamped >= 680) grade = "B+";
  else if (clamped >= 620) grade = "B";
  else if (clamped >= 580) grade = "B-";
  else if (clamped >= 520) grade = "C+";
  else if (clamped >= 460) grade = "C";
  else grade = "D";
  return { score: clamped, grade, change: userData.esgChange };
}
