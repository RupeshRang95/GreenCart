// ── User Data ──
export const userData = {
  name: "Kabir Lakhanpal",
  handle: "@kabir_green",
  avatar: "KL",
  level: 14,
  levelName: "Sapling",
  levelIcon: "🌿",
  xp: 2840,
  xpNext: 3500,
  esgScore: 642,
  esgGrade: "B-",
  esgChange: +12,
  streak: 12,
  totalScans: 47,
  totalItems: 312,
  savedCO2: 48.3,
  savedMoney: 127.5,
  pctLocal: 42,
  memberSince: "Jan 2026",
};

// ── Level System ──
export const levelTiers = [
  { min: 1, max: 5, name: "Seedling", icon: "🌱" },
  { min: 6, max: 10, name: "Sprout", icon: "🌿" },
  { min: 11, max: 20, name: "Sapling", icon: "🪴" },
  { min: 21, max: 35, name: "Tree", icon: "🌳" },
  { min: 36, max: 50, name: "Forest", icon: "🌲" },
];

// ── Badges ──
export interface Badge {
  name: string;
  icon: string;
  earned: boolean;
  progress?: number;
  description: string;
}
export const badges: Badge[] = [
  {
    name: "First Scan",
    icon: "📱",
    earned: true,
    description: "Scanned your first receipt",
  },
  {
    name: "10 Trips",
    icon: "🛒",
    earned: true,
    description: "Completed 10 grocery trips",
  },
  {
    name: "50% Local",
    icon: "📍",
    earned: false,
    progress: 84,
    description: "50% of items sourced locally",
  },
  {
    name: "Zero Air Freight",
    icon: "✈️",
    earned: false,
    progress: 60,
    description: "A full trip with no air-freighted items",
  },
  {
    name: "Season Pro",
    icon: "🍂",
    earned: true,
    description: "Bought 90%+ in-season items",
  },
  {
    name: "Streak Master",
    icon: "🔥",
    earned: true,
    description: "12 week streak",
  },
  {
    name: "Community Voice",
    icon: "💬",
    earned: false,
    progress: 40,
    description: "Posted 10 tips",
  },
  {
    name: "Carbon Cutter",
    icon: "🪓",
    earned: true,
    description: "Saved 25kg CO₂",
  },
];

// ── Community Posts ──
export interface CommunityPost {
  id: number;
  user: string;
  handle: string;
  avatar: string;
  level: number;
  levelName: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  time: string;
  tags: string[];
  receiptScore?: { score: number; grade: string };
}
export const communityPosts: CommunityPost[] = [
  {
    id: 1,
    user: "Priya Sharma",
    handle: "@priya_eco",
    avatar: "PS",
    level: 18,
    levelName: "Sapling",
    content:
      "Just discovered an amazing local farm stand only 3km away! Their organic lettuce scored 96. No more imported greens for me! 🥬",
    likes: 87,
    comments: 14,
    shares: 23,
    time: "2h ago",
    tags: ["#LocalFirst", "#FarmFresh"],
    receiptScore: { score: 724, grade: "B+" },
  },
  {
    id: 2,
    user: "Marcus Rivera",
    handle: "@marcus_green",
    avatar: "MR",
    level: 22,
    levelName: "Tree",
    content:
      "Swapped imported avocados for local greenhouse ones — carbon dropped from 4.2kg to 0.8kg per item! 🥑 Small changes, massive impact.",
    likes: 120,
    comments: 24,
    shares: 31,
    time: "4h ago",
    tags: ["#ItemSwap", "#CO2Reduction"],
  },
  {
    id: 3,
    user: "Aisha Khan",
    handle: "@aisha_sustain",
    avatar: "AK",
    level: 8,
    levelName: "Sprout",
    content:
      "Scanned my entire Costco receipt — 78% of items were within 200km! The scanner is honestly addictive 📱",
    likes: 65,
    comments: 11,
    shares: 15,
    time: "6h ago",
    tags: ["#ReceiptScan", "#LocalFirst"],
    receiptScore: { score: 681, grade: "B" },
  },
  {
    id: 4,
    user: "Dev Patel",
    handle: "@dev_planet",
    avatar: "DP",
    level: 15,
    levelName: "Sapling",
    content:
      "🎉 Just hit Level 15! This journey to sustainable shopping has been incredible. 340 items swapped so far!",
    likes: 103,
    comments: 19,
    shares: 28,
    time: "8h ago",
    tags: ["#EcoWarrior", "#LevelUp"],
  },
  {
    id: 5,
    user: "Luna Weber",
    handle: "@luna_earth",
    avatar: "LW",
    level: 31,
    levelName: "Tree",
    content:
      "Our community has collectively saved 2.4 tonnes of CO₂ this month! 🌍 Every scan counts.",
    likes: 98,
    comments: 22,
    shares: 19,
    time: "12h ago",
    tags: ["#CO2Reduction", "#Community"],
  },
];

