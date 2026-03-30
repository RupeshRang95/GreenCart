/**
 * Normalize noisy receipt OCR text for grocery matching.
 * Handles Canadian retailers: Walmart Canada, FreshCo, No Frills, Loblaws, Metro, Sobeys.
 */

/**
 * Canadian store brand prefixes → expand to full brand name for better DB matching.
 * Order matters: longer prefixes first to avoid partial matches.
 */
const CA_BRAND_EXPANSIONS: Array<[RegExp, string]> = [
  [/\bPCO\b/gi, "President's Choice Organic"],
  [/\bPCB\b/gi, "President's Choice Blue Menu"],
  [/\bPC\b/gi, "President's Choice"],
  [/\bGV\b/gi, "Great Value"],
  [/\bNLBS?\b/gi, "No Frills"],
  [/\bNNF\b/gi, "No Name"],
  [/\bNN\b/gi, "No Name"],
  [/\bSEL\b/gi, "Selection"],        // Metro house brand
  [/\bOUR FINEST\b/gi, "Our Finest"],
  [/\bLFE\b/gi, "Life Brand"],
  [/\bSMRT\b/gi, "Smart"],
  [/\bQK\b/gi, "Quick"],
  [/\bORG\b/gi, "Organic"],
  [/\bFRSH\b/gi, "Fresh"],
  [/\bNATL?\b/gi, "Natural"],
];

/**
 * Common receipt abbreviations → full product words.
 * Improves Open Food Facts search match rate significantly.
 */
const WORD_EXPANSIONS: Array<[RegExp, string]> = [
  // Proteins
  [/\bGRND\b/gi, "Ground"],
  [/\bBRST\b/gi, "Breast"],
  [/\bBNLS\b/gi, "Boneless"],
  [/\bSKNLS\b/gi, "Skinless"],
  [/\bFLT\b/gi, "Fillet"],
  [/\bCHKN\b/gi, "Chicken"],
  [/\bTKY\b/gi, "Turkey"],
  // Dairy / packaged
  [/\bYGT\b/gi, "Yogurt"],
  [/\bCHSE?\b/gi, "Cheese"],
  [/\bMLK\b/gi, "Milk"],
  [/\bBTR\b/gi, "Butter"],
  [/\bCRM\b/gi, "Cream"],
  [/\bEGGS?\b/gi, "Eggs"],
  // Produce
  [/\bSTRWBRY\b/gi, "Strawberry"],
  [/\bBLUBRY\b/gi, "Blueberry"],
  [/\bRASPBRY\b/gi, "Raspberry"],
  [/\bBROC\b/gi, "Broccoli"],
  [/\bCUCMBR\b/gi, "Cucumber"],
  [/\bMSHRM\b/gi, "Mushroom"],
  [/\bSPINACH\b/gi, "Spinach"],
  [/\bTMTO\b/gi, "Tomato"],
  [/\bPTTO\b/gi, "Potato"],
  [/\bPTT\b/gi, "Potato"],
  [/\bBNNA\b/gi, "Banana"],
  [/\bMNG\b/gi, "Mango"],
  [/\bAVOC\b/gi, "Avocado"],
  // Bakery / pantry
  [/\bBRD\b/gi, "Bread"],
  [/\bWHL WHT\b/gi, "Whole Wheat"],
  [/\bMLTGRN\b/gi, "Multigrain"],
  [/\bCRL\b/gi, "Cereal"],
  [/\bPSTA\b/gi, "Pasta"],
  [/\bRCE\b/gi, "Rice"],
  [/\bOTS\b/gi, "Oats"],
  [/\bCHPS\b/gi, "Chips"],
  [/\bCOOKS\b/gi, "Cookies"],
  [/\bCKS\b/gi, "Cookies"],
  [/\bJCE\b/gi, "Juice"],
  [/\bORJ\b/gi, "Orange"],
  [/\bOJ\b/gi, "Orange Juice"],
  [/\bCFFE\b/gi, "Coffee"],
  [/\bSHAMP\b/gi, "Shampoo"],
  // Modifiers
  [/\bMIN\b/gi, "Mini"],
  [/\bMD\b/gi, "Medium"],
  [/\bLG\b/gi, "Large"],
  [/\bSM\b/gi, "Small"],
  [/\bCRSP\b/gi, "Crispy"],
  [/\bCRNCH\b/gi, "Crunchy"],
  [/\bFRZN\b/gi, "Frozen"],
  [/\bFRSH\b/gi, "Fresh"],
  [/\bSWT\b/gi, "Sweet"],
  [/\bSLCD\b/gi, "Sliced"],
  [/\bDCD\b/gi, "Diced"],
  [/\bPKD\b/gi, "Packed"],
  [/\bSTFFD\b/gi, "Stuffed"],
  [/\bSTMD\b/gi, "Steamed"],
  [/\bRSTD\b/gi, "Roasted"],
  [/\bBBQ\b/gi, "Barbecue"],
  [/\bWHL\b/gi, "Whole"],
];

