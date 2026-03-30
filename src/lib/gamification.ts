/**
 * GreenCart Gamification Engine
 * XP, levels, badges, streaks — all persisted in localStorage.
 */
import type { ScannedItem } from "@/data/mockData";

// ── Level system ──────────────────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  name: string;
  icon: string;
  xpRequired: number;     // XP to reach this level
  xpNextLevel: number;    // XP to reach next level (0 if max)
}

const LEVEL_TIERS = [
  { min: 1,  max: 5,  name: "Seedling",   icon: "🌱" },
  { min: 6,  max: 10, name: "Sprout",     icon: "🌿" },
  { min: 11, max: 15, name: "Sapling",    icon: "🪴" },
  { min: 16, max: 25, name: "Tree",       icon: "🌳" },
  { min: 26, max: 35, name: "Forest",     icon: "🌲" },
  { min: 36, max: 50, name: "Grove",      icon: "🌴" },
  { min: 51, max: 99, name: "Ecosystem",  icon: "🌍" },
];

/** XP required to reach each level (index = level number). Level 0 unused. */
const LEVEL_XP_THRESHOLDS = [
  0,     // L0 (unused)
  0,     // L1
  100,   // L2
  250,   // L3
  500,   // L4
  800,   // L5
  1200,  // L6
  1700,  // L7
  2400,  // L8
  3200,  // L9
  4200,  // L10
  5400,  // L11
  6800,  // L12
  8400,  // L13
  10200, // L14
  12200, // L15
  14700, // L16
  17500, // L17
  20700, // L18
  24300, // L19
  28300, // L20
  32800, // L21
  37800, // L22
  43300, // L23
  49300, // L24
  55800, // L25
  62800, // L26+
];

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 1; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) { level = i; break; }
  }
  return level;
}

export function getLevelInfo(xp: number): LevelInfo {
  const level = getLevelFromXP(xp);
  const tier = LEVEL_TIERS.find((t) => level >= t.min && level <= t.max) ?? LEVEL_TIERS[0];
  const xpRequired = LEVEL_XP_THRESHOLDS[Math.min(level, LEVEL_XP_THRESHOLDS.length - 1)] ?? 0;
  const xpNextLevel = LEVEL_XP_THRESHOLDS[Math.min(level + 1, LEVEL_XP_THRESHOLDS.length - 1)] ?? xpRequired;
  return { level, name: tier.name, icon: tier.icon, xpRequired, xpNextLevel };
}

export function getLevelProgress(xp: number): number {
  const { xpRequired, xpNextLevel } = getLevelInfo(xp);
  if (xpNextLevel <= xpRequired) return 100;
  return Math.round(((xp - xpRequired) / (xpNextLevel - xpRequired)) * 100);
}

// ── Badge definitions ─────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "milestone" | "behaviour" | "social" | "streak";
}

