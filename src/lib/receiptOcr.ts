import { createWorker, type Worker } from "tesseract.js";
import { cleanGroceryLineName, isNonFoodLine } from "@/lib/receiptLineNormalize";

export interface ParsedReceiptLine {
  raw: string;
  name: string;
  price: number;
  /** 12–14 digit UPC/EAN when present (e.g. Walmart line format). */
  barcode?: string;
}

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng", undefined, {
      logger: () => {},
    });
  }
  return workerPromise;
}

/** Run OCR on an image file; release can be called to free memory when idle. */
export async function ocrReceiptImage(file: Blob): Promise<string> {
  const worker = await getWorker();
  const {
    data: { text },
  } = await worker.recognize(file);
  return text;
}

export function parseReceiptLines(ocrText: string): ParsedReceiptLine[] {
  const lines = ocrText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: ParsedReceiptLine[] = [];
  const priceRe = /\$?\s*(\d{1,3}[.,]\d{2})\b/;

  /** Real GTIN barcodes: 8, 12, 13, or 14 digits. */
  const gtinRe = /(\d{8}|\d{12,14})(?!\d)/;

  // Skip header/footer lines common on Canadian receipts
  const SKIP_RE = /subtotal|sub-?total|total|tax\b|hst|gst|pst|balance|cash|change|debit|visa|mastercard|amex|interac|payment|tender|savings?|you saved|points?|airmiles|reward|receipt|store #|tel:|www\.|survey|thank you|welcome|cashier|terminal|ref #|network|batch|trace|approval|auth|sequence/i;

  for (const raw of lines) {
    if (SKIP_RE.test(raw)) continue;

    const pm = raw.match(priceRe);
    if (!pm) continue;
    const price = parseFloat(pm[1].replace(",", "."));
    if (Number.isNaN(price) || price <= 0 || price > 500) continue;

    const priceIndex = raw.indexOf(pm[0]);
    const beforePrice = raw.slice(0, priceIndex);

    // Try to extract GTIN from receipt line (8, 12, 13, 14 digits)
    const gtinMatch = beforePrice.match(gtinRe) ?? raw.match(gtinRe);
    const barcode = gtinMatch?.[1];

    let name = beforePrice.trim();
    // Always remove ALL 8–14 digit number sequences from the name
    // (covers both real GTINs we use as barcodes AND Walmart internal SKUs we don't)
    name = name.replace(/\b\d{8,14}\b/g, " ");
    // Remove leading numbers, SKU codes, dashes
    name = name.replace(/^[\d\s.#*\-–]+/g, "").trim();
    name = name.replace(/\s{2,}/g, " ");

    if (name.length < 2 && !barcode) continue;
    if (name.length < 2) name = "Item";

    const cleanedName = cleanGroceryLineName(name).slice(0, 80) || name.slice(0, 80);

    // Skip non-food items (motor oil, cookware, etc.)
    if (isNonFoodLine(cleanedName)) continue;

    out.push({ raw, name: cleanedName, price, barcode });
  }

  return out.slice(0, 30);
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
}