/**
 * Non-food/non-grocery keywords — these lines should be skipped.
 * Includes auto supplies, household, personal care, pharmacy.
 */
/**
 * Broad non-food pattern. Covers: auto, household cleaning, personal care,
 * pharmacy/OTC, clothing, electronics, hardware, baby non-food, and pet supplies.
 * Keep food-adjacent words OUT (e.g. "foil" might be baking foil — kept).
 */
const NON_FOOD_PATTERN = new RegExp(
  "\\b(" +
  // Auto / garage
  "motor oil|engine oil|autodrive|windshield|wiper|antifreeze|coolant|brake fluid|transmission|oil filter|air filter|" +
  // Household cleaning
  "detergent|laundry|dishwash|dish soap|fabric softener|bleach|disinfect|floor cleaner|surface spray|" +
  "toilet|paper towel|garbage bag|trash bag|ziplock|cling wrap|aluminum foil|parchment|plastic wrap|" +
  "mop|broom|scrub|sponge|scotch brite|swiffer|vacuum|lysol|pinesol|mr clean|windex|pledge|" +
  // Personal care / beauty
  "shampoo|conditioner|body wash|soap bar|hand soap|face wash|toner|moisturiz|serum|" +
  "toothpaste|toothbrush|mouthwash|dental floss|whitening strip|" +
  "deodorant|antiperspir|razor|shaving|aftershave|beard|" +
  "mascara|eyeliner|lipstick|lip gloss|foundation|concealer|blush|eyeshadow|" +
  "sunscreen|spf lotion|body lotion|hand cream|nail polish|nail remover|" +
  "perfume|cologne|body spray|hair dye|hair color|hair wax|hair gel|hair spray|" +
  // Pharmacy / OTC
  "vitamin|supplement|pharmacy|prescription|acetamino|ibuprofen|advil|tylenol|" +
  "colgate|crest|listerine|band.?aid|bandage|first aid|antacid|pepto|gravol|" +
  // Clothing / apparel
  "\\bt.?shirt\\b|\\bshirt\\b|\\bpants\\b|\\bjeans\\b|\\bjacket\\b|\\bsweater\\b|" +
  "\\bdress\\b|\\bsocks\\b|\\bshoes\\b|\\bboots\\b|\\bsneaker|underwear|bra\\b|legging|" +
  // Electronics / tech
  "\\bcable\\b|charger|\\busb\\b|\\bhdmi\\b|battery|batteries|light bulb|extension cord|" +
  "headphone|earphone|earbud|phone case|screen protector|" +
  // Hardware / home improvement
  "paint\\b|sandpaper|caulk|hammer|screwdriver|drill bit|duct tape|zip tie|" +
  // Pet non-food supplies
  "cat litter|pet litter|dog collar|pet bed|pet toy|leash|" +
  // Baby non-food
  "diaper|nappy|baby wipe|wet wipe|" +
  // Garden / outdoor
  "fertilizer|pesticide|herbicide|weed killer|insecticide|potting soil|mulch" +
  ")\\b",
  "i"
);