// ── Weekly Challenge ──
export const weeklyChallenge = {
  name: "Zero Air Freight Week",
  description: "Buy only ground/sea-shipped items for 7 days",
  progress: 4,
  total: 7,
  daysLeft: 3,
  xpReward: 200,
};

// ── Trip / Receipt Data ──
export interface ScannedItem {
  id: string;
  /** Open Food Facts or store barcode when scanned */
  barcode?: string;
  name: string;
  brand?: string;
  category:
    | "fruit"
    | "vegetable"
    | "meat"
    | "dairy"
    | "grain"
    | "packaged"
    | "bakery";
  price: number;
  co2: number; // grams
  origin: {
    country: string;
    flag: string;
    region?: string;
    lat: number;
    lng: number;
    distance: number;
  };
  transport: "ship" | "truck" | "air" | "rail";
  esgScore: number;
  inSeason: boolean;
  localAlt?: {
    name: string;
    origin: string;
    distance: number;
    co2: number;
    price: number;
  };
  breakdown: {
    farming: number;
    processing: number;
    transport: number;
    packaging: number;
  };
}

export const sampleReceiptItems: ScannedItem[] = [
  {
    id: "1",
    name: "Strawberries",
    brand: "Driscoll's",
    category: "fruit",
    price: 4.99,
    co2: 1420,
    origin: {
      country: "Mexico",
      flag: "🇲🇽",
      region: "Baja California",
      lat: 30.5,
      lng: -115.9,
      distance: 3500,
    },
    transport: "truck",
    esgScore: 45,
    inSeason: false,
    localAlt: {
      name: "Ontario Strawberries",
      origin: "Niagara, ON",
      distance: 120,
      co2: 180,
      price: 5.49,
    },
    breakdown: { farming: 30, processing: 10, transport: 45, packaging: 15 },
  },
  {
    id: "2",
    name: "Free-Range Eggs",
    brand: "Burnbrae",
    category: "dairy",
    price: 6.49,
    co2: 320,
    origin: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Ontario",
      lat: 43.5,
      lng: -80.5,
      distance: 85,
    },
    transport: "truck",
    esgScore: 88,
    inSeason: true,
    breakdown: { farming: 60, processing: 15, transport: 10, packaging: 15 },
  },
  {
    id: "3",
    name: "Bananas",
    brand: "Chiquita",
    category: "fruit",
    price: 1.49,
    co2: 860,
    origin: {
      country: "Ecuador",
      flag: "🇪🇨",
      region: "Guayaquil",
      lat: -2.2,
      lng: -79.9,
      distance: 5400,
    },
    transport: "ship",
    esgScore: 52,
    inSeason: true,
    localAlt: {
      name: "Local Apples",
      origin: "Niagara, ON",
      distance: 120,
      co2: 270,
      price: 1.29,
    },
    breakdown: { farming: 35, processing: 8, transport: 42, packaging: 15 },
  },
  {
    id: "4",
    name: "Salmon Fillet",
    brand: "Fresh",
    category: "meat",
    price: 14.99,
    co2: 4200,
    origin: {
      country: "Canada",
      flag: "🇨🇦",
      region: "British Columbia",
      lat: 49.3,
      lng: -123.1,
      distance: 4300,
    },
    transport: "air",
    esgScore: 38,
    inSeason: true,
    localAlt: {
      name: "Lake Trout",
      origin: "Lake Huron, ON",
      distance: 200,
      co2: 890,
      price: 12.99,
    },
    breakdown: { farming: 25, processing: 12, transport: 55, packaging: 8 },
  },
  {
    id: "5",
    name: "Sourdough Bread",
    category: "bakery",
    price: 5.0,
    co2: 150,
    origin: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Kitchener, ON",
      lat: 43.45,
      lng: -80.48,
      distance: 8,
    },
    transport: "truck",
    esgScore: 94,
    inSeason: true,
    breakdown: { farming: 40, processing: 35, transport: 5, packaging: 20 },
  },
  {
    id: "6",
    name: "Rice 5kg",
    brand: "Jasmine",
    category: "grain",
    price: 8.99,
    co2: 3800,
    origin: {
      country: "Thailand",
      flag: "🇹🇭",
      region: "Chiang Mai",
      lat: 18.8,
      lng: 98.9,
      distance: 13500,
    },
    transport: "ship",
    esgScore: 32,
    inSeason: true,
    breakdown: { farming: 45, processing: 10, transport: 35, packaging: 10 },
  },
  {
    id: "7",
    name: "Organic Avocados",
    category: "fruit",
    price: 3.99,
    co2: 2100,
    origin: {
      country: "Peru",
      flag: "🇵🇪",
      region: "Lima",
      lat: -12.0,
      lng: -77.0,
      distance: 6200,
    },
    transport: "ship",
    esgScore: 40,
    inSeason: false,
    localAlt: {
      name: "Greenhouse Avocados",
      origin: "Leamington, ON",
      distance: 300,
      co2: 650,
      price: 4.49,
    },
    breakdown: { farming: 35, processing: 10, transport: 40, packaging: 15 },
  },
  {
    id: "8",
    name: "Local Honey",
    category: "packaged",
    price: 8.99,
    co2: 95,
    origin: {
      country: "Canada",
      flag: "🇨🇦",
      region: "Waterloo, ON",
      lat: 43.46,
      lng: -80.52,
      distance: 12,
    },
    transport: "truck",
    esgScore: 97,
    inSeason: true,
    breakdown: { farming: 50, processing: 25, transport: 5, packaging: 20 },
  },
];

