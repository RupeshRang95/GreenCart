import React, { useState } from "react";
import { Search, Sparkle, MapPinned, ChevronRight } from "lucide-react";
import { marketplaceData, LocalBusiness } from "@/data/mockData";
import BusinessDetail from "@/components/BusinessDetail";
import { businessIcons } from "@/components/IconMap";

const filters = ["All", "Farms", "Markets", "Co-ops", "Organic", "Delivery"];

const MarketScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<LocalBusiness | null>(null);

  const filtered = marketplaceData.filter(b => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilter === "All") return true;
    if (activeFilter === "Farms") return b.type === "farm" || b.type === "farm_market";
    if (activeFilter === "Markets") return b.type === "farmers_market";
    if (activeFilter === "Co-ops") return b.type === "co_op";
    return true;
  });

  if (selectedBusiness) {
    return <BusinessDetail business={selectedBusiness} onBack={() => setSelectedBusiness(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 pt-14 pb-2">
        <h1 className="font-display font-bold text-lg text-foreground mb-1">Local Marketplace</h1>
        <p className="text-[12px] text-foreground-tertiary mb-3">Support nearby farms & producers</p>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search local farms and markets"
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-card text-[13px] text-foreground placeholder:text-foreground-tertiary font-body glow-border outline-none focus:border-primary/30 transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeFilter === f ? "bg-primary/15 text-primary" : "text-foreground-tertiary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Partner */}
      <div className="px-5 pb-3">
        <button className="w-full text-left card-surface overflow-hidden" style={{ padding: 0 }} onClick={() => setSelectedBusiness(marketplaceData[0])}>
          <div className="h-28 flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--background-secondary)), hsl(var(--background-tertiary)))" }}>
            {(() => { const Icon = businessIcons[marketplaceData[0].img]; return Icon ? <Icon size={48} className="text-primary/60" /> : null; })()}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="pill text-[9px] py-0.5">Featured Partner</span>
            </div>
            <h3 className="font-display font-bold text-[15px] text-foreground mb-1">Herrle's Country Farm Market</h3>
            <p className="text-[11px] text-foreground-tertiary mb-2">Family-owned farm market in St. Agatha since 1977</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-foreground-secondary">
                <Sparkle size={12} className="text-warning" fill="hsl(43 96% 56%)" />4.7 <span className="text-foreground-tertiary">(342)</span>
              </span>
              <span className="flex items-center gap-1 text-foreground-secondary">
                <MapPinned size={12} />15 km
              </span>
              <span className="pill text-[10px] py-0.5">ESG 94</span>
            </div>
          </div>
        </button>
      </div>

      {/* Business List */}
      <div className="flex items-center justify-between px-5 pb-2">
        <h3 className="font-display font-semibold text-[14px] text-foreground">Near You</h3>
        <span className="text-[11px] text-foreground-tertiary">{filtered.length} results</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4 space-y-2.5 stagger-children">
        {filtered.map(biz => {
          const BizIcon = businessIcons[biz.img];
          return (
            <button key={biz.id} onClick={() => setSelectedBusiness(biz)} className="w-full text-left card-surface animate-fade-up">
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-2xl bg-background-tertiary flex items-center justify-center shrink-0">
                  {BizIcon ? <BizIcon size={24} className="text-primary/70" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-semibold text-[13px] text-foreground truncate">{biz.name}</h4>
                  <p className="text-[11px] text-foreground-tertiary mb-2 line-clamp-1">{biz.description}</p>
                  <div className="flex items-center gap-3 text-[10px] mb-2">
                    <span className="flex items-center gap-0.5 text-foreground-secondary">
                      <Sparkle size={10} className="text-warning" fill="hsl(43 96% 56%)" />{biz.rating}
                    </span>
                    <span className="text-foreground-tertiary">{biz.distance} km</span>
                    <span className="pill text-[9px] py-0.5 px-2">{biz.typePill}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {biz.products.slice(0, 3).map(p => (
                      <span key={p} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-background-tertiary text-foreground-secondary">{p}</span>
                    ))}
                    {biz.products.length > 3 && (
                      <span className="text-[9px] text-foreground-tertiary">+{biz.products.length - 3}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-foreground-tertiary self-center shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MarketScreen;