/** Strip tax/tender flags and collapse whitespace. */
export function cleanGroceryLineName(raw: string): string {
  let s = raw
    .replace(/\b(F|N|X|O|T|B|E|R)\b/g, " ")  // tax/tender flags
    .replace(/[#*@|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Expand Canadian store brands first
  for (const [re, replacement] of CA_BRAND_EXPANSIONS) {
    s = s.replace(re, replacement);
  }
  // Expand abbreviated product words
  for (const [re, replacement] of WORD_EXPANSIONS) {
    s = s.replace(re, replacement);
  }

  return s.trim();
}

/** Returns true if this receipt line is clearly a non-food item. */
export function isNonFoodLine(name: string): boolean {
  return NON_FOOD_PATTERN.test(name);
}

/**
 * Build search query variants from a cleaned name.
 * Tries progressively shorter queries so we maximise OFF hit rate.
 */
export function grocerySearchVariants(name: string): string[] {
  const n = cleanGroceryLineName(name);
  if (!n) return [];
  const parts = n.split(/\s+/).filter((w) => w.length > 1);
  const out: string[] = [n];

  // 3-word variant
  if (parts.length >= 3) out.push(parts.slice(0, 3).join(" "));
  // 2-word variant
  if (parts.length >= 2) out.push(parts.slice(0, 2).join(" "));
  // 1-word (most important keyword — usually the food type)
  if (parts.length >= 1) {
    // Prefer the last meaningful word (often the food type: "Yogurt", "Chicken", "Bread")
    const lastWord = [...parts].reverse().find((w) => w.length > 3);
    if (lastWord) out.push(lastWord);
    out.push(parts[0]);
  }

  return [...new Set(out.map((s) => s.trim()).filter(Boolean))];
}

/**
 * Infer a food category directly from a receipt line name
 * when no database match is found. Returns null for non-food.
 */
export function inferCategoryFromName(name: string): string | null {
  const n = (name + " " + cleanGroceryLineName(name)).toLowerCase();
  if (NON_FOOD_PATTERN.test(n)) return null;
  if (/(beef|pork|chicken|turkey|salmon|fish|shrimp|lamb|veal|bacon|sausage|meat|poultry|deli|pepperoni)/.test(n)) return "meat";
  if (/(milk|cheese|yogurt|butter|cream|egg|dairy|cheddar|mozzarella|brie|cottage|ricotta)/.test(n)) return "dairy";
  if (/(bread|bagel|muffin|croissant|bun|roll|loaf|baguette|bakery|tortilla|pita|naan)/.test(n)) return "bakery";
  if (/(rice|pasta|oat|cereal|flour|grain|quinoa|barley|lentil|bean|chickpea)/.test(n)) return "grain";
  if (/(strawberr|blueberr|raspberr|blackberr|mango|banana|apple|orange|grape|peach|plum|cherry|lemon|lime|avocado|pineapple|watermelon|melon|kiwi|pear|apricot|fruit)/.test(n)) return "fruit";
  if (/(lettuce|spinach|kale|broccoli|carrot|potato|onion|tomato|pepper|cucumber|zucchini|celery|cabbage|cauliflower|asparagus|mushroom|garlic|vegetable|veggie|salad|herb|ginger)/.test(n)) return "vegetable";
  if (/(juice|water|soda|pop|coffee|tea|drink|beverage|kombucha|sparkling|energy drink)/.test(n)) return "packaged";
  if (/(chip|cracker|cookie|snack|candy|chocolate|granola|bar|pretzel|popcorn|nuts|trail mix)/.test(n)) return "packaged";
  if (/(frozen|pizza|lasagna|burrito|ready meal|meal kit)/.test(n)) return "packaged";
  // Generic grocery — better to include than drop
  return "packaged";
}
