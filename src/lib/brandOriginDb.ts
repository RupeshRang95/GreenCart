/**
 * Brand & product origin database.
 *
 * When Open Food Facts and barcode APIs can't find a product's origin,
 * we look the brand up here to give a real, accurate origin instead of
 * a generic fallback.
 *
 * Each entry contains:
 *  - country / flag / region   → shown on the map and item card
 *  - lat / lng                 → coordinates for the 3D globe
 *  - transport                 → typical transport mode to Canada
 *
 * Sources: brand corporate disclosures, USDA, Wikipedia, company websites.
 */

export interface BrandOrigin {
  country: string;
  flag: string;
  region: string;
  lat: number;
  lng: number;
  transport: "truck" | "ship" | "air" | "rail";
}

// ─── MAJOR FOOD BRAND ORIGINS ─────────────────────────────────────────────

const BRAND_ORIGINS: Record<string, BrandOrigin> = {
  // ── Frozen / Packaged Meals ──────────────────────────────────────────────
  "night hawk":         { country: "USA", flag: "🇺🇸", region: "New Jersey",    lat: 40.0583, lng: -74.4057, transport: "truck" },
  "nighthawk":          { country: "USA", flag: "🇺🇸", region: "New Jersey",    lat: 40.0583, lng: -74.4057, transport: "truck" },
  "healthy choice":     { country: "USA", flag: "🇺🇸", region: "Nebraska",      lat: 41.4925, lng: -99.9018, transport: "truck" },
  "healthchoice":       { country: "USA", flag: "🇺🇸", region: "Nebraska",      lat: 41.4925, lng: -99.9018, transport: "truck" },
  "lean cuisine":       { country: "USA", flag: "🇺🇸", region: "Illinois",      lat: 40.6331, lng: -89.3985, transport: "truck" },
  "stouffer's":         { country: "USA", flag: "🇺🇸", region: "Ohio",          lat: 40.4173, lng: -82.9071, transport: "truck" },
  "stouffers":          { country: "USA", flag: "🇺🇸", region: "Ohio",          lat: 40.4173, lng: -82.9071, transport: "truck" },
  "marie callender":    { country: "USA", flag: "🇺🇸", region: "California",    lat: 36.7783, lng: -119.4179, transport: "truck" },
  "birds eye":          { country: "USA", flag: "🇺🇸", region: "New York",      lat: 43.0, lng: -75.0, transport: "truck" },
  "birds-eye":          { country: "USA", flag: "🇺🇸", region: "New York",      lat: 43.0, lng: -75.0, transport: "truck" },
  "green giant":        { country: "USA", flag: "🇺🇸", region: "Minnesota",     lat: 46.7296, lng: -94.6859, transport: "truck" },
  "mccain":             { country: "Canada", flag: "🇨🇦", region: "New Brunswick", lat: 46.5653, lng: -66.4619, transport: "truck" },
  "mc cain":            { country: "Canada", flag: "🇨🇦", region: "New Brunswick", lat: 46.5653, lng: -66.4619, transport: "truck" },

  // ── Dairy ────────────────────────────────────────────────────────────────
  "dannon":             { country: "USA", flag: "🇺🇸", region: "New York",      lat: 40.7128, lng: -74.0060, transport: "truck" },
  "danone":             { country: "France", flag: "🇫🇷", region: "Paris",      lat: 48.8566, lng: 2.3522,   transport: "ship" },
  "yoplait":            { country: "France", flag: "🇫🇷", region: "Brest",      lat: 48.3904, lng: -4.4861,  transport: "ship" },
  "chobani":            { country: "USA", flag: "🇺🇸", region: "New York",      lat: 42.6526, lng: -73.7562, transport: "truck" },
  "activia":            { country: "France", flag: "🇫🇷", region: "Paris",      lat: 48.8566, lng: 2.3522,   transport: "ship" },
  "liberty":            { country: "Canada", flag: "🇨🇦", region: "Quebec",     lat: 46.8139, lng: -71.2080, transport: "truck" },
  "lactantia":          { country: "Canada", flag: "🇨🇦", region: "Quebec",     lat: 46.8139, lng: -71.2080, transport: "truck" },
  "saputo":             { country: "Canada", flag: "🇨🇦", region: "Quebec",     lat: 45.5017, lng: -73.5673, transport: "truck" },
  "gay lea":            { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "kraft":              { country: "USA", flag: "🇺🇸", region: "Illinois",      lat: 41.8781, lng: -87.6298, transport: "truck" },
  "philadelphia":       { country: "USA", flag: "🇺🇸", region: "Illinois",      lat: 41.8781, lng: -87.6298, transport: "truck" },
  "armstrong":          { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "crystal":            { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "natrel":             { country: "Canada", flag: "🇨🇦", region: "Quebec",     lat: 45.5017, lng: -73.5673, transport: "truck" },
  "organic valley":     { country: "USA", flag: "🇺🇸", region: "Wisconsin",     lat: 44.5, lng: -89.5, transport: "truck" },

  // ── Produce Brands ────────────────────────────────────────────────────────
  "driscolls":          { country: "USA", flag: "🇺🇸", region: "California",    lat: 36.7783, lng: -119.4179, transport: "truck" },
  "driscoll's":         { country: "USA", flag: "🇺🇸", region: "California",    lat: 36.7783, lng: -119.4179, transport: "truck" },
  "dole":               { country: "USA", flag: "🇺🇸", region: "California",    lat: 36.7783, lng: -119.4179, transport: "truck" },
  "chiquita":           { country: "Ecuador", flag: "🇪🇨", region: "Guayas",    lat: -2.1894, lng: -79.8891, transport: "ship" },
  "del monte":          { country: "USA", flag: "🇺🇸", region: "California",    lat: 36.7783, lng: -119.4179, transport: "truck" },
  "tropicana":          { country: "USA", flag: "🇺🇸", region: "Florida",       lat: 27.9944, lng: -81.7603, transport: "truck" },
  "simply orange":      { country: "USA", flag: "🇺🇸", region: "Florida",       lat: 27.9944, lng: -81.7603, transport: "truck" },
  "minute maid":        { country: "USA", flag: "🇺🇸", region: "Florida",       lat: 27.9944, lng: -81.7603, transport: "truck" },
  "sunrype":            { country: "Canada", flag: "🇨🇦", region: "British Columbia", lat: 49.8880, lng: -119.4960, transport: "truck" },
  "splendor":           { country: "Canada", flag: "🇨🇦", region: "British Columbia", lat: 49.8880, lng: -119.4960, transport: "truck" },
  "zespri":             { country: "New Zealand", flag: "🇳🇿", region: "Bay of Plenty", lat: -37.6878, lng: 176.1651, transport: "ship" },

  // ── Pantry / Grains / Sugar ───────────────────────────────────────────────
  "robin hood":         { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "five roses":         { country: "Canada", flag: "🇨🇦", region: "Quebec",     lat: 45.5017, lng: -73.5673, transport: "truck" },
  "rogers":             { country: "Canada", flag: "🇨🇦", region: "Manitoba",   lat: 49.8951, lng: -97.1384, transport: "truck" },
  "lantic":             { country: "Canada", flag: "🇨🇦", region: "Quebec",     lat: 45.5017, lng: -73.5673, transport: "truck" },
  "redpath":            { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.6532, lng: -79.3832, transport: "truck" },
  "imperial sugar":     { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "c&h":                { country: "USA", flag: "🇺🇸", region: "Hawaii",        lat: 20.7967, lng: -156.3319, transport: "ship" },
  "domino":             { country: "USA", flag: "🇺🇸", region: "New York",      lat: 40.7128, lng: -74.0060, transport: "truck" },
  "quaker":             { country: "USA", flag: "🇺🇸", region: "Illinois",      lat: 41.8781, lng: -87.6298, transport: "truck" },
  "uncle ben's":        { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "uncle bens":         { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "ben's original":     { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "bens original":      { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "minute rice":        { country: "USA", flag: "🇺🇸", region: "New Jersey",    lat: 40.0583, lng: -74.4057, transport: "truck" },
  "president's choice": { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "presidents choice":  { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "no name":            { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "great value":        { country: "USA", flag: "🇺🇸", region: "Arkansas",      lat: 36.1627, lng: -94.1577, transport: "truck" },

  // ── Snacks / Beverages ────────────────────────────────────────────────────
  "coca-cola":          { country: "USA", flag: "🇺🇸", region: "Georgia",       lat: 33.749, lng: -84.388, transport: "truck" },
  "coca cola":          { country: "USA", flag: "🇺🇸", region: "Georgia",       lat: 33.749, lng: -84.388, transport: "truck" },
  "pepsi":              { country: "USA", flag: "🇺🇸", region: "New York",      lat: 40.7128, lng: -74.0060, transport: "truck" },
  "lays":               { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "pringles":           { country: "USA", flag: "🇺🇸", region: "Ohio",          lat: 40.4173, lng: -82.9071, transport: "truck" },
  "ruffles":            { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "oreo":               { country: "USA", flag: "🇺🇸", region: "Illinois",      lat: 41.8781, lng: -87.6298, transport: "truck" },
  "chips ahoy":         { country: "USA", flag: "🇺🇸", region: "Illinois",      lat: 41.8781, lng: -87.6298, transport: "truck" },
  "cheetos":            { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "doritos":            { country: "USA", flag: "🇺🇸", region: "Texas",         lat: 29.7604, lng: -95.3698, transport: "truck" },
  "kellogg's":          { country: "USA", flag: "🇺🇸", region: "Michigan",      lat: 42.3314, lng: -83.0458, transport: "truck" },
  "kelloggs":           { country: "USA", flag: "🇺🇸", region: "Michigan",      lat: 42.3314, lng: -83.0458, transport: "truck" },
  "general mills":      { country: "USA", flag: "🇺🇸", region: "Minnesota",     lat: 44.9778, lng: -93.265, transport: "truck" },
  "post":               { country: "USA", flag: "🇺🇸", region: "Missouri",      lat: 38.5767, lng: -92.1735, transport: "truck" },
  "nature valley":      { country: "USA", flag: "🇺🇸", region: "Minnesota",     lat: 44.9778, lng: -93.265, transport: "truck" },
  "cliff bar":          { country: "USA", flag: "🇺🇸", region: "California",    lat: 37.7749, lng: -122.4194, transport: "truck" },
  "clif bar":           { country: "USA", flag: "🇺🇸", region: "California",    lat: 37.7749, lng: -122.4194, transport: "truck" },
  "kind":               { country: "USA", flag: "🇺🇸", region: "New York",      lat: 40.7128, lng: -74.0060, transport: "truck" },
  "kirkland":           { country: "USA", flag: "🇺🇸", region: "Washington",    lat: 47.6062, lng: -122.3321, transport: "truck" },
  "compliments":        { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },

  // ── Meat / Deli ───────────────────────────────────────────────────────────
  "maple leaf":         { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.7, lng: -79.4, transport: "truck" },
  "schneiders":         { country: "Canada", flag: "🇨🇦", region: "Ontario",    lat: 43.4643, lng: -80.5204, transport: "truck" },
  "johnsonville":       { country: "USA", flag: "🇺🇸", region: "Wisconsin",     lat: 44.5, lng: -89.5, transport: "truck" },
  "jimmy dean":         { country: "USA", flag: "🇺🇸", region: "Virginia",      lat: 37.4316, lng: -78.6569, transport: "truck" },
  "oscar mayer":        { country: "USA", flag: "🇺🇸", region: "Wisconsin",     lat: 43.0731, lng: -89.4012, transport: "truck" },
  "hormel":             { country: "USA", flag: "🇺🇸", region: "Minnesota",     lat: 43.6666, lng: -92.998, transport: "truck" },
  "spam":               { country: "USA", flag: "🇺🇸", region: "Minnesota",     lat: 43.6666, lng: -92.998, transport: "truck" },
  "tyson":              { country: "USA", flag: "🇺🇸", region: "Arkansas",      lat: 36.0, lng: -94.2, transport: "truck" },

  // ── Condiments / Sauces ───────────────────────────────────────────────────
  "heinz":              { country: "USA", flag: "🇺🇸", region: "Pennsylvania",  lat: 40.4406, lng: -79.9959, transport: "truck" },
  "french's":           { country: "USA", flag: "🇺🇸", region: "New Jersey",    lat: 40.0583, lng: -74.4057, transport: "truck" },
  "hellmann's":         { country: "USA", flag: "🇺🇸", region: "New York",      lat: 40.7128, lng: -74.0060, transport: "truck" },
  "hellmanns":          { country: "USA", flag: "🇺🇸", region: "New York",      lat: 40.7128, lng: -74.0060, transport: "truck" },
  "campbell's":         { country: "USA", flag: "🇺🇸", region: "New Jersey",    lat: 39.9526, lng: -75.1652, transport: "truck" },
  "campbells":          { country: "USA", flag: "🇺🇸", region: "New Jersey",    lat: 39.9526, lng: -75.1652, transport: "truck" },
  "hunt's":             { country: "USA", flag: "🇺🇸", region: "California",    lat: 36.7783, lng: -119.4179, transport: "truck" },
  "hunts":              { country: "USA", flag: "🇺🇸", region: "California",    lat: 36.7783, lng: -119.4179, transport: "truck" },
  "classico":           { country: "USA", flag: "🇺🇸", region: "Pennsylvania",  lat: 40.4406, lng: -79.9959, transport: "truck" },
  "prego":              { country: "USA", flag: "🇺🇸", region: "New Jersey",    lat: 39.9526, lng: -75.1652, transport: "truck" },
  "rao's":              { country: "USA", flag: "🇺🇸", region: "New York",      lat: 40.7128, lng: -74.0060, transport: "truck" },
};

// ─── GENERIC PRODUCE ORIGINS (by product name when no brand is found) ────────
// Based on typical North American grocery supply chains.

const PRODUCE_ORIGINS: Record<string, BrandOrigin> = {
  // Tropical / exotic (almost always imported)
  "mango":      { country: "Mexico", flag: "🇲🇽", region: "Michoacán",    lat: 19.5665, lng: -101.7068, transport: "truck" },
  "banana":     { country: "Ecuador", flag: "🇪🇨", region: "Guayas",      lat: -2.1894, lng: -79.8891, transport: "ship" },
  "pineapple":  { country: "Costa Rica", flag: "🇨🇷", region: "Alajuela", lat: 10.4035, lng: -84.3870, transport: "ship" },
  "avocado":    { country: "Mexico", flag: "🇲🇽", region: "Michoacán",    lat: 19.5665, lng: -101.7068, transport: "truck" },
  "lime":       { country: "Mexico", flag: "🇲🇽", region: "Veracruz",     lat: 19.173, lng: -96.134, transport: "truck" },
  "lemon":      { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "orange":     { country: "USA", flag: "🇺🇸", region: "Florida",          lat: 27.9944, lng: -81.7603, transport: "truck" },
  "grapefruit": { country: "USA", flag: "🇺🇸", region: "Florida",          lat: 27.9944, lng: -81.7603, transport: "truck" },
  "kiwi":       { country: "New Zealand", flag: "🇳🇿", region: "Bay of Plenty", lat: -37.6878, lng: 176.1651, transport: "ship" },

  // Berries (mostly California or Mexico)
  "strawberry": { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "blueberry":  { country: "USA", flag: "🇺🇸", region: "Michigan",         lat: 44.3148, lng: -85.6024, transport: "truck" },
  "raspberry":  { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "blackberry": { country: "USA", flag: "🇺🇸", region: "Oregon",           lat: 43.8041, lng: -120.5542, transport: "truck" },

  // Vegetables
  "tomato":     { country: "Canada", flag: "🇨🇦", region: "Ontario",      lat: 43.7, lng: -79.4, transport: "truck" },
  "lettuce":    { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "spinach":    { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "broccoli":   { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "cauliflower":{ country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "pepper":     { country: "Mexico", flag: "🇲🇽", region: "Sonora",        lat: 29.2972, lng: -110.3309, transport: "truck" },
  "cucumber":   { country: "Canada", flag: "🇨🇦", region: "Ontario",      lat: 43.7, lng: -79.4, transport: "truck" },
  "carrot":     { country: "Canada", flag: "🇨🇦", region: "Ontario",      lat: 43.7, lng: -79.4, transport: "truck" },
  "onion":      { country: "USA", flag: "🇺🇸", region: "Idaho",            lat: 44.0682, lng: -114.742, transport: "truck" },
  "garlic":     { country: "China", flag: "🇨🇳", region: "Shandong",       lat: 36.3427, lng: 118.3496, transport: "ship" },
  "mushroom":   { country: "Canada", flag: "🇨🇦", region: "Ontario",      lat: 43.7, lng: -79.4, transport: "truck" },
  "potato":     { country: "USA", flag: "🇺🇸", region: "Idaho",            lat: 44.0682, lng: -114.742, transport: "truck" },
  "sweet potato":{ country: "USA", flag: "🇺🇸", region: "North Carolina", lat: 35.7596, lng: -79.0193, transport: "truck" },
  "asparagus":  { country: "Mexico", flag: "🇲🇽", region: "Sonora",        lat: 29.2972, lng: -110.3309, transport: "truck" },
  "celery":     { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "zucchini":   { country: "Mexico", flag: "🇲🇽", region: "Sinaloa",       lat: 25.0261, lng: -107.0686, transport: "truck" },
  "corn":       { country: "USA", flag: "🇺🇸", region: "Iowa",             lat: 41.878, lng: -93.0977, transport: "truck" },

  // Staples
  "apple":      { country: "Canada", flag: "🇨🇦", region: "British Columbia", lat: 49.8880, lng: -119.4960, transport: "truck" },
  "pear":       { country: "USA", flag: "🇺🇸", region: "Washington",      lat: 47.6062, lng: -122.3321, transport: "truck" },
  "peach":      { country: "USA", flag: "🇺🇸", region: "Georgia",          lat: 32.1574, lng: -82.9071, transport: "truck" },
  "grape":      { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "cherry":     { country: "USA", flag: "🇺🇸", region: "Washington",      lat: 47.6062, lng: -122.3321, transport: "truck" },
  "plum":       { country: "USA", flag: "🇺🇸", region: "California",      lat: 36.7783, lng: -119.4179, transport: "truck" },
  "watermelon": { country: "USA", flag: "🇺🇸", region: "Georgia",          lat: 32.1574, lng: -82.9071, transport: "truck" },
};

// ─── LOOKUP FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Look up the origin for a product by brand name.
 * Returns null if the brand isn't in the database.
 */
export function lookupBrandOrigin(productName: string, brand?: string): BrandOrigin | null {
  const searchTerms = [
    brand?.toLowerCase().trim(),
    productName.toLowerCase().trim(),
  ].filter(Boolean) as string[];

  for (const term of searchTerms) {
    // Exact match first
    if (BRAND_ORIGINS[term]) return BRAND_ORIGINS[term];

    // Partial match — check if any known brand appears within the term
    for (const [key, origin] of Object.entries(BRAND_ORIGINS)) {
      if (term.includes(key) || key.includes(term.split(" ")[0])) {
        return origin;
      }
    }
  }
  return null;
}

/**
 * Look up the typical origin for a raw produce item by product name.
 * Returns null if not found in the produce database.
 */
export function lookupProduceOrigin(productName: string): BrandOrigin | null {
  const name = productName.toLowerCase();

  // Exact and partial produce matches
  for (const [key, origin] of Object.entries(PRODUCE_ORIGINS)) {
    if (name.includes(key)) return origin;
  }
  return null;
}

/**
 * Main origin resolver — tries brand DB first, then produce DB, then null.
 */
export function resolveProductOrigin(productName: string, brand?: string): BrandOrigin | null {
  return lookupBrandOrigin(productName, brand) ?? lookupProduceOrigin(productName);
}