// ── Trip History ──
export interface Trip {
  id: number;
  date: string;
  store: string;
  itemCount: number;
  esgScore: number;
  grade: string;
  totalSpent: number;
  co2Total: number;
  pctLocal: number;
}
export const tripHistory: Trip[] = [
  {
    id: 1,
    date: "Mar 27",
    store: "Whole Foods",
    itemCount: 8,
    esgScore: 642,
    grade: "B-",
    totalSpent: 54.93,
    co2Total: 12.95,
    pctLocal: 34,
  },
  {
    id: 2,
    date: "Mar 24",
    store: "Farmer's Market",
    itemCount: 5,
    esgScore: 781,
    grade: "A-",
    totalSpent: 28.49,
    co2Total: 3.2,
    pctLocal: 80,
  },
  {
    id: 3,
    date: "Mar 20",
    store: "Metro",
    itemCount: 11,
    esgScore: 498,
    grade: "C",
    totalSpent: 67.32,
    co2Total: 22.1,
    pctLocal: 18,
  },
  {
    id: 4,
    date: "Mar 16",
    store: "Costco",
    itemCount: 14,
    esgScore: 534,
    grade: "C+",
    totalSpent: 112.88,
    co2Total: 31.4,
    pctLocal: 22,
  },
  {
    id: 5,
    date: "Mar 12",
    store: "Farmer's Market",
    itemCount: 6,
    esgScore: 802,
    grade: "A",
    totalSpent: 31.2,
    co2Total: 2.1,
    pctLocal: 92,
  },
];

// ── Score Trend (for portfolio chart) ──
export const scoreTrend = [
  { date: "Feb 1", score: 580 },
  { date: "Feb 8", score: 595 },
  { date: "Feb 15", score: 610 },
  { date: "Feb 22", score: 598 },
  { date: "Mar 1", score: 622 },
  { date: "Mar 8", score: 615 },
  { date: "Mar 15", score: 638 },
  { date: "Mar 22", score: 630 },
  { date: "Mar 27", score: 642 },
];