export const ALL_BADGES: BadgeDef[] = [
  // Milestone
  { id: "first_scan",       name: "First Scan",        icon: "📱", category: "milestone", description: "Scanned your very first receipt" },
  { id: "trips_10",         name: "10 Trips",           icon: "🛒", category: "milestone", description: "Completed 10 grocery trips" },
  { id: "trips_25",         name: "25 Trips",           icon: "🛒", category: "milestone", description: "Completed 25 grocery trips" },
  { id: "trips_50",         name: "50 Trips",           icon: "🏆", category: "milestone", description: "Completed 50 grocery trips" },
  { id: "items_100",        name: "100 Items",          icon: "📦", category: "milestone", description: "Scanned 100 food items" },
  { id: "items_500",        name: "500 Items",          icon: "📦", category: "milestone", description: "Scanned 500 food items" },
  { id: "level_10",         name: "Level 10",           icon: "🌿", category: "milestone", description: "Reached level 10 (Sprout)" },
  { id: "level_20",         name: "Level 20",           icon: "🌳", category: "milestone", description: "Reached level 20 (Tree)" },
  // Behaviour — eco actions
  { id: "local_hero",       name: "Local Hero",         icon: "📍", category: "behaviour", description: "5 trips with >60% local items" },
  { id: "zero_air",         name: "Zero Air Freight",   icon: "✈️",  category: "behaviour", description: "Complete a full trip with no air-freighted items" },
  { id: "perfect_trip",     name: "Perfect Trip",       icon: "🌟", category: "behaviour", description: "Score A+ on a single trip" },
  { id: "all_local_trip",   name: "All Local Trip",     icon: "🏡", category: "behaviour", description: "80%+ local items on a single trip" },
  { id: "swap_champion",    name: "Swap Champion",      icon: "♻️",  category: "behaviour", description: "Make 10 item swaps to local alternatives" },
  { id: "carbon_10kg",      name: "Carbon Cutter 10kg", icon: "🌍", category: "behaviour", description: "Save 10 kg CO₂ vs baseline" },
  { id: "carbon_50kg",      name: "Carbon Cutter 50kg", icon: "🌎", category: "behaviour", description: "Save 50 kg CO₂ vs baseline" },
  { id: "season_pro",       name: "Season Pro",         icon: "🍂", category: "behaviour", description: "90%+ in-season items on a trip" },
  { id: "veggie_trip",      name: "Veggie Trip",        icon: "🥦", category: "behaviour", description: "Complete a full trip with zero meat/fish" },
  { id: "market_regular",   name: "Market Regular",     icon: "🏪", category: "behaviour", description: "Scan receipts from local markets 3 times" },
  // Social
  { id: "community_voice",  name: "Community Voice",    icon: "💬", category: "social",    description: "Post 10 tips in the community" },
  { id: "group_shopper",    name: "Group Shopper",      icon: "🤝", category: "social",    description: "Log 3 carpool/group grocery trips" },
  // Streaks
  { id: "streak_4w",        name: "4-Week Streak",      icon: "🔥", category: "streak",    description: "Scan every week for 4 weeks" },
  { id: "streak_8w",        name: "8-Week Streak",      icon: "🔥", category: "streak",    description: "Scan every week for 8 weeks" },
  { id: "streak_12w",       name: "Streak Master",      icon: "🔥", category: "streak",    description: "Scan every week for 12 weeks in a row" },
];

// ── XP calculation ────────────────────────────────────────────────────────────

export interface XPBreakdown {
  base: number;
  esgBonus: number;
  localBonus: number;
  organicBonus: number;
  inSeasonBonus: number;
  zeroAirBonus: number;
  allLocalBonus: number;
  perfectTripBonus: number;
  subtotal: number;
  streakMultiplier: number;
  total: number;
  newBadges: BadgeDef[];
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
}

function getStreakMultiplier(weeks: number): number {
  if (weeks >= 12) return 2.0;
  if (weeks >= 8)  return 1.5;
  if (weeks >= 4)  return 1.2;
  return 1.0;
}

// ── Persistent state ──────────────────────────────────────────────────────────

export interface GamificationState {
  xp: number;
  totalScans: number;
  totalItems: number;
  totalCO2SavedG: number;  // grams saved vs "average" shopper baseline
  totalSwaps: number;
  totalPosts: number;
  groupTrips: number;
  localHeroTrips: number;  // trips with >60% local
  marketTrips: number;     // trips from farmers markets
  streak: number;          // consecutive weeks with ≥1 scan
  lastScanWeek: string;    // ISO week key e.g. "2026-W13"
  earnedBadgeIds: string[];
}

const GS_KEY = "greencart_gamification";

const DEFAULT_STATE: GamificationState = {
  xp: 0, totalScans: 0, totalItems: 0, totalCO2SavedG: 0,
  totalSwaps: 0, totalPosts: 0, groupTrips: 0,
  localHeroTrips: 0, marketTrips: 0,
  streak: 0, lastScanWeek: "",
  earnedBadgeIds: [],
};

export function loadGamificationState(): GamificationState {
  try {
    const raw = localStorage.getItem(GS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_STATE }; }
}

function saveGamificationState(s: GamificationState): void {
  try { localStorage.setItem(GS_KEY, JSON.stringify(s)); } catch { /* full */ }
}

