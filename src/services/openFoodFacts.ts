/**
 * Open Food Facts — open database (ODbL). Product API + search.
 * https://wiki.openfoodfacts.org/API
 */

export interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  countries?: string;
  countries_tags?: string[];
  origins?: string;
  origins_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  quantity?: string;
  nutriments?: { energy_100g?: number };
}

export interface OFFSearchHit {
  code: string;
  product_name?: string;
  brands?: string;
  countries?: string;
  countries_tags?: string[];
  quantity?: string;
  categories_tags?: string[];
}

/** Open Food Facts asks for a descriptive User-Agent on all API calls. */
const OFF_HEADERS: HeadersInit = {
  "User-Agent": "GreenCart/1.0 (https://github.com/greencart; contact: app@greencart.local)",
  Accept: "application/json",
};

function stripLang(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " ");
}

export function countryFromProduct(p: OFFProduct | OFFSearchHit): string | undefined {
  const tags = p.countries_tags?.[0] ?? p.countries?.split(",")[0]?.trim();
  if (tags) return stripLang(tags);
  return undefined;
}

/**
 * Food-only Open Food Facts host. The other hosts (openbeautyfacts,
 * openpetfoodfacts, openproductsfacts) return non-food items — we
 * deliberately exclude them so barcode scans stay food-only.
 */
const OFF_FOOD_HOST = "https://world.openfoodfacts.org";

/**
 * Non-food category tag prefixes. If a product's categories_tags contain
 * any of these, it is not food and should be rejected.
 */
const NON_FOOD_CATEGORY_PREFIXES = [
  "en:cosmetics", "en:beauty-products", "en:personal-care-products",
  "en:hair-care", "en:skin-care", "en:oral-hygiene",
  "en:household-products", "en:cleaning-products", "en:laundry-products",
  "en:paper-products", "en:office-products", "en:clothing",
  "en:electronics", "en:automotive", "en:pet-supplies",
  "en:dietary-supplements",
];

/**
 * Returns true if this product is a food/beverage item suitable for
 * GreenCart's ESG scoring. Rejects cosmetics, cleaning products, etc.
 */
export function isFoodProduct(p: OFFProduct | OFFSearchHit): boolean {
  const tags = p.categories_tags ?? [];
  if (tags.length === 0) return true; // no category info → assume food (OFF is food-first)
  // Reject if any non-food category prefix matches
  const lower = tags.map((t) => t.toLowerCase());
  return !NON_FOOD_CATEGORY_PREFIXES.some((prefix) =>
    lower.some((t) => t.startsWith(prefix))
  );
}

/** Single lookup by exact GTIN — food database only. */
export async function fetchOffProductOnce(clean: string): Promise<OFFProduct | null> {
  const d = clean.replace(/\D/g, "");
  if (d.length < 8) return null;
  try {
    const res = await fetch(`${OFF_FOOD_HOST}/api/v2/product/${d}.json`, {
      headers: OFF_HEADERS,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const product = data.product as OFFProduct;
      return isFoodProduct(product) ? product : null;
    }
  } catch { /* network */ }
  return null;
}

/**
 * Name search: Canada-listed products first, then global fallback.
 * Also tries stripping leading brand words (e.g. "President's Choice Yogurt" → "Yogurt")
 * to improve match rate for store-brand products not in OFF under their full name.
 */
export async function searchProducts(query: string, signal?: AbortSignal): Promise<OFFSearchHit[]> {
  const trimmed = query.trim().slice(0, 80);
  if (!trimmed) return [];

  const queries = [trimmed];

  // If query has 3+ words, also try dropping the first word (often a brand)
  const words = trimmed.split(/\s+/);
  if (words.length >= 3) {
    queries.push(words.slice(1).join(" ")); // drop first word (brand)
    queries.push(words.slice(-2).join(" ")); // last 2 words (usually most specific)
  }

  for (const q of queries) {
    const enc = encodeURIComponent(q);
    const base = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${enc}&search_simple=1&action=process&json=1&page_size=8`;

    // Canada-first
    try {
      const urlCa = `${base}&tagtype_0=countries&tag_contains_0=contains&tag_0=en:canada`;
      const resCa = await fetch(urlCa, { signal, headers: OFF_HEADERS });
      if (resCa.ok) {
        const dataCa = await resCa.json();
        const products = (dataCa.products ?? []) as OFFSearchHit[];
        if (products.length > 0) return products;
      }
    } catch { /* continue */ }

    // Global fallback
    try {
      const res = await fetch(base, { signal, headers: OFF_HEADERS });
      if (res.ok) {
        const data = await res.json();
        const products = (data.products ?? []) as OFFSearchHit[];
        if (products.length > 0) return products;
      }
    } catch { /* continue */ }
  }

  return [];
}

/** Map OFF categories_tags to our ScannedItem category. */
export function categoryFromOffTags(tags: string[] | undefined): import("@/data/mockData").ScannedItem["category"] {
  const t = (tags ?? []).join(" ").toLowerCase();
  if (/(meat|fish|seafood|salmon|poultry|beef|pork)/.test(t)) return "meat";
  if (/(dairy|milk|cheese|yogurt|egg|butter)/.test(t)) return "dairy";
  if (/(bread|bakery)/.test(t)) return "bakery";
  if (/(rice|pasta|cereal|flour)/.test(t)) return "grain";
  if (/(fruits|fruit)/.test(t)) return "fruit";
  if (/(vegetables|vegetable)/.test(t)) return "vegetable";
  if (/(snacks|beverages|grocery|frozen)/.test(t)) return "packaged";
  return "vegetable";
}

/** Parse "500 g", "1 L", "1kg" → kg mass. */
export function parseMassKg(quantity: string | undefined): number {
  if (!quantity) return 0.4;
  const s = quantity.toLowerCase().replace(",", ".");
  const m = s.match(/([\d.]+)\s*(kg|g|l|ml|oz)\b/);
  if (!m) return 0.4;
  const n = parseFloat(m[1]);
  const u = m[2];
  if (u === "kg") return n;
  if (u === "g") return n / 1000;
  if (u === "l") return n;
  if (u === "ml") return n / 1000;
  if (u === "oz") return n * 0.0283;
  return 0.4;
}
