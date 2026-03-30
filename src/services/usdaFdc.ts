/**
 * USDA FoodData Central — Branded Foods (US-centric DB, but many products sold in Canada).
 * Used after Open Food Facts for barcode/name gaps — especially US / international brands on Canadian receipts.
 * Uses DEMO_KEY for exploration; set VITE_USDA_FDC_API_KEY for production rate limits.
 * https://fdc.nal.usda.gov/api-guide.html
 */

import type { OFFSearchHit } from "@/services/openFoodFacts";

const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";

function apiKey(): string {
  return import.meta.env.VITE_USDA_FDC_API_KEY?.trim() || "DEMO_KEY";
}

export interface UsdaFoodBrief {
  fdcId: number;
  description?: string;
  dataType?: string;
  gtinUpc?: string;
  brandOwner?: string;
  brandName?: string;
  /** Often "United States" or "Canada" — we prefer Canada for domestic receipt context when choosing among hits. */
  marketCountry?: string;
  foodCategory?: string;
  packageWeight?: string;
  householdServingFullText?: string;
}

interface UsdaSearchResponse {
  totalHits?: number;
  foods?: UsdaFoodBrief[];
}

function normDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/** Compare GTINs: exact, or last 12 digits (UPC-A vs EAN-13 leading zero). */
function gtinMatches(a: string, b: string): boolean {
  const A = normDigits(a);
  const B = normDigits(b);
  if (!A || !B) return false;
  if (A === B) return true;
  const tail12 = (x: string) => (x.length >= 12 ? x.slice(-12) : x);
  if (A.length >= 12 && B.length >= 12 && tail12(A) === tail12(B)) return true;
  return A.endsWith(B) || B.endsWith(A);
}

function mapUsdaToOffHit(f: UsdaFoodBrief): OFFSearchHit {
  const mc = (f.marketCountry || "United States").toLowerCase();
  const regionTag = mc.includes("canada") ? "en:canada" : "en:united-states";
  const cat = (f.foodCategory || "grocery").toLowerCase();
  const tags = [
    cat.includes("vegetable") || cat.includes("fruit") ? "en:fruits-and-vegetables" : "en:groceries",
    "en:packaged",
  ];
  return {
    code: String(f.gtinUpc || f.fdcId),
    product_name: (f.description || "Grocery item").slice(0, 120),
    brands: f.brandName || f.brandOwner,
    countries_tags: [regionTag],
    categories_tags: tags,
    quantity: f.packageWeight || f.householdServingFullText,
  };
}

async function postSearch(body: Record<string, unknown>): Promise<UsdaSearchResponse | null> {
  try {
    const res = await fetch(`${USDA_SEARCH}?api_key=${encodeURIComponent(apiKey())}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as UsdaSearchResponse;
  } catch {
    return null;
  }
}

function preferCanadianMarket(foods: UsdaFoodBrief[]): UsdaFoodBrief | undefined {
  const ca = foods.find((x) => (x.marketCountry || "").toLowerCase().includes("canada"));
  return ca ?? foods[0];
}

/**
 * Match by GTIN: search Branded DB with digit string; verify gtinUpc on results.
 */
export async function lookupUsdaByBarcodeCandidates(candidates: string[]): Promise<OFFSearchHit | null> {
  const seen = new Set<string>();
  for (const raw of candidates) {
    const d = normDigits(raw);
    if (d.length < 8) continue;
    const queries = [d, d.length === 12 ? `0${d}` : d, d.length === 13 && d.startsWith("0") ? d.slice(1) : d];
    for (const q of queries) {
      if (seen.has(q)) continue;
      seen.add(q);
      const data = await postSearch({
        query: q,
        pageSize: 15,
        dataType: ["Branded"],
      });
      const foods = data?.foods ?? [];
      const matches = foods.filter((f) => f.gtinUpc && gtinMatches(f.gtinUpc, d));
      const picked = preferCanadianMarket(matches) ?? matches[0];
      if (picked) return mapUsdaToOffHit(picked);
    }
  }
  return null;
}

/**
 * Keyword search on Branded foods (receipt line text when OFF search misses).
 */
export async function searchUsdaBrandedByName(name: string): Promise<OFFSearchHit | null> {
  const q = name.replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 2) return null;
  const data = await postSearch({
    query: q,
    pageSize: 12,
    dataType: ["Branded"],
    sortField: "score",
    sortOrder: "desc",
  });
  const foods = data?.foods ?? [];
  const f = preferCanadianMarket(foods);
  if (!f?.description) return null;
  return mapUsdaToOffHit(f);
}
