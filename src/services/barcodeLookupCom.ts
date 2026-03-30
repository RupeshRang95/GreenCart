/**
 * Barcode Lookup (barcodelookup.com) — optional commercial API for US/global coverage.
 * Set VITE_BARCODE_LOOKUP_API_KEY in `.env` — browser CORS may require a small backend proxy.
 * https://www.barcodelookup.com/api
 */

import type { OFFSearchHit } from "@/services/openFoodFacts";

const HEADERS: HeadersInit = {
  "User-Agent": "GreenCart/1.0",
  Accept: "application/json",
};

export async function fetchBarcodeLookupCom(clean: string): Promise<OFFSearchHit | null> {
  const key = import.meta.env.VITE_BARCODE_LOOKUP_API_KEY?.trim();
  if (!key) return null;
  const d = clean.replace(/\D/g, "");
  if (d.length < 8) return null;

  try {
    const url = `https://api.barcodelookup.com/v3/products?barcode=${encodeURIComponent(d)}&formatted=y&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data = (await res.json()) as { products?: Array<Record<string, unknown>> };
    const p = data.products?.[0];
    if (!p) return null;
    const title = String(p.title ?? p.product_name ?? "Product");
    const brand = p.brand != null ? String(p.brand) : undefined;
    const category = p.category != null ? String(p.category) : "";
    const tags = category
      ? [category.toLowerCase().includes("food") ? "en:groceries" : "en:packaged"]
      : ["en:groceries"];
    return {
      code: d,
      product_name: title.slice(0, 120),
      brands: brand,
      countries_tags: ["en:united-states"],
      categories_tags: tags,
      quantity: p.size != null ? String(p.size) : undefined,
    };
  } catch {
    return null;
  }
}