function isoWeekKey(date: Date): string {
  // Returns "YYYY-WNN"
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekNumber(key: string): number {
  const m = key.match(/(\d{4})-W(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1]) * 100 + parseInt(m[2]);
}

// ── Badge check helpers ───────────────────────────────────────────────────────

function checkBadges(
  state: GamificationState,
  items: ScannedItem[],
  esgScore: number,
  grade: string,
): string[] {
  const newIds: string[] = [];
  const earned = new Set(state.earnedBadgeIds);
  const earn = (id: string) => { if (!earned.has(id)) { earned.add(id); newIds.push(id); } };

  if (state.totalScans === 1)                           earn("first_scan");
  if (state.totalScans >= 10)                           earn("trips_10");
  if (state.totalScans >= 25)                           earn("trips_25");
  if (state.totalScans >= 50)                           earn("trips_50");
  if (state.totalItems >= 100)                          earn("items_100");
  if (state.totalItems >= 500)                          earn("items_500");
  if (getLevelFromXP(state.xp) >= 10)                  earn("level_10");
  if (getLevelFromXP(state.xp) >= 20)                  earn("level_20");

  const pctLocal = items.filter((i) => i.origin.distance < 200).length / Math.max(items.length, 1);
  if (pctLocal > 0.6)    { state.localHeroTrips += 1; }
  if (state.localHeroTrips >= 5)                        earn("local_hero");
  if (pctLocal >= 0.8)                                  earn("all_local_trip");

  const noAir = items.every((i) => i.transport !== "air");
  if (noAir && items.length >= 3)                       earn("zero_air");

  if (grade === "A+" || esgScore >= 800)                earn("perfect_trip");

  const allInSeason = items.filter((i) => i.category === "fruit" || i.category === "vegetable")
    .every((i) => i.inSeason);
  if (allInSeason && items.some((i) => i.category === "fruit" || i.category === "vegetable"))
    earn("season_pro");

  const noMeat = items.every((i) => i.category !== "meat");
  if (noMeat && items.length >= 3)                      earn("veggie_trip");

  if (state.totalSwaps >= 10)                           earn("swap_champion");
  if (state.totalCO2SavedG >= 10_000)                   earn("carbon_10kg");
  if (state.totalCO2SavedG >= 50_000)                   earn("carbon_50kg");
  if (state.totalPosts >= 10)                           earn("community_voice");
  if (state.groupTrips >= 3)                            earn("group_shopper");
  if (state.marketTrips >= 3)                           earn("market_regular");
  if (state.streak >= 4)                                earn("streak_4w");
  if (state.streak >= 8)                                earn("streak_8w");
  if (state.streak >= 12)                               earn("streak_12w");

  return newIds;
}

// ── Main trip processing function ─────────────────────────────────────────────

/**
 * Call this after every successful scan. Calculates XP, checks badges,
 * updates streak, persists state, and returns the XP breakdown to show
 * in the celebration screen.
 */
export function processTripXP(
  items: ScannedItem[],
  meta: { score: number; grade: string },
  options?: { isMarketTrip?: boolean; isCarpoolTrip?: boolean }
): XPBreakdown {
  const state = loadGamificationState();
  const oldLevel = getLevelFromXP(state.xp);

  // ── Update streak ─────────────────────────────────────────────────────────
  const thisWeek = isoWeekKey(new Date());
  const lastWeek = state.lastScanWeek;
  if (lastWeek === "") {
    state.streak = 1;
  } else if (lastWeek === thisWeek) {
    // already scanned this week — streak unchanged
  } else {
    const lastN = weekNumber(lastWeek);
    const thisN = weekNumber(thisWeek);
    const weeksBetween = thisN - lastN;
    state.streak = weeksBetween === 1 ? state.streak + 1 : 1;
  }
  state.lastScanWeek = thisWeek;

  // ── Counters ──────────────────────────────────────────────────────────────
  state.totalScans += 1;
  state.totalItems += items.length;
  if (options?.isCarpoolTrip) state.groupTrips += 1;
  if (options?.isMarketTrip)  state.marketTrips += 1;

  // Estimate CO₂ saved vs "average" (assume average trip is 15 kg CO₂)
  const tripCO2G = items.reduce((s, i) => s + i.co2, 0);
  const avgBaselineG = 15_000;
  const savedG = Math.max(0, avgBaselineG - tripCO2G);
  state.totalCO2SavedG += savedG;

  // ── XP calculation ────────────────────────────────────────────────────────
  const base = 50;
  const esgBonus = Math.floor(meta.score / 10);
  const localItems = items.filter((i) => i.origin.distance < 200);
  const localBonus = localItems.length * 5;
  const organicBonus = items.filter((i) =>
    i.name.toLowerCase().includes("organic") || i.brand?.toLowerCase().includes("organic")
  ).length * 3;
  const inSeasonBonus = items.filter((i) => i.inSeason).length * 2;
  const noAir = items.every((i) => i.transport !== "air");
  const zeroAirBonus = (noAir && items.length >= 3) ? 50 : 0;
  const pctLocal = localItems.length / Math.max(items.length, 1);
  const allLocalBonus = pctLocal >= 0.8 ? 100 : 0;
  const perfectTripBonus = (meta.grade === "A+" || meta.score >= 800) ? 75 : 0;

  const subtotal = base + esgBonus + localBonus + organicBonus + inSeasonBonus + zeroAirBonus + allLocalBonus + perfectTripBonus;
  const streakMultiplier = getStreakMultiplier(state.streak);
  const total = Math.round(subtotal * streakMultiplier);

  // ── Update XP and check badges ────────────────────────────────────────────
  state.xp += total;
  const newBadgeIds = checkBadges(state, items, meta.score, meta.grade);
  state.earnedBadgeIds = [...new Set([...state.earnedBadgeIds, ...newBadgeIds])];
  const newLevel = getLevelFromXP(state.xp);

  saveGamificationState(state);

  const newBadges = newBadgeIds.map((id) => ALL_BADGES.find((b) => b.id === id)!).filter(Boolean);

  return {
    base, esgBonus, localBonus, organicBonus, inSeasonBonus,
    zeroAirBonus, allLocalBonus, perfectTripBonus,
    subtotal, streakMultiplier, total,
    newBadges, leveledUp: newLevel > oldLevel,
    oldLevel, newLevel,
  };
}

/** Log a community post and award XP. */
export function logCommunityPost(): void {
  const state = loadGamificationState();
  state.totalPosts += 1;
  state.xp += 20;
  if (state.totalPosts >= 10) {
    if (!state.earnedBadgeIds.includes("community_voice")) {
      state.earnedBadgeIds.push("community_voice");
    }
  }
  saveGamificationState(state);
}

/** Log an item swap and award XP. */
export function logItemSwap(): void {
  const state = loadGamificationState();
  state.totalSwaps += 1;
  state.xp += 15;
  if (state.totalSwaps >= 10 && !state.earnedBadgeIds.includes("swap_champion")) {
    state.earnedBadgeIds.push("swap_champion");
  }
  saveGamificationState(state);
}

/** Get a snapshot of stats for the Profile screen. */
export function getProfileStats() {
  const state = loadGamificationState();
  const levelInfo = getLevelInfo(state.xp);
  const progress = getLevelProgress(state.xp);
  const earned = ALL_BADGES.filter((b) => state.earnedBadgeIds.includes(b.id));
  const all = ALL_BADGES.map((b) => ({
    ...b,
    earned: state.earnedBadgeIds.includes(b.id),
  }));
  return {
    xp: state.xp,
    levelInfo,
    progress,
    streak: state.streak,
    totalScans: state.totalScans,
    totalItems: state.totalItems,
    co2SavedKg: (state.totalCO2SavedG / 1000).toFixed(1),
    totalSwaps: state.totalSwaps,
    earnedBadges: earned,
    allBadges: all,
    streakMultiplier: getStreakMultiplier(state.streak),
  };
}
