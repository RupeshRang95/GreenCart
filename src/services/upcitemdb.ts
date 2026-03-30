/**
 * UPCitemdb — trial API (rate-limited). Better US coverage than OFF for many SKUs.
 * https://www.upcitemdb.com/wp/docs/main/development/
 */

import { categoryFromUpcitemdbPath } from "@/services/productCategory";

const UPC_HEADERS: HeadersInit = {
  "User-Agent": "GreenCart/1.0 (barcode lookup)",
  Accept: "application/json",
};

export interface UpcitemdbItem {
  ean?: string;
  upc?: string;
  title?: string;
  brand?: string;
  category?: string;
  description?: string;
  size?: string;
  weight?: string;
}

interface UpcitemdbLookupResponse {
  code: string;
  message?: string;
  items?: UpcitemdbItem[];
}

/** Map UPCitemdb row into Open Food Facts–compatible shape for shared pipeline. */
export function upcitemdbToOffShape(
  item: UpcitemdbItem,
  triedCode: string
): import("@/services/openFoodFacts").OFFSearchHit {
  const code = (item.ean || item.upc || triedCode).replace(/\D/g, "");
  const qtyHint = [item.size, item.weight].filter(Boolean).join(" ");
  return {
    code,
    product_name: (item.title || "Product").trim().slice(0, 120),
    brands: item.brand,
    countries_tags: ["en:united-states"],
    categories_tags: categoryFromUpcitemdbPath(item.category),
    quantity: qtyHint || undefined,
  };
}

export async function lookupUpcitemdb(upc: string): Promise<import("@/services/openFoodFacts").OFFSearchHit | null> {
  const clean = upc.replace(/\D/g, "");
  if (clean.length < 8) return null;

  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(clean)}`;
  const res = await fetch(url, { headers: UPC_HEADERS });
  if (!res.ok) return null;

  const data = (await res.json()) as UpcitemdbLookupResponse;
  if (data.code !== "OK" || !data.items?.length) return null;

  return upcitemdbToOffShape(data.items[0], clean);
}
