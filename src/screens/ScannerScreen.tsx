import React, { useState, useEffect } from "react";
import { Aperture, CloudUpload, ChevronDown, ChevronUp, MoveRight, RefreshCcw, ClipboardList, CircleCheckBig, ScanSearch, ClipboardCheck, Globe2, BarChart4 } from "lucide-react";
import { sampleReceiptItems, type ScannedItem } from "@/data/mockData";
import ESGGauge from "@/components/ESGGauge";
import GlobeVisualization from "@/components/GlobeVisualization";
import { scanCategoryIcons, tripSummaryIcons, MappedIcon } from "@/components/IconMap";
import { ShoppingCart, MapPinned, Sprout, Banknote } from "lucide-react";

type ScanPhase = "idle" | "processing" | "results";

const processingSteps = [
  { step: 1, label: "Reading receipt...", sub: "OpenCV preprocessing → Tesseract OCR (--psm 4)", Icon: ScanSearch },
  { step: 2, label: "Identifying products...", sub: "LLM parsing → Open Food Facts matching", Icon: ClipboardCheck },
  { step: 3, label: "Looking up origins...", sub: "Product origin + transport mode inference", Icon: Globe2 },
  { step: 4, label: "Calculating impact...", sub: "Poore & Nemecek emission factors → ESG score", Icon: BarChart4 },
];

const howItWorks = [
  { Icon: ScanSearch, title: "Image Processing", desc: "OpenCV cleans the image, Tesseract extracts text" },
  { Icon: ClipboardCheck, title: "AI Product Matching", desc: "LLM identifies items, matches via Open Food Facts" },
  { Icon: Globe2, title: "Origin Lookup", desc: "Traces each product to its source country & transport" },
  { Icon: BarChart4, title: "ESG Scoring", desc: "Calculates carbon footprint using Poore & Nemecek data" },
];

const summaryItems = [
  { label: "Items", key: "items", Icon: ShoppingCart },
  { label: "Local", key: "local", Icon: MapPinned },
  { label: "CO₂", key: "co2", Icon: Sprout },
  { label: "Spent", key: "spent", Icon: Banknote },
];