// ── Carbon Breakdown by Category ──
export const carbonBreakdown = [
  {
    category: "Meat & Fish",
    icon: "🥩",
    co2: 8.4,
    pct: 38,
    color: "destructive" as const,
  },
  {
    category: "Dairy",
    icon: "🥛",
    co2: 4.2,
    pct: 19,
    color: "warning" as const,
  },
  {
    category: "Produce",
    icon: "🥬",
    co2: 3.8,
    pct: 17,
    color: "primary" as const,
  },
  {
    category: "Grains",
    icon: "🌾",
    co2: 3.1,
    pct: 14,
    color: "warning" as const,
  },
  {
    category: "Packaged",
    icon: "📦",
    co2: 1.8,
    pct: 8,
    color: "primary" as const,
  },
  {
    category: "Bakery",
    icon: "🍞",
    co2: 0.9,
    pct: 4,
    color: "primary" as const,
  },
];

// ── Marketplace ──
export interface LocalBusiness {
  id: number;
  name: string;
  type: string;
  typePill: string;
  distance: number;
  rating: number;
  reviews: number;
  esg: number;
  description: string;
  products: string[];
  img: string;
}
export const marketplaceData: LocalBusiness[] = [
  {
    id: 1,
    name: "Herrle's Country Farm Market",
    type: "farm_market",
    typePill: "Farm Market",
    distance: 15,
    rating: 4.7,
    reviews: 342,
    esg: 94,
    description: "Family-owned farm market in St. Agatha since 1977",
    products: ["Strawberries", "Corn", "Apples", "Pumpkins"],
    img: "🌽",
  },
  {
    id: 2,
    name: "St. Jacobs Farmers' Market",
    type: "farmers_market",
    typePill: "Farmers' Market",
    distance: 12,
    rating: 4.8,
    reviews: 1240,
    esg: 96,
    description: "Largest year-round farmers' market in Canada",
    products: ["Vegetables", "Meats", "Baked Goods", "Honey"],
    img: "🏪",
  },
  {
    id: 3,
    name: "Pfenning's Organic Farm",
    type: "farm",
    typePill: "Organic Farm",
    distance: 22,
    rating: 4.6,
    reviews: 189,
    esg: 98,
    description: "100% certified organic vegetables, year-round CSA boxes",
    products: ["Carrots", "Kale", "Potatoes", "Beets"],
    img: "🥕",
  },
  {
    id: 4,
    name: "Full Circle Foods",
    type: "co_op",
    typePill: "Co-op",
    distance: 4,
    rating: 4.5,
    reviews: 87,
    esg: 91,
    description: "Zero-waste grocery co-op in downtown Kitchener",
    products: ["Bulk Grains", "Spices", "Oils", "Snacks"],
    img: "♻️",
  },
  {
    id: 5,
    name: "Martin's Family Fruit Farm",
    type: "farm",
    typePill: "Farm",
    distance: 35,
    rating: 4.9,
    reviews: 521,
    esg: 97,
    description: "Award-winning apple farm with 200+ heritage varieties",
    products: ["Apples", "Cider", "Apple Butter"],
    img: "🍎",
  },
  {
    id: 6,
    name: "Wellesley Apple Butter & Cheese",
    type: "farm_market",
    typePill: "Farm Market",
    distance: 28,
    rating: 4.4,
    reviews: 156,
    esg: 90,
    description: "Traditional Mennonite community market with artisan goods",
    products: ["Cheese", "Apple Butter", "Preserves", "Bread"],
    img: "🧀",
  },
];

// ── Leaderboard ──
export const leaderboard = [
  { rank: 1, name: "Luna W.", score: 812, level: 31, avatar: "LW" },
  { rank: 2, name: "Marcus R.", score: 788, level: 22, avatar: "MR" },
  { rank: 3, name: "Priya S.", score: 724, level: 18, avatar: "PS" },
  { rank: 7, name: "You", score: 642, level: 14, avatar: "KL", isUser: true },
];

// ── Swap History ──
export const swapHistory = [
  {
    from: "Mexican Strawberries",
    to: "Ontario Strawberries",
    co2Saved: 1.24,
    date: "Mar 25",
  },
  {
    from: "BC Salmon (air)",
    to: "Lake Huron Trout",
    co2Saved: 3.31,
    date: "Mar 22",
  },
  {
    from: "California Almonds",
    to: "Ontario Hazelnuts",
    co2Saved: 0.89,
    date: "Mar 18",
  },
  {
    from: "Imported Avocados",
    to: "Greenhouse Avocados",
    co2Saved: 1.45,
    date: "Mar 14",
  },
];

// ── User Location ──
export const userLocation = {
  city: "Waterloo",
  province: "Ontario",
  lat: 43.4643,
  lng: -80.5204,
};
