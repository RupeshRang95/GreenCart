import React, { useState, useMemo } from "react";
import {
  TrendingUp, Zap, Crown, ChevronDown, ChevronUp,
  ShoppingCart, Sprout, Banknote, MapPinned, Flame, Info,
  Truck, Ship, Plane, Train,
} from "lucide-react";
import { userData, scoreTrend, leaderboard } from "@/data/mockData";
import ESGGauge from "@/components/ESGGauge";
import { getProfileStats } from "@/lib/gamification";
import { loadTripHistory, gradeColor, type SavedTrip } from "@/lib/tripHistory";
import type { ScannedItem } from "@/data/mockData";

// ── Time range helpers ────────────────────────────────────────────────────────

const TIME_RANGES = ["Week", "Month", "3 Months", "1 Year"] as const;
type TimeRange = typeof TIME_RANGES[number];

function cutoffDate(range: TimeRange): Date {
  const d = new Date();
  switch (range) {
    case "Week":     d.setDate(d.getDate() - 7);   break;
    case "Month":    d.setDate(d.getDate() - 30);  break;
    case "3 Months": d.setDate(d.getDate() - 90);  break;
    case "1 Year":   d.setDate(d.getDate() - 365); break;
  }
  return d;
}

function filterTrips(trips: SavedTrip[], range: TimeRange): SavedTrip[] {
  const cut = cutoffDate(range);
  return trips.filter((t) => new Date(t.date) >= cut);
}

// ── Category meta ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  meat:      { icon: "🥩", label: "Meat & Fish"  },
  dairy:     { icon: "🥛", label: "Dairy"        },
  fruit:     { icon: "🍎", label: "Fruit"        },
  vegetable: { icon: "🥬", label: "Vegetables"   },
  grain:     { icon: "🌾", label: "Grains"       },
  packaged:  { icon: "📦", label: "Packaged"     },
  bakery:    { icon: "🍞", label: "Bakery"       },
};

// ── Derived analytics ────────────────────────────────────────────────────────

function computeStats(trips: SavedTrip[]) {
  if (trips.length === 0) return null;
  const totalSpent = trips.reduce((s, t) => s + t.totalSpent, 0);
  const totalCO2kg = trips.reduce((s, t) => s + t.co2TotalG / 1000, 0);
  const co2SavedKg = Math.max(0, trips.length * 15 - totalCO2kg);
  const avgLocal = Math.round(trips.reduce((s, t) => s + t.pctLocal, 0) / trips.length);
  const avgScore = Math.round(trips.reduce((s, t) => s + t.esgScore, 0) / trips.length);
  const lastGrade = trips[0]?.grade ?? "–";
  return { totalSpent, totalCO2kg, co2SavedKg, avgLocal, avgScore, lastGrade };
}

function computeCategoryBreakdown(trips: SavedTrip[]) {
  const map: Record<string, { co2: number; items: ScannedItem[] }> = {};
  for (const trip of trips) {
    for (const item of trip.items) {
      if (!map[item.category]) map[item.category] = { co2: 0, items: [] };
      map[item.category].co2 += item.co2;
      map[item.category].items.push(item);
    }
  }
  const totalCO2 = Object.values(map).reduce((s, v) => s + v.co2, 0) || 1;
  return Object.entries(map)
    .map(([cat, { co2, items }]) => ({
      cat,
      co2g: co2,
      co2kg: (co2 / 1000).toFixed(2),
      pct: Math.round((co2 / totalCO2) * 100),
      items,
      ...(CATEGORY_META[cat] ?? { icon: "📦", label: cat }),
    }))
    .sort((a, b) => b.co2g - a.co2g);
}

