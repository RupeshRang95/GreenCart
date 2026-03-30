import React from "react";
import { ArrowLeft, Sparkle, MapPinned, ExternalLink } from "lucide-react";
import { LocalBusiness, sampleReceiptItems } from "@/data/mockData";
import { businessIcons } from "@/components/IconMap";

interface BusinessDetailProps {
  business: LocalBusiness;
  onBack: () => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ business, onBack }) => {
  const userItems = sampleReceiptItems.filter(item =>
    business.products.some(p => p.toLowerCase().includes(item.category) || item.name.toLowerCase().includes(p.toLowerCase()))
  );

  const HeroIcon = businessIcons[business.img];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Hero */}
      <div className="relative">
        <div className="h-44 flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--background-secondary)), hsl(var(--background-tertiary)))" }}>
          {HeroIcon ? <HeroIcon size={64} className="text-primary/50" /> : null}
        </div>
        <button onClick={onBack} className="absolute top-12 left-4 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
          <ArrowLeft size={16} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6 -mt-4">
        {/* Info Card */}
        <div className="card-surface relative z-10 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="pill text-[10px] py-0.5 px-2">{business.typePill}</span>
            <span className="pill text-[10px] py-0.5 px-2">ESG {business.esg}</span>
          </div>
          <h2 className="font-display font-bold text-[17px] text-foreground mb-1">{business.name}</h2>
          <p className="text-[12px] text-foreground-tertiary mb-3">{business.description}</p>

          <div className="flex items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1 text-foreground-secondary">
              <Sparkle size={13} className="text-warning" fill="hsl(43 96% 56%)" />{business.rating}
              <span className="text-foreground-tertiary">({business.reviews})</span>
            </span>
            <span className="flex items-center gap-1 text-foreground-secondary">
              <MapPinned size={13} />{business.distance} km away
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="card-surface mb-3">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Available Products</h3>
          <div className="grid grid-cols-2 gap-2">
            {business.products.map(product => (
              <div key={product} className="p-3 rounded-2xl bg-background-tertiary">
                <span className="text-[12px] font-medium text-foreground">{product}</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="pill text-[9px] py-0.5 px-1.5">In Season</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalized matches */}
        {userItems.length > 0 && (
          <div className="card-surface mb-3">
            <h3 className="font-display font-semibold text-[13px] text-foreground mb-1">Products You Buy</h3>
            <p className="text-[10px] text-foreground-tertiary mb-3">Items you regularly buy imported that {business.name.split("'")[0]} sells locally</p>
            <div className="space-y-2">
              {userItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-background-tertiary">
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-foreground">{item.name}</div>
                    <div className="text-[10px] text-foreground-tertiary">
                      Currently: {item.origin.flag} {item.origin.country} ({item.origin.distance.toLocaleString()} km)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-primary">Save {((item.co2 - (item.localAlt?.co2 || item.co2 * 0.3)) / 1000).toFixed(1)} kg CO₂</div>
                    <div className="text-[9px] text-foreground-tertiary">per purchase</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Reviews</h3>
          {[
            { user: "Sarah M.", rating: 5, text: "Best local strawberries! Way fresher than grocery store.", time: "2 days ago" },
            { user: "David K.", rating: 4, text: "Great selection, friendly staff. Prices are fair for the quality.", time: "1 week ago" },
            { user: "Priya R.", rating: 5, text: "Love supporting local! My ESG score went up 40 points.", time: "2 weeks ago" },
          ].map((review, i) => (
            <div key={i} className={`py-3 ${i > 0 ? "border-t border-primary/5" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold text-foreground">{review.user}</span>
                <span className="text-[10px] text-foreground-tertiary">{review.time}</span>
              </div>
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Sparkle key={j} size={10} className="text-warning" fill="hsl(43 96% 56%)" />
                ))}
              </div>
              <p className="text-[11px] text-foreground-secondary">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
