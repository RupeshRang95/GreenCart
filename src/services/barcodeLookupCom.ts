/**
 * Barcode Lookup (barcodelookup.com) — optional commercial API for US/global coverage.
 * Set VITE_BARCODE_LOOKUP_API_KEY in `.env` — browser CORS may require a small backend proxy.
 * https://www.barcodelookup.com/api
 */

import type { OFFSearchHit } from "@/services/openFoodFacts";
import type { ScannedItem } from "@/data/mockData";
import { convertOffProductToScannedItem } from "@/services/offtoScanned";

const HEADERS: HeadersInit = {
  "User-Agent": "GreenCart/1.0",
  Accept: "application/json",
};

export async function fetchBarcodeLookupCom(
  clean: string,
): Promise<OFFSearchHit | null> {
  const key = import.meta.env.VITE_BARCODE_LOOKUP_API_KEY?.trim();
  if (!key) return null;

  // Remove all non-digit characters from the barcode
  const d = clean.replace(/\D/g, "");
  if (d.length < 8) return null; // minimal valid barcode length

  try {
    const url = `https://api.barcodelookup.com/v3/products?barcode=${encodeURIComponent(
      d,
    )}&formatted=y&key=${encodeURIComponent(key)}`;

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      products?: Array<Record<string, unknown>>;
    };
    const p = data.products?.[0];
    if (!p) return null;

    // Safely extract title
    const title = String(p.title ?? p.product_name ?? "Product").slice(0, 120);

    // Safely extract brand
    const brand = p.brand != null ? String(p.brand) : undefined;

    // Safely extract category and determine tags
    const categoryStr = typeof p.category === "string" ? p.category : "";
    const tags = categoryStr
      ? [
          categoryStr.toLowerCase().includes("food")
            ? "en:groceries"
            : "en:packaged",
        ]
      : ["en:groceries"];

    return {
      code: d,
      product_name: title,
      brands: brand,
      countries_tags: ["en:united-states"],
      categories_tags: tags,
      quantity: p.size != null ? String(p.size) : undefined,
    };
  } catch {
    return null;
  }
}