const TRANSPORT_DISPLAY: Record<string, {
  Icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  note: string;
}> = {
  truck: { Icon: Truck,  label: "Truck",  color: "text-yellow-400",  bgColor: "bg-yellow-400/10", note: "Land transport" },
  ship:  { Icon: Ship,   label: "Ship",   color: "text-blue-400",    bgColor: "bg-blue-400/10",   note: "Sea freight"  },
  air:   { Icon: Plane,  label: "Air",    color: "text-red-400",     bgColor: "bg-red-400/10",    note: "50× vs ship"  },
  rail:  { Icon: Train,  label: "Rail",   color: "text-primary",     bgColor: "bg-primary/10",    note: "Low emission" },
};

function computeTransportBreakdown(trips: SavedTrip[]) {
  const co2Map: Record<string, number> = {};
  const countMap: Record<string, number> = {};
  let totalItems = 0;
  let totalCO2 = 0;

  for (const trip of trips) {
    for (const item of trip.items) {
      const mode = item.transport;
      co2Map[mode]   = (co2Map[mode]   ?? 0) + item.co2;
      countMap[mode] = (countMap[mode] ?? 0) + 1;
      totalItems++;
      totalCO2 += item.co2;
    }
  }
  if (totalItems === 0) return [];

  return Object.keys(co2Map)
    .map((mode) => ({
      mode,
      count: countMap[mode],
      co2g: co2Map[mode],
      co2kg: (co2Map[mode] / 1000).toFixed(2),
      pctItems: Math.round((countMap[mode] / totalItems) * 100),
      pctCO2:   Math.round((co2Map[mode]   / totalCO2)   * 100),
      ...(TRANSPORT_DISPLAY[mode] ?? TRANSPORT_DISPLAY.truck),
    }))
    .sort((a, b) => b.co2g - a.co2g);
}

