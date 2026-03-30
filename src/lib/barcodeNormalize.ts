/**
 * Try common GTIN variants: UPC-A ↔ EAN-13 (leading zero), GTIN-14.
 * Also handles partial barcodes (9–11 digits) by padding to standard lengths.
 * APIs disagree on which form they index, so we try all reasonable variants.
 */
export function barcodeCandidates(digits: string): string[] {
  const d = digits.replace(/\D/g, "");
  if (d.length < 6 || d.length > 14) return [];

  const out: string[] = [];
  const add = (s: string) => {
    if (s.length >= 8 && s.length <= 14 && !out.includes(s)) out.push(s);
  };

  // Always try the raw digits first
  add(d);

  if (d.length === 12) {
    // UPC-A → also try as EAN-13 with leading zero
    add(`0${d}`);
  }
  if (d.length === 13 && d.startsWith("0")) {
    // EAN-13 → also try as UPC-A without leading zero
    add(d.slice(1));
  }
  if (d.length === 14) {
    add(d.slice(1));
    add(d.slice(2));
  }
  if (d.length === 8) {
    // UPC-E → pad to 12 and 13
    add(`000000${d}`);
    add(`00000${d}`);
    add(`0000${d}`);
  }

  // ── Handle partial / non-standard lengths (9, 10, 11 digits) ─────────────
  // Common cause: user manually types barcode digits and misses leading zeros,
  // or scanner drops leading zeros. Pad to the two most likely standard lengths.
  if (d.length === 11) {
    // One leading zero away from UPC-A
    add(`0${d}`);          // → 12-digit UPC-A
    add(`00${d}`);         // → 13-digit EAN-13
  }
  if (d.length === 10) {
    // Two leading zeros away from UPC-A
    add(`00${d}`);         // → 12-digit UPC-A
    add(`000${d}`);        // → 13-digit EAN-13
  }
  if (d.length === 9) {
    add(`000${d}`);        // → 12-digit UPC-A
    add(`0000${d}`);       // → 13-digit EAN-13
  }
  if (d.length === 6 || d.length === 7) {
    // Very short — still worth trying padded forms
    add(`000000${d}`.slice(-12)); // pad to 12
    add(`0000000${d}`.slice(-13)); // pad to 13
  }

  return out;
}
