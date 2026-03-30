/** Rough representative points for origin routing (not border-accurate). */
export const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  canada: { lat: 56, lng: -96 },
  mexico: { lat: 23, lng: -102 },
  "united states": { lat: 38, lng: -97 },
  usa: { lat: 38, lng: -97 },
  ecuador: { lat: -1.8, lng: -78.2 },
  peru: { lat: -9.2, lng: -75 },
  thailand: { lat: 15, lng: 100 },
  china: { lat: 35, lng: 105 },
  india: { lat: 22, lng: 79 },
  france: { lat: 46, lng: 2 },
  spain: { lat: 40, lng: -3 },
  "united kingdom": { lat: 54, lng: -2 },
  uk: { lat: 54, lng: -2 },
  germany: { lat: 51, lng: 10 },
  netherlands: { lat: 52, lng: 5 },
  brazil: { lat: -10, lng: -55 },
  chile: { lat: -35, lng: -71 },
  australia: { lat: -25, lng: 133 },
  "new zealand": { lat: -41, lng: 174 },
  japan: { lat: 36, lng: 138 },
  "south korea": { lat: 36, lng: 128 },
  vietnam: { lat: 16, lng: 106 },
  italy: { lat: 42, lng: 12 },
  poland: { lat: 52, lng: 19 },
  ireland: { lat: 53, lng: -8 },
  norway: { lat: 62, lng: 10 },
  morocco: { lat: 32, lng: -6 },
  turkey: { lat: 39, lng: 35 },
  israel: { lat: 31, lng: 35 },
  argentina: { lat: -34, lng: -64 },
  colombia: { lat: 4, lng: -72 },
};

const FLAG: Record<string, string> = {
  canada: "🇨🇦",
  mexico: "🇲🇽",
  "united states": "🇺🇸",
  usa: "🇺🇸",
  ecuador: "🇪🇨",
  peru: "🇵🇪",
  thailand: "🇹🇭",
  china: "🇨🇳",
  india: "🇮🇳",
  france: "🇫🇷",
  spain: "🇪🇸",
  "united kingdom": "🇬🇧",
  uk: "🇬🇧",
  germany: "🇩🇪",
  netherlands: "🇳🇱",
  brazil: "🇧🇷",
  chile: "🇨🇱",
  australia: "🇦🇺",
  "new zealand": "🇳🇿",
  japan: "🇯🇵",
  "south korea": "🇰🇷",
  vietnam: "🇻🇳",
  italy: "🇮🇹",
  poland: "🇵🇱",
  ireland: "🇮🇪",
  norway: "🇳🇴",
  morocco: "🇲🇦",
  turkey: "🇹🇷",
  israel: "🇮🇱",
  argentina: "🇦🇷",
  colombia: "🇨🇴",
};

export function normalizeCountryKey(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const k = raw.trim().toLowerCase();
  let cleaned = k.replace(/^..:?\s*/, "").split(/[,;]/)[0]?.trim() ?? k;
  cleaned = cleaned.replace(/-/g, " ");
  if (COUNTRY_COORDS[cleaned]) return cleaned;
  const aliases: Record<string, string> = {
    ca: "canada",
    us: "united states",
    "u.s.a.": "united states",
    "united-states": "united states",
    america: "united states",
    uk: "united kingdom",
    england: "united kingdom",
    gb: "united kingdom",
  };
  return aliases[cleaned] ?? (COUNTRY_COORDS[cleaned] ? cleaned : null);
}

export function coordsForCountry(countryTag: string | undefined): {
  lat: number;
  lng: number;
  country: string;
  flag: string;
} | null {
  const key = normalizeCountryKey(countryTag);
  if (!key || !COUNTRY_COORDS[key]) return null;
  const c = COUNTRY_COORDS[key];
  return {
    lat: c.lat,
    lng: c.lng,
    country: key.replace(/\b\w/g, (s) => s.toUpperCase()),
    flag: FLAG[key] ?? "🌍",
  };
}

/** Never null — avoids crashes when OFF / UPC DB use rare country tags. */
export const DEFAULT_ORIGIN_GEO = {
  lat: 43.4643,
  lng: -80.5204,
  country: "Canada",
  flag: "🇨🇦",
} as const;

export function coordsForCountryOrDefault(countryTag: string | undefined): {
  lat: number;
  lng: number;
  country: string;
  flag: string;
} {
  return coordsForCountry(countryTag) ?? coordsForCountry("canada") ?? DEFAULT_ORIGIN_GEO;
}
