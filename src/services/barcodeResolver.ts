/**
 * Barcode resolution: Open Food Facts (all GTIN variants), then UPCitemdb fallback.
 */

import { barcodeCandidates } from "@/lib/barcodeNormalize";
import type { OFFProduct, OFFSearchHit } from "@/services/openFoodFacts";
import { fetchBarcodeLookupCom } from "@/services/barcodeLookupCom";
import { fetchOffProductOnce } from "@/services/openFoodFacts";
import { lookupUsdaByBarcodeCandidates } from "@/services/usdaFdc";
import { lookupUpcitemdb } from "@/services/upcitemdb";

export async function resolveBarcodeToProduct(raw: string): Promise<OFFProduct | OFFSearchHit | null> {
  const clean = raw.replace(/\D/g, "");
  if (clean.length < 8) return null;

  const candidates = barcodeCandidates(clean);
  for (const c of candidates) {
    try {
      const off = await fetchOffProductOnce(c);
      if (off) return off;
    } catch {
      /* network / CORS — try next GTIN variant */
    }
  }

  for (const c of candidates) {
    try {
      const u = await lookupUpcitemdb(c);
      if (u) return u;
    } catch {
      /* rate limit / offline */
    }
  }

  try {
    const usda = await lookupUsdaByBarcodeCandidates(candidates);
    if (usda) return usda;
  } catch {
    /* offline / CORS */
  }

  for (const c of candidates) {
    try {
      const bl = await fetchBarcodeLookupCom(c);
      if (bl) return bl;
    } catch {
      /* CORS without proxy or invalid key */
    }
  }

  return null;
}
