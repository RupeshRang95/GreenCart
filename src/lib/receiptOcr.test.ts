import { describe, it, expect } from "vitest";
import { parseReceiptLines } from "./receiptOcr";

const WALMART_SAMPLE = `
NIGHT HAWK    004170901935 F 2.78
HEALTHCHOICE 007265545445 F 2.98
MANGO YOGURT 005360000026 F 0.50
SUGAR GRANU 007874237117 F 4.98
BULK LEMONS 000000004958KF 0.48
`;

describe("parseReceiptLines", () => {
  it("extracts 12-digit UPCs and prices from Walmart-style lines", () => {
    const lines = parseReceiptLines(WALMART_SAMPLE);
    expect(lines.length).toBe(5);

    expect(lines[0].barcode).toBe("004170901935");
    expect(lines[0].price).toBe(2.78);
    expect(lines[0].name.toLowerCase()).toContain("night");

    expect(lines[3].barcode).toBe("007874237117");
    expect(lines[3].price).toBe(4.98);

    // "KF" suffix after barcode — still captures 12-digit GTIN
    expect(lines[4].barcode).toBe("000000004958");
    expect(lines[4].price).toBe(0.48);
  });
});