const ScannerScreen: React.FC = () => {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [processingStep, setProcessingStep] = useState(0);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const startScan = () => {
    setPhase("processing");
    setProcessingStep(0);
  };

  useEffect(() => {
    if (phase !== "processing") return;
    const timers = [
      setTimeout(() => setProcessingStep(1), 600),
      setTimeout(() => setProcessingStep(2), 1800),
      setTimeout(() => setProcessingStep(3), 3000),
      setTimeout(() => setProcessingStep(4), 4200),
      setTimeout(() => setPhase("results"), 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const resetScan = () => { setPhase("idle"); setProcessingStep(0); setExpandedItem(null); };

  const esgBg = (score: number) => score >= 70 ? "pill" : score >= 45 ? "pill-warning" : "pill-danger";

  const totalCO2 = sampleReceiptItems.reduce((s, i) => s + i.co2, 0);
  const pctLocal = Math.round((sampleReceiptItems.filter(i => i.origin.distance < 200).length / sampleReceiptItems.length) * 100);
  const totalSpent = sampleReceiptItems.reduce((s, i) => s + i.price, 0);

  const summaryValues: Record<string, string> = {
    items: sampleReceiptItems.length.toString(),
    local: `${pctLocal}%`,
    co2: `${(totalCO2 / 1000).toFixed(1)}kg`,
    spent: `$${totalSpent.toFixed(0)}`,
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-3">
        <h1 className="font-display font-bold text-lg text-foreground">Scan Receipt</h1>
        <p className="text-[12px] text-foreground-tertiary">Snap your receipt to uncover the true cost</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6">
        {/* ─── IDLE ─── */}
        {phase === "idle" && (
          <div className="animate-fade-up space-y-4">
            {/* Upload Area */}
            <div
              className="card-surface flex flex-col items-center py-12"
              style={{ border: "1.5px dashed hsl(142 69% 58% / 0.2)" }}
            >
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 animate-float">
                <Aperture size={32} className="text-primary" />
              </div>
              <p className="text-[15px] text-foreground font-semibold font-display mb-1">Take a photo or upload</p>
              <p className="text-[12px] text-foreground-tertiary mb-6">your grocery receipt</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={startScan}
                  className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Aperture size={16} />Take Photo
                </button>
                <button
                  onClick={startScan}
                  className="flex-1 py-3.5 rounded-2xl bg-card-elevated text-foreground-secondary font-display font-semibold text-[13px] glow-border flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <CloudUpload size={16} />Upload
                </button>
              </div>
            </div>

            {/* Paste online order */}
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-card glow-border text-[12px] text-primary font-medium transition-all hover:bg-primary/5">
              <ClipboardList size={14} />
              Paste your online order confirmation
            </button>

            {/* How it works */}
            <div className="card-surface">
              <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">How it works</h3>
              <div className="space-y-3">
                {howItWorks.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <step.Icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-foreground">{step.title}</div>
                      <div className="text-[10px] text-foreground-tertiary">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── PROCESSING ─── */}
        {phase === "processing" && (
          <div className="animate-fade-up space-y-4">
            <div className="card-surface flex flex-col items-center py-8">
              {/* Animated receipt */}
              <div className="relative w-24 h-32 mb-8">
                <div className="absolute inset-0 rounded-2xl bg-card-elevated border border-primary/10 flex flex-col items-center justify-center overflow-hidden"
                  style={{ transform: "rotate(-3deg)" }}>
                  <div className="w-14 h-1 bg-foreground-tertiary/20 rounded mb-2" />
                  <div className="w-10 h-1 bg-foreground-tertiary/15 rounded mb-2" />
                  <div className="w-12 h-1 bg-foreground-tertiary/20 rounded mb-2" />
                  <div className="w-8 h-1 bg-foreground-tertiary/15 rounded mb-2" />
                  <div className="w-11 h-1 bg-foreground-tertiary/20 rounded" />
                </div>
                {/* Scanning line */}
                <div className="absolute left-0 right-0 h-0.5 bg-primary animate-scan-line rounded"
                  style={{ boxShadow: "0 0 12px hsl(142 69% 58% / 0.6)", transform: "rotate(-3deg)" }} />
              </div>

              {/* Steps */}
              <div className="w-full space-y-3.5">
                {processingSteps.map(({ step, label, sub, Icon }) => {
                  const done = processingStep > step;
                  const active = processingStep === step;
                  return (
                    <div key={step} className={`flex items-center gap-3 transition-all duration-500 ${processingStep >= step ? "opacity-100" : "opacity-25"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        done ? "bg-primary/20" : active ? "bg-primary/10 animate-glow-pulse" : "bg-card-elevated"
                      }`}>
                        {done ? <CircleCheckBig size={16} className="text-primary animate-check-pop" /> : <Icon size={16} className={active ? "text-primary" : "text-foreground-tertiary"} />}
                      </div>
                      <div className="flex-1">
                        <div className={`text-[13px] font-medium transition-colors ${active ? "text-foreground" : done ? "text-foreground-secondary" : "text-foreground-tertiary"}`}>
                          {label}
                        </div>
                        <div className="text-[10px] text-foreground-tertiary font-mono">{sub}</div>
                      </div>
                      {active && (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── RESULTS ─── */}
        {phase === "results" && (
          <div className="animate-fade-up space-y-4">
            {/* ESG Score */}
            <div className="card-surface flex flex-col items-center py-4">
              <ESGGauge score={642} grade="B-" size={180} change={12} />
            </div>

            {/* Trip Summary */}
            <div className="grid grid-cols-4 gap-2">
              {summaryItems.map(m => (
                <div key={m.label} className="card-surface p-3 flex flex-col items-center text-center">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                    <m.Icon size={14} className="text-primary" />
                  </div>
                  <span className="font-mono font-bold text-[15px] text-foreground">{summaryValues[m.key]}</span>
                  <span className="text-[10px] text-foreground-tertiary">{m.label}</span>
                </div>
              ))}
            </div>

            <button onClick={resetScan} className="flex items-center gap-2 text-[12px] text-foreground-tertiary font-medium">
              <RefreshCcw size={12} />Scan another receipt
            </button>

            {/* Item Breakdown */}
            <div className="space-y-2">
              <h3 className="font-display font-semibold text-[14px] text-foreground">Item Breakdown</h3>
              {sampleReceiptItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  expanded={expandedItem === item.id}
                  onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  esgBg={esgBg}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Item Card ──
const ItemCard: React.FC<{
  item: ScannedItem;
  expanded: boolean;
  onToggle: () => void;
  esgBg: (s: number) => string;
}> = ({ item, expanded, onToggle, esgBg }) => {
  const CategoryIcon = scanCategoryIcons[item.category];
  return (
    <div className="card-surface overflow-hidden">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {CategoryIcon ? <CategoryIcon size={16} className="text-primary" /> : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-foreground truncate">
              {item.name}{item.brand ? ` — ${item.brand}` : ""}
            </div>
            <div className="text-[11px] text-foreground-tertiary">${item.price.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${esgBg(item.esgScore)} text-[11px]`}>{item.co2}g CO₂</span>
            {expanded ? <ChevronUp size={14} className="text-foreground-tertiary" /> : <ChevronDown size={14} className="text-foreground-tertiary" />}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-foreground-tertiary">
          <span>{item.origin.flag}</span>
          <span>{item.origin.region || item.origin.country}</span>
          <span>·</span>
          <span>{item.origin.distance.toLocaleString()} km</span>
          <span>·</span>
          <span className="capitalize">{item.transport}</span>
        </div>
        {item.localAlt && !expanded && (
          <div className="mt-1.5 text-[11px] text-primary font-medium flex items-center gap-1">
            <Sprout size={10} /> Swap available
          </div>
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-up">
          {/* 3D Globe */}
          <GlobeVisualization origin={item.origin} transport={item.transport} distance={item.origin.distance} />

          {/* Supply Chain Breakdown */}
          <div>
            <div className="text-[11px] text-foreground-tertiary mb-2">Supply Chain Emissions</div>
            <div className="flex rounded-xl overflow-hidden h-3 bg-background-tertiary">
              <div className="bg-primary/60" style={{ width: `${item.breakdown.farming}%` }} />
              <div className="bg-primary" style={{ width: `${item.breakdown.processing}%` }} />
              <div style={{ width: `${item.breakdown.transport}%`, background: item.transport === "air" ? "hsl(0 72% 71%)" : "hsl(43 96% 56%)" }} />
              <div className="bg-foreground-tertiary/40" style={{ width: `${item.breakdown.packaging}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-foreground-tertiary">
              <span>Farm {item.breakdown.farming}%</span>
              <span>Process {item.breakdown.processing}%</span>
              <span>Transport {item.breakdown.transport}%</span>
              <span>Pack {item.breakdown.packaging}%</span>
            </div>
          </div>

          {/* Season */}
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-medium ${item.inSeason ? "text-primary" : "text-warning"}`}>
              {item.inSeason ? "✓ In season locally" : "✗ Out of season"}
            </span>
          </div>

          {/* Local Alt */}
          {item.localAlt && (
            <div className="p-3 rounded-2xl bg-primary/5 glow-border">
              <div className="text-[11px] text-foreground-tertiary mb-2">Local Alternative</div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[13px] font-semibold text-foreground">{item.localAlt.name}</div>
                  <div className="text-[11px] text-foreground-tertiary">{item.localAlt.origin} · {item.localAlt.distance} km</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-mono font-semibold text-primary">{item.localAlt.co2}g CO₂</div>
                  <div className="text-[10px] text-primary">-{Math.round(((item.co2 - item.localAlt.co2) / item.co2) * 100)}% carbon</div>
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-[12px] font-display font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-95">
                Swap next time <MoveRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScannerScreen;
