import { OFFProduct } from "./openFoodFacts";
import { ScannedItem } from "@/data/mockData";
import { categoryFromOffTags, countryFromProduct } from "./openFoodFacts";

// 🌍 Basic country → coordinates map (expand later)
const COUNTRY_COORDS: Record<
  string,
  { lat: number; lng: number; flag: string }
> = {
  canada: { lat: 56.1304, lng: -106.3468, flag: "🇨🇦" },
  "united states": { lat: 37.0902, lng: -95.7129, flag: "🇺🇸" },
  usa: { lat: 37.0902, lng: -95.7129, flag: "🇺🇸" },
  mexico: { lat: 23.6345, lng: -102.5528, flag: "🇲🇽" },
  france: { lat: 46.6034, lng: 1.8883, flag: "🇫🇷" },
  china: { lat: 35.8617, lng: 104.1954, flag: "🇨🇳" },
};

// 📍 User location (Waterloo, Canada)
const USER_COORDS = { lat: 43.4643, lng: -80.5204 };

// 📏 Distance calculator (Haversine)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function convertOffProductToScannedItem(p: OFFProduct): ScannedItem {
  // 🟡 Step 1: get country from OFF
  const rawCountry = countryFromProduct(p)?.toLowerCase() ?? "unknown";

  // 🟡 Step 2: normalize name
  const countryKey = rawCountry.replace(/en:/, "").trim();

  // 🟡 Step 3: lookup coords
  const location = COUNTRY_COORDS[countryKey] ?? {
    lat: USER_COORDS.lat,
    lng: USER_COORDS.lng,
    flag: "🌍",
  };

  // 🟡 Step 4: compute distance
  const distance = haversine(
    USER_COORDS.lat,
    USER_COORDS.lng,
    location.lat,
    location.lng,
  );

  return {
    id: p.code,
    barcode: p.code,
    name: p.product_name ?? "Unknown Product",
    brand: p.brands,
    category: categoryFromOffTags(p.categories_tags),

    price: 0,

    // 🟢 Simple CO2 estimate (distance-based for now)
    co2: Math.round(distance * 0.2),

    origin: {
      country: countryKey,
      region: countryKey,
      flag: location.flag,
      distance,
      lat: location.lat,
      lng: location.lng,
    },

    // 🟢 Transport logic
    transport: distance > 5000 ? "ship" : distance > 2000 ? "rail" : "truck",

    // 🟢 Basic ESG score
    esgScore: Math.max(30, 100 - Math.round(distance / 100)),

    inSeason: true,

    breakdown: {
      farming: 50,
      processing: 20,
      transport: 20,
      packaging: 10,
    },
  };
}
