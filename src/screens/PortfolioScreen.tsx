import React, { useState } from "react";
import { TrendingUp, Zap, Crown, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, ShoppingCart, Sprout, Banknote, MapPinned } from "lucide-react";
import { userData, scoreTrend, carbonBreakdown, tripHistory, badges, leaderboard, sampleReceiptItems } from "@/data/mockData";
import ESGGauge from "@/components/ESGGauge";
import { categoryIcons, badgeIcons, MappedIcon } from "@/components/IconMap";

const timeRanges = ["Week", "Month", "Year", "All"];

// Map categories to items
const categoryItemsMap: Record<string, typeof sampleReceiptItems> = {
  "Meat & Fish": sampleReceiptItems.filter(i => i.category === "meat"),
  "Dairy": sampleReceiptItems.filter(i => i.category === "dairy"),
  "Produce": sampleReceiptItems.filter(i => i.category === "fruit" || i.category === "vegetable"),
  "Grains": sampleReceiptItems.filter(i => i.category === "grain"),
  "Packaged": sampleReceiptItems.filter(i => i.category === "packaged"),
  "Bakery": sampleReceiptItems.filter(i => i.category === "bakery"),
};

const statsConfig = [
  { label: "Total Trips", valueKey: "totalScans", Icon: ShoppingCart, sub: undefined },
  { label: "Carbon Saved", valueKey: "savedCO2", Icon: Sprout, sub: "vs average", suffix: " kg" },
  { label: "Money Saved", valueKey: "savedMoney", Icon: Banknote, sub: "choosing local", prefix: "$" },
  { label: "Local Items", valueKey: "pctLocal", Icon: MapPinned, sub: "of all purchases", suffix: "%" },
];

const PortfolioScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState("Month");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const chartW = 320;
  const chartH = 100;
  const padX = 30;
  const padY = 10;
  const minS = Math.min(...scoreTrend.map(d => d.score)) - 20;
  const maxS = Math.max(...scoreTrend.map(d => d.score)) + 20;

  const points = scoreTrend.map((d, i) => {
    const x = padX + (i / (scoreTrend.length - 1)) * (chartW - padX * 2);
    const y = padY + (1 - (d.score - minS) / (maxS - minS)) * (chartH - padY * 2);
    return { x, y, ...d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-display font-bold text-lg text-foreground">Portfolio</h1>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6 space-y-4">
        {/* ESG Score */}
        <div className="card-surface flex flex-col items-center py-4">
          <ESGGauge score={userData.esgScore} grade={userData.esgGrade} size={180} label="Overall ESG Score" change={18} />
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          {timeRanges.map(t => (
            <button key={t} onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                timeRange === t ? "bg-primary/15 text-primary" : "text-foreground-tertiary"
              }`}
            >{t}</button>
          ))}
        </div>

        {/* Score Trend Chart */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Score Trend</h3>
          <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 20}`} className="overflow-visible">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142 69% 58%)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="hsl(142 69% 58%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#areaGrad)" />
            <path d={linePath} fill="none" stroke="hsl(142 69% 58%)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={3} fill="hsl(142 69% 58%)" />
                {i === points.length - 1 && (
                  <g>
                    <circle cx={p.x} cy={p.y} r={6} fill="hsl(142 69% 58%)" opacity={0.2}>
                      <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <rect x={p.x - 16} y={p.y - 22} width={32} height={16} rx={4} fill="hsl(var(--background-secondary))" stroke="hsl(142 69% 58% / 0.3)" strokeWidth={0.5} />
                    <text x={p.x} y={p.y - 11} textAnchor="middle" fill="hsl(142 69% 58%)" fontSize={9} fontWeight={600}>{p.score}</text>
                  </g>
                )}
                <text x={p.x} y={chartH + 14} textAnchor="middle" fill="hsl(var(--foreground-tertiary))" fontSize={8}>
                  {p.date.split(" ")[1]}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {statsConfig.map(s => {
            const raw = (userData as any)[s.valueKey];
            const value = `${s.prefix || ""}${raw}${s.suffix || ""}`;
            return (
              <div key={s.label} className="card-surface">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <s.Icon size={16} className="text-primary" />
                </div>
                <div className="font-mono font-bold text-[18px] text-foreground mt-1">{value}</div>
                <div className="text-[10px] text-foreground-tertiary">{s.label}</div>
                {s.sub && <div className="text-[9px] text-foreground-tertiary mt-0.5">{s.sub}</div>}
              </div>
            );
          })}
        </div>

        {/* Carbon Breakdown */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Carbon Breakdown</h3>
          <div className="space-y-1">
            {carbonBreakdown.map(cat => {
              const isExpanded = expandedCategory === cat.category;
              const items = categoryItemsMap[cat.category] || [];
              const CatIcon = categoryIcons[cat.icon];
              return (
                <div key={cat.category}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                    className="w-full text-left p-2 rounded-2xl hover:bg-background-tertiary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        {CatIcon ? <CatIcon size={16} className="text-primary" /> : null}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[12px] font-medium text-foreground">{cat.category}</span>
                          <span className="text-[12px] font-mono text-foreground-secondary">{cat.co2} kg</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${cat.color === "destructive" ? "bg-destructive" : cat.color === "warning" ? "bg-warning" : "bg-primary"}`}
                            style={{ width: `${cat.pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[11px] font-mono font-semibold ${cat.color === "destructive" ? "text-destructive" : cat.color === "warning" ? "text-warning" : "text-primary"}`}>
                          {cat.pct}%
                        </span>
                        {isExpanded ? <ChevronUp size={12} className="text-foreground-tertiary" /> : <ChevronDown size={12} className="text-foreground-tertiary" />}
                      </div>
                    </div>
                  </button>

                  {/* Drill-down items */}
                  {isExpanded && (
                    <div className="ml-9 mt-1 mb-2 space-y-1.5 animate-fade-up">
                      {items.length > 0 ? items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-background-tertiary">
                          <div className="flex-1">
                            <div className="text-[11px] font-medium text-foreground">{item.name}</div>
                            <div className="text-[9px] text-foreground-tertiary">{item.origin.flag} {item.origin.country} · {item.origin.distance.toLocaleString()} km</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[11px] font-mono font-semibold ${item.esgScore >= 70 ? "text-primary" : item.esgScore >= 50 ? "text-warning" : "text-destructive"}`}>
                              {(item.co2 / 1000).toFixed(1)} kg
                            </div>
                            <div className="text-[9px] text-foreground-tertiary">CO₂</div>
                          </div>
                          {item.localAlt && (
                            <span className="pill text-[8px] py-0.5 px-1.5">Swap</span>
                          )}
                        </div>
                      )) : (
                        <div className="text-[11px] text-foreground-tertiary p-2">No items scanned in this category yet</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Gamification Section */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Progress</h3>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sprout size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[12px] font-semibold text-foreground">{userData.levelName} — Level {userData.level}</span>
                <span className="text-[10px] text-foreground-tertiary font-mono">{userData.xp}/{userData.xpNext} XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-background-tertiary overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(userData.xp / userData.xpNext) * 100}%`, boxShadow: "0 0 8px hsl(142 69% 58% / 0.4)" }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-background-tertiary mb-3">
            <Zap size={18} className="text-warning" />
            <span className="text-[13px] font-semibold text-foreground">{userData.streak} week streak</span>
            <span className="text-[10px] text-foreground-tertiary ml-auto">+50 XP/week</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {badges.map(b => {
              const BadgeIcon = badgeIcons[b.icon];
              return (
                <div key={b.name} className={`flex flex-col items-center p-2 rounded-2xl text-center ${b.earned ? "bg-primary/8" : "bg-background-tertiary opacity-50"}`}>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                    {BadgeIcon ? <BadgeIcon size={16} className={b.earned ? "text-primary" : "text-foreground-tertiary"} /> : null}
                  </div>
                  <span className="text-[9px] text-foreground-secondary leading-tight">{b.name}</span>
                  {b.earned && <span className="text-[8px] text-primary mt-0.5">✓</span>}
                  {!b.earned && b.progress && (
                    <div className="w-full h-1 rounded-full bg-background mt-1 overflow-hidden">
                      <div className="h-full bg-primary/40 rounded-full" style={{ width: `${b.progress}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card-surface">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-[13px] text-foreground flex items-center gap-2">
              <Crown size={14} className="text-warning" />Leaderboard
            </h3>
            <span className="text-[11px] text-primary font-medium">See all</span>
          </div>
          <div className="space-y-2">
            {leaderboard.map(u => (
              <div key={u.rank} className={`flex items-center gap-3 p-2.5 rounded-2xl ${u.isUser ? "bg-primary/8 glow-border" : ""}`}>
                <span className={`text-[13px] font-mono font-bold w-6 text-center ${u.rank <= 3 ? "text-warning" : "text-foreground-tertiary"}`}>
                  #{u.rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">{u.avatar}</div>
                <div className="flex-1">
                  <span className="text-[12px] font-semibold text-foreground">{u.name}</span>
                  <span className="text-[10px] text-foreground-tertiary ml-2">Lv.{u.level}</span>
                </div>
                <span className="font-mono font-bold text-[13px] text-foreground">{u.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trip History */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Recent Trips</h3>
          <div className="space-y-2">
            {tripHistory.slice(0, 4).map(trip => (
              <div key={trip.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-background-tertiary">
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-foreground">{trip.store}</div>
                  <div className="text-[10px] text-foreground-tertiary">{trip.date} · {trip.itemCount} items</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[14px] text-foreground">{trip.esgScore}</div>
                  <div className={`text-[10px] font-semibold ${trip.esgScore >= 700 ? "text-primary" : trip.esgScore >= 500 ? "text-warning" : "text-destructive"}`}>
                    {trip.grade}
                  </div>
                </div>
                <ChevronRight size={14} className="text-foreground-tertiary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioScreen;
