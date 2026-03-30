import type { ScannedItem } from "@/data/mockData";

export interface SavedTrip {
  id: string;
  date: string; // ISO
  displayDate: string; // "Mar 30, 2026"
  store?: string;
  itemCount: number;
  esgScore: number;
  grade: string;
  totalSpent: number;
  co2TotalG: number; // grams
  pctLocal: number;
  items: ScannedItem[];
}

const KEY = "greencart_trip_history";
const MAX_TRIPS = 20;

export function loadTripHistory(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedTrip[];
  } catch {
    return [];
  }
}

export function saveTripToHistory(
  items: ScannedItem[],
  meta: { score: number; grade: string }
): SavedTrip {
  const now = new Date();
  const displayDate = now.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const totalSpent = items.reduce((s, i) => s + i.price, 0);
  const co2TotalG = items.reduce((s, i) => s + i.co2, 0);
  const localCount = items.filter((i) => i.origin.distance < 200).length;
  const pctLocal = Math.round((localCount / Math.max(items.length, 1)) * 100);

  const trip: SavedTrip = {
    id: `${now.getTime()}`,
    date: now.toISOString(),
    displayDate,
    itemCount: items.length,
    esgScore: meta.score,
    grade: meta.grade,
    totalSpent,
    co2TotalG,
    pctLocal,
    items,
  };

  try {
    const existing = loadTripHistory();
    const updated = [trip, ...existing].slice(0, MAX_TRIPS);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // storage full or unavailable
  }

  return trip;
}

export function deleteTripFromHistory(id: string): void {
  try {
    const existing = loadTripHistory();
    localStorage.setItem(KEY, JSON.stringify(existing.filter((t) => t.id !== id)));
  } catch {
    // ignore
  }
}

export function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-primary";
  if (grade.startsWith("B")) return "text-[hsl(142_69%_58%)]";
  if (grade.startsWith("C")) return "text-warning";
  return "text-destructive";
}

export function gradeEmoji(grade: string): string {
  if (grade.startsWith("A")) return "🌟";
  if (grade.startsWith("B")) return "✅";
  if (grade.startsWith("C")) return "⚠️";
  return "❗";
}