// Reduce many trips to chart-friendly points based on range
function buildChartPoints(trips: SavedTrip[], range: TimeRange) {
  if (trips.length === 0) return [];
  const sorted = [...trips].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (range === "1 Year") {
    // Bucket by month
    const months: Record<string, number[]> = {};
    for (const t of sorted) {
      const key = new Date(t.date).toLocaleDateString("en-CA", { month: "short", year: "2-digit" });
      if (!months[key]) months[key] = [];
      months[key].push(t.esgScore);
    }
    return Object.entries(months).map(([label, scores]) => ({
      label,
      score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }));
  }

  if (range === "3 Months" && sorted.length > 8) {
    // Bucket by week
    const weeks: Record<string, number[]> = {};
    for (const t of sorted) {
      const d = new Date(t.date);
      const wStart = new Date(d);
      wStart.setDate(d.getDate() - d.getDay());
      const key = wStart.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(t.esgScore);
    }
    return Object.entries(weeks).map(([label, scores]) => ({
      label,
      score: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }));
  }

  // All other ranges: individual trips
  return sorted.map((t) => ({
    label: new Date(t.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
    score: t.esgScore,
  }));
}

// ── Main component ────────────────────────────────────────────────────────────

const PortfolioScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("Month");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const allTrips = useMemo(() => loadTripHistory(), []);
  const gamStats  = useMemo(() => getProfileStats(), []);
  const hasRealData = allTrips.length > 0;

  const filteredTrips = useMemo(() => filterTrips(allTrips, timeRange), [allTrips, timeRange]);
  const stats          = useMemo(() => computeStats(filteredTrips), [filteredTrips]);
  const catBreakdown       = useMemo(() => computeCategoryBreakdown(filteredTrips), [filteredTrips]);
  const transportBreakdown = useMemo(() => computeTransportBreakdown(filteredTrips), [filteredTrips]);
  const chartPoints        = useMemo(() => buildChartPoints(filteredTrips, timeRange), [filteredTrips, timeRange]);

  // Fallback to mock chart when no real data
  const mockChartPoints = useMemo(
    () => scoreTrend.map((d) => ({ label: d.date.split(" ")[1] ?? d.date, score: d.score })),
    []
  );
  const displayChart = chartPoints.length >= 2 ? chartPoints : (hasRealData ? [] : mockChartPoints);
  const isDemo = displayChart === mockChartPoints;

  // ESG gauge value
  const gaugeScore = stats?.avgScore ?? (hasRealData ? (allTrips[0]?.esgScore ?? 642) : userData.esgScore);
  const gaugeGrade = stats?.lastGrade ?? (hasRealData ? (allTrips[0]?.grade ?? "B-") : userData.esgGrade);

  // Stat pills values
  const displayTotalTrips  = hasRealData ? filteredTrips.length  : userData.totalScans;
  const displayCO2Saved    = stats ? `${stats.co2SavedKg.toFixed(1)} kg` : `${userData.savedCO2} kg`;
  const displayLocal       = stats ? `${stats.avgLocal}%`              : `${userData.pctLocal}%`;
  const displaySpent       = stats ? `$${stats.totalSpent.toFixed(0)}` : `$${(userData.savedMoney * 2).toFixed(0)}`;

  // XP / level
  const displayXP       = gamStats.xp > 0 ? gamStats.xp           : userData.xp;
  const displayXPNext   = gamStats.xp > 0 ? gamStats.levelInfo.xpNextLevel : userData.xpNext;
  const displayProgress = gamStats.xp > 0 ? gamStats.progress      : Math.round((userData.xp / userData.xpNext) * 100);
  const displayLevel    = gamStats.xp > 0 ? gamStats.levelInfo.level : userData.level;
  const displayLvName   = gamStats.xp > 0 ? `${gamStats.levelInfo.icon} ${gamStats.levelInfo.name}` : `${userData.levelIcon} ${userData.levelName}`;
  const displayStreak   = gamStats.streak > 0 ? gamStats.streak    : userData.streak;

  // Chart geometry
  const chartW = 320;
  const chartH = 90;
  const padX   = 28;
  const padY   = 8;

  const svgPoints = useMemo(() => {
    if (displayChart.length < 2) return [];
    const scores = displayChart.map((d) => d.score);
    const minS = Math.min(...scores) - 30;
    const maxS = Math.max(...scores) + 30;
    return displayChart.map((d, i) => ({
      x: padX + (i / (displayChart.length - 1)) * (chartW - padX * 2),
      y: padY + (1 - (d.score - minS) / (maxS - minS)) * (chartH - padY * 2),
      ...d,
    }));
  }, [displayChart]);

  const linePath = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = svgPoints.length > 0
    ? linePath + ` L ${svgPoints[svgPoints.length - 1].x} ${chartH} L ${svgPoints[0].x} ${chartH} Z`
    : "";

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-display font-bold text-lg text-foreground">Portfolio</h1>
        <p className="text-[11px] text-foreground-tertiary">
          {hasRealData ? `${allTrips.length} trip${allTrips.length !== 1 ? "s" : ""} tracked` : "Scan a receipt to see your real data"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6 space-y-3">

        {/* ESG Gauge */}
        <div className="card-surface flex flex-col items-center py-4">
          <ESGGauge score={gaugeScore} grade={gaugeGrade} size={170} label="Average ESG Score" change={hasRealData ? 0 : 18} />
          {!hasRealData && (
            <p className="text-[10px] text-foreground-tertiary mt-1 flex items-center gap-1">
              <Info size={10} /> Demo data — scan your first receipt to see real scores
            </p>
          )}
        </div>

        {/* Time Range Tabs */}
        <div className="flex bg-card-elevated rounded-2xl p-1 gap-0.5">
          {TIME_RANGES.map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                timeRange === t
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground-tertiary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Score Trend Chart */}
        <div className="card-surface">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-[13px] text-foreground">Score Trend</h3>
            {isDemo && (
              <span className="text-[9px] text-foreground-tertiary px-2 py-0.5 rounded-full bg-background-tertiary">
                Demo
              </span>
            )}
          </div>

          {svgPoints.length < 2 && hasRealData ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <TrendingUp size={24} className="text-foreground-tertiary" />
              <p className="text-[12px] text-foreground-tertiary">No trips in this period</p>
              <p className="text-[10px] text-foreground-tertiary/70">Scan a receipt to add data</p>
            </div>
          ) : (
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 22}`} className="overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 69% 58%)" stopOpacity={isDemo ? "0.1" : "0.2"} />
                  <stop offset="100%" stopColor="hsl(142 69% 58%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="hsl(142 69% 58%)"
                  strokeWidth={isDemo ? 1.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isDemo ? 0.4 : 1}
                />
              )}
              {svgPoints.map((p, i) => (
                <g key={i} opacity={isDemo ? 0.4 : 1}>
                  <circle cx={p.x} cy={p.y} r={2.5} fill="hsl(142 69% 58%)" />
                  {i === svgPoints.length - 1 && !isDemo && (
                    <g>
                      <circle cx={p.x} cy={p.y} r={5} fill="hsl(142 69% 58%)" opacity={0.2}>
                        <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <rect x={p.x - 15} y={p.y - 21} width={30} height={14} rx={3} fill="hsl(var(--background-secondary))" stroke="hsl(142 69% 58% / 0.3)" strokeWidth={0.5} />
                      <text x={p.x} y={p.y - 11} textAnchor="middle" fill="hsl(142 69% 58%)" fontSize={8} fontWeight={700}>{p.score}</text>
                    </g>
                  )}
                  {/* X-axis labels — only show a few to avoid crowding */}
                  {(svgPoints.length <= 6 || i % Math.ceil(svgPoints.length / 5) === 0 || i === svgPoints.length - 1) && (
                    <text x={p.x} y={chartH + 16} textAnchor="middle" fill="hsl(var(--foreground-tertiary))" fontSize={7.5}>
                      {p.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          )}

          {/* Range summary line */}
          {filteredTrips.length > 0 && (
            <div className="flex items-center justify-between mt-1 text-[10px] text-foreground-tertiary border-t border-border/40 pt-2">
              <span>{filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""} in {timeRange.toLowerCase()}</span>
              {stats && (
                <span className="font-mono">
                  Avg <span className="text-primary font-semibold">{stats.avgScore}</span> pts
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Trips", value: displayTotalTrips.toString(), Icon: ShoppingCart, sub: `in ${timeRange.toLowerCase()}` },
            { label: "CO₂ Saved",  value: displayCO2Saved,  Icon: Sprout,     sub: "vs avg shopper" },
            { label: "Local Items", value: displayLocal,    Icon: MapPinned,  sub: "avg across trips" },
            { label: "Spent",       value: displaySpent,    Icon: Banknote,   sub: "in this period" },
          ].map((s) => (
            <div key={s.label} className="card-surface">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <s.Icon size={14} className="text-primary" />
              </div>
              <div className="font-mono font-bold text-[18px] text-foreground leading-none">{s.value}</div>
              <div className="text-[11px] text-foreground-tertiary mt-0.5">{s.label}</div>
              <div className="text-[9px] text-foreground-tertiary/70">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Carbon Breakdown — only show when we have real data */}
        {(catBreakdown.length > 0 || !hasRealData) && (
          <div className="card-surface">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-[13px] text-foreground">Carbon by Category</h3>
              {!hasRealData && (
                <span className="text-[9px] text-foreground-tertiary px-2 py-0.5 rounded-full bg-background-tertiary">Demo</span>
              )}
            </div>

            {catBreakdown.length === 0 ? (
              <p className="text-[11px] text-foreground-tertiary py-4 text-center">No trips in this period</p>
            ) : (
              <div className="space-y-1">
                {catBreakdown.map((cat) => {
                  const isExpanded = expandedCategory === cat.cat;
                  const co2Color = cat.pct > 35 ? "bg-destructive" : cat.pct > 20 ? "bg-warning" : "bg-primary";
                  const textColor = cat.pct > 35 ? "text-destructive" : cat.pct > 20 ? "text-warning" : "text-primary";
                  return (
                    <div key={cat.cat}>
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.cat)}
                        className="w-full text-left p-2 rounded-2xl hover:bg-background-tertiary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[18px] shrink-0">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[12px] font-medium text-foreground">{cat.label}</span>
                              <span className="text-[11px] font-mono text-foreground-secondary">{cat.co2kg} kg</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${co2Color}`} style={{ width: `${cat.pct}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-[11px] font-mono font-semibold ${textColor}`}>{cat.pct}%</span>
                            {isExpanded ? <ChevronUp size={11} className="text-foreground-tertiary" /> : <ChevronDown size={11} className="text-foreground-tertiary" />}
                          </div>
                        </div>
                      </button>

                      {isExpanded && cat.items.length > 0 && (
                        <div className="ml-8 mt-1 mb-2 space-y-1.5 animate-fade-up">
                          {cat.items.slice(0, 5).map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center gap-3 p-2 rounded-xl bg-background-tertiary">
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-foreground truncate">{item.name}</div>
                                <div className="text-[9px] text-foreground-tertiary">{item.origin.flag} {item.origin.country} · {item.origin.distance.toLocaleString()} km</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`text-[11px] font-mono font-semibold ${item.esgScore >= 70 ? "text-primary" : item.esgScore >= 50 ? "text-warning" : "text-destructive"}`}>
                                  {(item.co2 / 1000).toFixed(2)} kg
                                </div>
                                {item.localAlt && <span className="text-[8px] text-primary">swap ↗</span>}
                              </div>
                            </div>
                          ))}
                          {cat.items.length > 5 && (
                            <p className="text-[10px] text-foreground-tertiary pl-2">+{cat.items.length - 5} more items</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Transport Breakdown */}
        {(transportBreakdown.length > 0) && (
          <div className="card-surface">
            <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Transport Modes</h3>

            {/* Air freight warning */}
            {transportBreakdown.some((t) => t.mode === "air") && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-2xl bg-red-400/8 border border-red-400/20 mb-3">
                <Plane size={13} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-red-300/90 leading-relaxed">
                  You have air-freighted items. Air freight emits ~50× more CO₂ per km than sea — consider local alternatives.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {transportBreakdown.map((t) => {
                const TIcon = t.Icon;
                return (
                  <div key={t.mode}>
                    {/* Mode header row */}
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-7 h-7 rounded-lg ${t.bgColor} flex items-center justify-center shrink-0`}>
                        <TIcon size={13} className={t.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-foreground">{t.label}</span>
                            <span className="text-[9px] text-foreground-tertiary px-1.5 py-0.5 rounded-full bg-background-tertiary">
                              {t.note}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-foreground-secondary">{t.co2kg} kg CO₂</span>
                        </div>
                        {/* Dual bar: items (dimmed) + CO₂ (solid) */}
                        <div className="relative h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                          {/* Items % background */}
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full opacity-30`}
                            style={{ width: `${t.pctItems}%`, background: "currentColor" }}
                          />
                          {/* CO₂ % foreground */}
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full ${t.mode === "air" ? "bg-red-400" : t.mode === "ship" ? "bg-blue-400" : t.mode === "rail" ? "bg-primary" : "bg-yellow-400"}`}
                            style={{ width: `${t.pctCO2}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex gap-2 ml-9">
                      <div className="px-2 py-1 rounded-lg bg-background-tertiary text-center">
                        <div className="text-[11px] font-mono font-bold text-foreground">{t.count}</div>
                        <div className="text-[9px] text-foreground-tertiary">items</div>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-background-tertiary text-center">
                        <div className="text-[11px] font-mono font-bold text-foreground">{t.pctItems}%</div>
                        <div className="text-[9px] text-foreground-tertiary">of basket</div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg ${t.pctCO2 > 40 ? "bg-red-400/10" : "bg-background-tertiary"} text-center`}>
                        <div className={`text-[11px] font-mono font-bold ${t.pctCO2 > 40 ? "text-red-400" : "text-foreground"}`}>{t.pctCO2}%</div>
                        <div className="text-[9px] text-foreground-tertiary">of CO₂</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary insight */}
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-[10px] text-foreground-tertiary leading-relaxed">
                {transportBreakdown[0]?.mode === "truck"
                  ? "Most of your food arrives by truck — typical for locally sourced Canadian groceries. 🇨🇦"
                  : transportBreakdown[0]?.mode === "ship"
                  ? "Most CO₂ comes from sea freight. Look for domestic alternatives to reduce shipping impact."
                  : transportBreakdown[0]?.mode === "air"
                  ? "⚠️ Air freight is your top CO₂ source — swapping even one air-freighted item has a big impact."
                  : "Mostly rail transport — one of the lowest-emission modes available. ✅"}
              </p>
            </div>
          </div>
        )}

        {/* Progress / XP */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Progress</h3>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-[16px] shrink-0">
              {gamStats.xp > 0 ? gamStats.levelInfo.icon : userData.levelIcon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[12px] font-semibold text-foreground">{displayLvName} — Lv.{displayLevel}</span>
                <span className="text-[10px] text-foreground-tertiary font-mono">{displayXP.toLocaleString()} / {displayXPNext.toLocaleString()} XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-background-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${displayProgress}%`, boxShadow: "0 0 8px hsl(142 69% 58% / 0.4)" }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-orange-400/8 border border-orange-400/15">
            <Flame size={16} className="text-orange-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[12px] font-semibold text-foreground">{displayStreak}-week streak</span>
              <p className="text-[10px] text-foreground-tertiary">
                {displayStreak >= 12 ? "2× XP — max multiplier!" : displayStreak >= 8 ? "1.5× XP multiplier active" : displayStreak >= 4 ? "1.2× XP multiplier active" : "Scan weekly to unlock XP multipliers"}
              </p>
            </div>
            <span className="text-[11px] font-mono text-orange-400 shrink-0">
              {displayStreak >= 12 ? "2×" : displayStreak >= 8 ? "1.5×" : displayStreak >= 4 ? "1.2×" : "1×"}
            </span>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Recent Trips</h3>
          {allTrips.length === 0 ? (
            <p className="text-[11px] text-foreground-tertiary py-4 text-center">No trips yet — scan your first receipt</p>
          ) : (
            <div className="space-y-2">
              {allTrips.slice(0, 5).map((trip) => {
                const gc = gradeColor(trip.grade);
                return (
                  <div key={trip.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-background-tertiary">
                    <div className={`w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0`}>
                      <span className={`text-[13px] font-display font-bold ${gc}`}>{trip.grade}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-foreground">{trip.displayDate}</div>
                      <div className="text-[10px] text-foreground-tertiary">
                        {trip.itemCount} items · ${trip.totalSpent.toFixed(2)} · {trip.pctLocal}% local
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-mono font-bold text-[14px] ${gc}`}>{trip.esgScore}</div>
                      <div className="text-[9px] text-foreground-tertiary">{(trip.co2TotalG / 1000).toFixed(2)} kg CO₂</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card-surface">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-[13px] text-foreground flex items-center gap-2">
              <Crown size={13} className="text-warning" /> Leaderboard
            </h3>
          </div>
          <div className="space-y-2">
            {leaderboard.map((u) => (
              <div
                key={u.rank}
                className={`flex items-center gap-3 p-2.5 rounded-2xl ${u.isUser ? "bg-primary/8 glow-border" : ""}`}
              >
                <span className={`text-[12px] font-mono font-bold w-6 text-center shrink-0 ${u.rank <= 3 ? "text-warning" : "text-foreground-tertiary"}`}>
                  #{u.rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-semibold text-foreground">{u.name}</span>
                  <span className="text-[10px] text-foreground-tertiary ml-2">Lv.{u.level}</span>
                </div>
                <span className="font-mono font-bold text-[13px] text-foreground shrink-0">
                  {u.isUser && gamStats.xp > 0 ? gamStats.xp : u.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioScreen;
