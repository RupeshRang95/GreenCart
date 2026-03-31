import React, {
  useState,
  useRef,
  useMemo,
  Suspense,
  lazy,
  useCallback,
  useEffect,
} from "react";
import {
  Aperture,
  CloudUpload,
  ChevronDown,
  ChevronUp,
  MoveRight,
  RefreshCcw,
  ClipboardList,
  CircleCheckBig,
  ScanSearch,
  ClipboardCheck,
  Globe2,
  BarChart4,
  ScanBarcode,
  Loader2,
  Plus,
  Minus,
  Trash2,
  Clock,
  TrendingDown,
  TrendingUp,
  Award,
  Truck,
  Ship,
  Plane,
  Train,
} from "lucide-react";
import { sampleReceiptItems, type ScannedItem } from "@/data/mockData";
import ESGGauge from "@/components/ESGGauge";
import GlobeVisualization from "@/components/GlobeVisualization";
import { scanCategoryIcons } from "@/components/IconMap";
import { ShoppingCart, MapPinned, Sprout, Banknote } from "lucide-react";
import { toast } from "sonner";
import {
  aggregateTripScore,
  itemFromBarcode,
  runPasteOrderPipeline,
  runReceiptPipeline,
} from "@/lib/scanPipeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  loadTripHistory,
  saveTripToHistory,
  deleteTripFromHistory,
  gradeColor,
  type SavedTrip,
} from "@/lib/tripHistory";
import {
  processTripXP,
  loadGamificationState,
  type XPBreakdown,
} from "@/lib/gamification";
import { isLocalProduct } from "@/services/openFoodFacts";

const BarcodeScannerModal = lazy(
  () => import("@/components/BarcodeScannerModal"),
);
const ScanCelebration = lazy(() => import("@/components/ScanCelebration"));

type ScanPhase = "idle" | "processing" | "results" | "history";

const processingSteps = [
  {
    step: 1,
    label: "Reading receipt...",
    sub: "Tesseract OCR → line normalization",
    Icon: ScanSearch,
  },
  {
    step: 2,
    label: "Identifying products...",
    sub: "Name matching → Open Food Facts lookup",
    Icon: ClipboardCheck,
  },
  {
    step: 3,
    label: "Looking up origins...",
    sub: "Brand DB → produce DB → category heuristic",
    Icon: Globe2,
  },
  {
    step: 4,
    label: "Calculating impact...",
    sub: "Poore & Nemecek emission factors → ESG score",
    Icon: BarChart4,
  },
];

const TRANSPORT_META: Record<
  string,
  {
    icon: React.FC<{ size?: number; className?: string }>;
    label: string;
    color: string;
  }
> = {
  truck: { icon: Truck, label: "Truck", color: "text-yellow-400" },
  ship: { icon: Ship, label: "Ship", color: "text-blue-400" },
  air: { icon: Plane, label: "Air", color: "text-red-400" },
  rail: { icon: Train, label: "Rail", color: "text-primary" },
};

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  meat: { icon: "🥩", label: "Meat & Fish" },
  dairy: { icon: "🥛", label: "Dairy" },
  fruit: { icon: "🍎", label: "Fruit" },
  vegetable: { icon: "🥬", label: "Vegetables" },
  grain: { icon: "🌾", label: "Grains" },
  packaged: { icon: "📦", label: "Packaged" },
  bakery: { icon: "🍞", label: "Bakery" },
};

function buildCategoryBreakdown(items: ScannedItem[]) {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item.category] = (map[item.category] ?? 0) + item.co2;
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(map)
    .map(([cat, co2]) => ({
      cat,
      co2,
      co2kg: (co2 / 1000).toFixed(2),
      pct: Math.round((co2 / total) * 100),
      ...(CATEGORY_META[cat] ?? { icon: "📦", label: cat }),
    }))
    .sort((a, b) => b.co2 - a.co2);
}

function buildTransportBreakdown(items: ScannedItem[]) {
  const map: Record<string, number> = {};
  for (const item of items)
    map[item.transport] = (map[item.transport] ?? 0) + 1;
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function formatGrade(score: number): string {
  if (score >= 800) return "A+";
  if (score >= 750) return "A";
  if (score >= 720) return "A-";
  if (score >= 700) return "B+";
  if (score >= 670) return "B";
  if (score >= 640) return "B-";
  if (score >= 600) return "C+";
  if (score >= 550) return "C";
  if (score >= 520) return "C-";
  return "D";
}

// ─────────────────────────────────────────────────────────────────────────────
const ScannerScreen: React.FC = () => {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [processingStep, setProcessingStep] = useState(0);
  const [processingDetail, setProcessingDetail] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [receiptItems, setReceiptItems] = useState<ScannedItem[]>([]);
  const [tripMeta, setTripMeta] = useState(() =>
    aggregateTripScore(sampleReceiptItems),
  );
  const [savedTrip, setSavedTrip] = useState<SavedTrip | null>(null);

  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodePending, setBarcodePending] = useState<ScannedItem[]>([]);
  const [barcodeFeedback, setBarcodeFeedback] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const [barcodeBusy, setBarcodeBusy] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [history, setHistory] = useState<SavedTrip[]>([]);
  const [historyItem, setHistoryItem] = useState<SavedTrip | null>(null);
  const [celebration, setCelebration] = useState<{
    breakdown: XPBreakdown;
    totalXP: number;
    streak: number;
  } | null>(null);

  const [captureMode, setCaptureMode] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(loadTripHistory());
  }, []);

  const openFilePicker = (mode?: "environment") => {
    setCaptureMode(mode);
    requestAnimationFrame(() => fileRef.current?.click());
  };

  const finalizeResults = useCallback((items: ScannedItem[]) => {
    const meta = aggregateTripScore(items);
    setReceiptItems(items);
    setTripMeta(meta);
    const trip = saveTripToHistory(items, {
      score: meta.score,
      grade: meta.grade,
    });
    setSavedTrip(trip);
    setHistory(loadTripHistory());
    setPhase("results");
    setBarcodePending([]);
    setBarcodeFeedback(null);
    setProcessingDetail("");
    // Fire gamification engine and show celebration
    const breakdown = processTripXP(items, {
      score: meta.score,
      grade: meta.grade,
    });
    const gs = loadGamificationState();
    setCelebration({ breakdown, totalXP: gs.xp, streak: gs.streak });
  }, []);

  const applyFallbackDemo = (msg: string) => {
    toast.message(msg, {
      description: "Showing demo trip data so you can explore the UI.",
    });
    const merged = [...barcodePending, ...sampleReceiptItems];
    finalizeResults(merged);
  };

  const runPipeline = async (fn: () => Promise<ScannedItem[]>) => {
    setPhase("processing");
    setProcessingStep(1);
    setProcessingDetail("");
    try {
      const items = await fn();
      const merged = [...barcodePending, ...items];
      if (merged.length === 0) {
        applyFallbackDemo("No items found.");
        return;
      }
      finalizeResults(merged);
      toast.success("Trip analyzed — results saved to your history.");
    } catch (e) {
      applyFallbackDemo(e instanceof Error ? e.message : "Scan failed");
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setCaptureMode(undefined);
    if (!file || !file.type.startsWith("image/")) {
      if (file) toast.error("Please choose an image (JPG, PNG, or HEIC).");
      return;
    }
    await runPipeline(() =>
      runReceiptPipeline(file, {
        onStep: (step, detail) => {
          setProcessingStep(step);
          setProcessingDetail(detail);
        },
      }),
    );
  };

  const submitPaste = async () => {
    setPasteOpen(false);
    const text = pasteText.trim();
    setPasteText("");
    if (!text) return;
    await runPipeline(() =>
      runPasteOrderPipeline(text, {
        onStep: (step, detail) => {
          setProcessingStep(step);
          setProcessingDetail(detail);
        },
      }),
    );
  };

  const lookupBarcode = async () => {
    const code = barcodeInput.replace(/\D/g, "");
    if (code.length < 6) {
      setBarcodeFeedback({
        kind: "err",
        text: "Enter at least 6 digits from the package barcode.",
      });
      return;
    }
    setBarcodeBusy(true);
    setBarcodeFeedback(null);
    try {
      const item = await itemFromBarcode(code);
      if (!item) {
        setBarcodeFeedback({
          kind: "err",
          text: "No match found. Try a national brand barcode (e.g. from Burnbrae, Chiquita, Natrel).",
        });
        toast.error("No product found for this barcode");
        return;
      }
      setBarcodePending((p) => [...p, item]);
      setBarcodeInput("");
      const ok = `Added: ${item.name}${item.brand ? ` (${item.brand})` : ""}`;
      setBarcodeFeedback({ kind: "ok", text: ok });
      toast.success(ok);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Lookup failed (network or blocked).";
      setBarcodeFeedback({ kind: "err", text: msg });
      toast.error("Barcode lookup failed");
    } finally {
      setBarcodeBusy(false);
    }
  };

  const onBarcodeDetected = async (code: string) => {
    setScannerOpen(false);
    setBarcodeInput(code);
    setBarcodeOpen(true);
    setBarcodeBusy(true);
    setBarcodeFeedback(null);
    try {
      const item = await itemFromBarcode(code);
      if (!item) {
        setBarcodeFeedback({
          kind: "err",
          text: "No match found. Try another barcode or type it manually.",
        });
        toast.error("No product found");
        return;
      }
      setBarcodePending((p) => [...p, item]);
      setBarcodeInput("");
      const ok = `Added: ${item.name}${item.brand ? ` (${item.brand})` : ""}`;
      setBarcodeFeedback({ kind: "ok", text: ok });
      toast.success(ok);
    } catch (e) {
      setBarcodeFeedback({
        kind: "err",
        text: e instanceof Error ? e.message : "Lookup failed.",
      });
      toast.error("Barcode lookup failed");
    } finally {
      setBarcodeBusy(false);
    }
  };

  const resetScan = () => {
    setPhase("idle");
    setProcessingStep(0);
    setExpandedItem(null);
    setReceiptItems([]);
    setBarcodePending([]);
    setBarcodeFeedback(null);
    setProcessingDetail("");
    setSavedTrip(null);
    setBarcodeOpen(false);
  };

  const deleteHistory = (id: string) => {
    deleteTripFromHistory(id);
    setHistory(loadTripHistory());
    if (historyItem?.id === id) setHistoryItem(null);
  };

  // ── Derived data (results view) ──────────────────────────────────────────
  const displayItems =
    phase === "results" && receiptItems.length > 0
      ? receiptItems
      : historyItem
        ? historyItem.items
        : sampleReceiptItems;

  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(displayItems),
    [displayItems],
  );
  const transportBreakdown = useMemo(
    () => buildTransportBreakdown(displayItems),
    [displayItems],
  );
  const totalCO2g = useMemo(
    () => displayItems.reduce((s, i) => s + i.co2, 0),
    [displayItems],
  );
  const userCountry = "canada";
  const pctLocal = useMemo(() => {
    const localCount = displayItems.filter((i) =>
      isLocalProduct(i, userCountry),
    ).length;
    return Math.round((localCount / Math.max(displayItems.length, 1)) * 100);
  }, [displayItems]);
  const totalSpent = useMemo(
    () => displayItems.reduce((s, i) => s + i.price, 0),
    [displayItems],
  );
  const worstItems = useMemo(
    () => [...displayItems].sort((a, b) => b.co2 - a.co2).slice(0, 3),
    [displayItems],
  );
  const bestItems = useMemo(
    () => [...displayItems].sort((a, b) => a.co2 - b.co2).slice(0, 3),
    [displayItems],
  );

  const activeScore =
    phase === "results"
      ? tripMeta.score
      : historyItem
        ? historyItem.esgScore
        : 642;
  const activeGrade =
    phase === "results"
      ? tripMeta.grade
      : historyItem
        ? historyItem.grade
        : "B-";
  const activeChange = phase === "results" ? tripMeta.change : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        capture={captureMode as "user" | "environment" | undefined}
        onChange={onFileChange}
      />

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="max-w-[min(100vw-2rem,420px)] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">
              Paste order confirmation
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"Example:\nStrawberries 4.99\nEggs 6.49\nBananas 1.49"}
            className="min-h-[140px] font-mono text-xs"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPasteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submitPaste()}>Analyze</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <BarcodeScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetected={onBarcodeDetected}
        />
      </Suspense>

      <Suspense fallback={null}>
        {celebration && (
          <ScanCelebration
            breakdown={celebration.breakdown}
            totalXP={celebration.totalXP}
            streak={celebration.streak}
            onClose={() => setCelebration(null)}
          />
        )}
      </Suspense>

      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-lg text-foreground">
            {phase === "history" ? "Trip History" : "Scan Receipt"}
          </h1>
          <p className="text-[12px] text-foreground-tertiary">
            {phase === "history"
              ? `${history.length} saved trips`
              : "Snap your receipt to see the true cost"}
          </p>
        </div>
        {history.length > 0 && phase === "idle" && (
          <button
            type="button"
            onClick={() => setPhase("history")}
            className="flex items-center gap-1.5 text-[11px] text-primary font-medium px-3 py-1.5 rounded-xl bg-primary/10"
          >
            <Clock size={12} />
            History
          </button>
        )}
        {phase === "history" && (
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="text-[12px] text-primary font-medium"
          >
            Done
          </button>
        )}
      </div>

      {/* ── SCROLL BODY ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6">
        {/* ══ IDLE ═══════════════════════════════════════════════════════════ */}
        {phase === "idle" && (
          <div className="animate-fade-up space-y-3">
            {/* Main scan card */}
            <div className="card-surface overflow-hidden">
              <div className="flex flex-col items-center py-8 px-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-float">
                  <Aperture size={28} className="text-primary" />
                </div>
                <p className="text-[15px] font-display font-bold text-foreground mb-1">
                  Scan your receipt
                </p>
                <p className="text-[11px] text-foreground-tertiary mb-5 text-center">
                  Canadian grocery receipts (Walmart, FreshCo, No Frills,
                  Sobeys, and more)
                </p>
                <div className="flex gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => openFilePicker("environment")}
                    className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <Aperture size={15} /> Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => openFilePicker()}
                    className="flex-1 py-3 rounded-2xl bg-card-elevated text-foreground-secondary font-display font-semibold text-[13px] glow-border flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <CloudUpload size={15} /> Upload
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40 mx-4" />

              {/* Barcode section - collapsible */}
              <div className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setBarcodeOpen((o) => !o)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-[12px] font-display font-semibold text-foreground">
                    <ScanBarcode size={14} className="text-primary" />
                    Add items by barcode
                    {barcodePending.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {barcodePending.length}
                      </span>
                    )}
                  </div>
                  {barcodeOpen ? (
                    <Minus size={14} className="text-foreground-tertiary" />
                  ) : (
                    <Plus size={14} className="text-foreground-tertiary" />
                  )}
                </button>

                {barcodeOpen && (
                  <div className="mt-3 space-y-2 animate-fade-up">
                    <div className="flex gap-2">
                      <input
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void lookupBarcode();
                          }
                        }}
                        placeholder="Type or scan barcode digits"
                        className="flex-1 rounded-xl bg-background-tertiary border border-border px-3 py-2 text-[12px] font-mono text-foreground placeholder:text-foreground-tertiary"
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        disabled={barcodeBusy}
                        className="shrink-0 w-9 h-9 rounded-xl bg-card-elevated border border-border flex items-center justify-center disabled:opacity-50"
                        title="Use camera"
                      >
                        <ScanBarcode size={15} className="text-primary" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void lookupBarcode()}
                        disabled={barcodeBusy}
                        className="shrink-0 px-3 h-9 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-[11px] flex items-center gap-1 disabled:opacity-50"
                      >
                        {barcodeBusy ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : null}
                        Add
                      </button>
                    </div>

                    {barcodeFeedback && (
                      <p
                        className={`text-[11px] px-3 py-2 rounded-xl ${
                          barcodeFeedback.kind === "ok"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                      >
                        {barcodeFeedback.text}
                      </p>
                    )}

                    {barcodePending.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {barcodePending.map((b, i) => (
                          <span
                            key={b.id}
                            className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium flex items-center gap-1"
                          >
                            {b.name}
                            <button
                              type="button"
                              onClick={() =>
                                setBarcodePending((p) =>
                                  p.filter((_, j) => j !== i),
                                )
                              }
                              className="ml-0.5 opacity-60 hover:opacity-100"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {barcodePending.length > 0 && (
                      <button
                        type="button"
                        onClick={() => finalizeResults(barcodePending)}
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-[12px] flex items-center justify-center gap-1.5"
                      >
                        Analyze {barcodePending.length} item
                        {barcodePending.length !== 1 ? "s" : ""} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Paste order */}
            <button
              type="button"
              onClick={() => setPasteOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-card glow-border text-[12px] text-primary font-medium"
            >
              <ClipboardList size={13} />
              Paste online order confirmation
            </button>

            {/* Recent history strip */}
            {history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-display font-semibold text-foreground">
                    Recent trips
                  </p>
                  {history.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setPhase("history")}
                      className="text-[11px] text-primary"
                    >
                      See all →
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {history.slice(0, 3).map((trip) => (
                    <TripHistoryCard
                      key={trip.id}
                      trip={trip}
                      onOpen={() => {
                        setHistoryItem(trip);
                        setPhase("results");
                      }}
                      onDelete={() => deleteHistory(trip.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROCESSING ═════════════════════════════════════════════════════ */}
        {phase === "processing" && (
          <div className="animate-fade-up space-y-4">
            <div className="card-surface flex flex-col items-center py-8">
              <div className="relative w-24 h-32 mb-6">
                <div
                  className="absolute inset-0 rounded-2xl bg-card-elevated border border-primary/10 flex flex-col items-center justify-center overflow-hidden"
                  style={{ transform: "rotate(-3deg)" }}
                >
                  <div className="w-14 h-1 bg-foreground-tertiary/20 rounded mb-2" />
                  <div className="w-10 h-1 bg-foreground-tertiary/15 rounded mb-2" />
                  <div className="w-12 h-1 bg-foreground-tertiary/20 rounded mb-2" />
                  <div className="w-8 h-1 bg-foreground-tertiary/15 rounded mb-2" />
                  <div className="w-11 h-1 bg-foreground-tertiary/20 rounded" />
                </div>
                <div
                  className="absolute left-0 right-0 h-0.5 bg-primary animate-scan-line rounded"
                  style={{
                    boxShadow: "0 0 12px hsl(142 69% 58% / 0.6)",
                    transform: "rotate(-3deg)",
                  }}
                />
              </div>
              {processingDetail && (
                <p className="text-[10px] text-primary/90 font-mono text-center mb-4 px-2">
                  {processingDetail}
                </p>
              )}
              <div className="w-full space-y-3.5">
                {processingSteps.map(({ step, label, sub, Icon }) => {
                  const done = processingStep > step;
                  const active = processingStep === step;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 transition-all duration-500 ${processingStep >= step ? "opacity-100" : "opacity-25"}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${done ? "bg-primary/20" : active ? "bg-primary/10 animate-glow-pulse" : "bg-card-elevated"}`}
                      >
                        {done ? (
                          <CircleCheckBig
                            size={16}
                            className="text-primary animate-check-pop"
                          />
                        ) : (
                          <Icon
                            size={16}
                            className={
                              active
                                ? "text-primary"
                                : "text-foreground-tertiary"
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[13px] font-medium transition-colors ${active ? "text-foreground" : done ? "text-foreground-secondary" : "text-foreground-tertiary"}`}
                        >
                          {label}
                        </div>
                        <div className="text-[10px] text-foreground-tertiary font-mono truncate">
                          {active && processingDetail ? processingDetail : sub}
                        </div>
                      </div>
                      {active && (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ RESULTS ════════════════════════════════════════════════════════ */}
        {phase === "results" && (
          <div className="animate-fade-up space-y-3">
            {/* Save banner */}
            {savedTrip && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <CircleCheckBig size={14} className="text-primary shrink-0" />
                <span className="text-[11px] text-primary font-medium flex-1">
                  Trip saved · {savedTrip.displayDate}
                </span>
                <button
                  type="button"
                  onClick={resetScan}
                  className="flex items-center gap-1 text-[10px] text-primary/80 font-medium"
                >
                  <RefreshCcw size={10} /> New scan
                </button>
              </div>
            )}
            {!savedTrip && historyItem && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-card-elevated border border-border">
                <Clock
                  size={13}
                  className="text-foreground-tertiary shrink-0"
                />
                <span className="text-[11px] text-foreground-secondary flex-1">
                  {historyItem.displayDate}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryItem(null);
                    setPhase("history");
                  }}
                  className="text-[10px] text-primary font-medium"
                >
                  ← History
                </button>
              </div>
            )}

            {/* ESG gauge */}
            <div className="card-surface flex flex-col items-center py-5">
              <ESGGauge
                score={activeScore}
                grade={activeGrade}
                size={170}
                change={activeChange}
              />
              {activeChange !== 0 && (
                <div
                  className={`flex items-center gap-1 text-[11px] font-medium mt-1 ${activeChange > 0 ? "text-primary" : "text-destructive"}`}
                >
                  {activeChange > 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {activeChange > 0 ? "+" : ""}
                  {activeChange} pts from last trip
                </div>
              )}
            </div>

            {/* 4 summary pills */}
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "Items",
                  value: displayItems.length.toString(),
                  Icon: ShoppingCart,
                },
                { label: "Local", value: `${pctLocal}%`, Icon: MapPinned },
                {
                  label: "CO₂",
                  value: `${(totalCO2g / 1000).toFixed(1)}kg`,
                  Icon: Sprout,
                },
                {
                  label: "Spent",
                  value: `$${totalSpent.toFixed(0)}`,
                  Icon: Banknote,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="card-surface p-2.5 flex flex-col items-center text-center"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                    <m.Icon size={12} className="text-primary" />
                  </div>
                  <span className="font-mono font-bold text-[14px] text-foreground leading-tight">
                    {m.value}
                  </span>
                  <span className="text-[9px] text-foreground-tertiary">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Transport breakdown */}
            <div className="card-surface p-4">
              <p className="text-[12px] font-display font-semibold text-foreground mb-3">
                Transport modes
              </p>
              <div className="flex flex-wrap gap-2">
                {transportBreakdown.map(([mode, count]) => {
                  const meta = TRANSPORT_META[mode] ?? TRANSPORT_META.truck;
                  const TIcon = meta.icon;
                  return (
                    <div
                      key={mode}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background-tertiary border border-border"
                    >
                      <TIcon size={12} className={meta.color} />
                      <span className="text-[11px] text-foreground-secondary font-medium capitalize">
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-foreground-tertiary">
                        · {count} item{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              {transportBreakdown.some(([m]) => m === "air") && (
                <p className="mt-2 text-[10px] text-red-400/80 leading-snug">
                  ✈️ Air-freighted items have 50× higher transport emissions
                  than ship.
                </p>
              )}
            </div>

            {/* Carbon by category */}
            <div className="card-surface p-4">
              <p className="text-[12px] font-display font-semibold text-foreground mb-3">
                Carbon by category
              </p>
              <div className="space-y-2.5">
                {categoryBreakdown.map((c) => (
                  <div key={c.cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-foreground-secondary flex items-center gap-1.5">
                        {c.icon} {c.label}
                      </span>
                      <span className="text-[11px] font-mono text-foreground-tertiary">
                        {c.co2kg} kg
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{
                          width: `${c.pct}%`,
                          background:
                            c.pct > 35
                              ? "hsl(0 72% 71%)"
                              : c.pct > 20
                                ? "hsl(43 96% 56%)"
                                : "hsl(142 69% 58%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-2">
              {/* Best items */}
              <div className="card-surface p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Award size={12} className="text-primary" />
                  <p className="text-[11px] font-display font-semibold text-foreground">
                    Low impact
                  </p>
                </div>
                <div className="space-y-1.5">
                  {bestItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-1"
                    >
                      <span className="text-[10px] text-foreground-secondary truncate flex-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-primary shrink-0">
                        {item.co2}g
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Worst items */}
              <div className="card-surface p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-destructive" />
                  <p className="text-[11px] font-display font-semibold text-foreground">
                    High impact
                  </p>
                </div>
                <div className="space-y-1.5">
                  {worstItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-1"
                    >
                      <span className="text-[10px] text-foreground-secondary truncate flex-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-destructive shrink-0">
                        {(item.co2 / 1000).toFixed(1)}kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Swap opportunities */}
            {displayItems.some((i) => i.localAlt) && (
              <div className="card-surface p-4">
                <p className="text-[12px] font-display font-semibold text-foreground mb-3">
                  💡 Swap suggestions
                </p>
                <div className="space-y-2.5">
                  {displayItems
                    .filter((i) => i.localAlt)
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-background-tertiary"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-foreground-tertiary">
                            Instead of
                          </div>
                          <div className="text-[11px] font-semibold text-foreground truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-foreground-tertiary">
                            {item.co2}g CO₂
                          </div>
                        </div>
                        <MoveRight
                          size={14}
                          className="text-primary shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-[10px] text-primary">
                            Try local
                          </div>
                          <div className="text-[11px] font-semibold text-foreground truncate">
                            {item.localAlt!.name}
                          </div>
                          <div className="text-[10px] text-primary">
                            {item.localAlt!.co2}g · -
                            {Math.round(
                              ((item.co2 - item.localAlt!.co2) / item.co2) *
                                100,
                            )}
                            % CO₂
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Item breakdown */}
            <div>
              <p className="text-[12px] font-display font-semibold text-foreground mb-2">
                All items ({displayItems.length})
              </p>
              <div className="space-y-2">
                {displayItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    expanded={expandedItem === item.id}
                    onToggle={() =>
                      setExpandedItem(expandedItem === item.id ? null : item.id)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ HISTORY ════════════════════════════════════════════════════════ */}
        {phase === "history" && (
          <div className="animate-fade-up space-y-2">
            {history.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Clock size={32} className="text-foreground-tertiary" />
                <p className="text-[13px] text-foreground-tertiary">
                  No trips saved yet
                </p>
                <button
                  type="button"
                  onClick={resetScan}
                  className="text-[12px] text-primary font-medium"
                >
                  Scan your first receipt →
                </button>
              </div>
            ) : (
              history.map((trip) => (
                <TripHistoryCard
                  key={trip.id}
                  trip={trip}
                  onOpen={() => {
                    setHistoryItem(trip);
                    setSavedTrip(null);
                    setPhase("results");
                  }}
                  onDelete={() => deleteHistory(trip.id)}
                  expanded
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Trip history card ────────────────────────────────────────────────────────
const TripHistoryCard: React.FC<{
  trip: SavedTrip;
  onOpen: () => void;
  onDelete: () => void;
  expanded?: boolean;
}> = ({ trip, onOpen, onDelete, expanded }) => {
  const gc = gradeColor(trip.grade);
  return (
    <div className="card-surface">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0`}
          >
            <span className={`text-[15px] font-display font-bold ${gc}`}>
              {trip.grade}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground">
                {trip.displayDate}
              </span>
              {trip.store && (
                <span className="text-[10px] text-foreground-tertiary">
                  · {trip.store}
                </span>
              )}
            </div>
            <div className="text-[11px] text-foreground-tertiary">
              {trip.itemCount} items · ${trip.totalSpent.toFixed(2)} ·{" "}
              {(trip.co2TotalG / 1000).toFixed(2)} kg CO₂
            </div>
          </div>
          {expanded && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-foreground-tertiary hover:text-destructive"
              >
                <Trash2 size={13} />
              </button>
              <ChevronDown
                size={14}
                className="text-foreground-tertiary -rotate-90"
              />
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-2.5 flex gap-2">
            <div className="flex-1 px-2.5 py-1.5 rounded-xl bg-background-tertiary text-center">
              <div className="text-[12px] font-mono font-bold text-foreground">
                {trip.pctLocal}%
              </div>
              <div className="text-[9px] text-foreground-tertiary">Local</div>
            </div>
            <div className="flex-1 px-2.5 py-1.5 rounded-xl bg-background-tertiary text-center">
              <div className="text-[12px] font-mono font-bold text-foreground">
                {(trip.co2TotalG / 1000).toFixed(2)}
              </div>
              <div className="text-[9px] text-foreground-tertiary">kg CO₂</div>
            </div>
            <div className="flex-1 px-2.5 py-1.5 rounded-xl bg-background-tertiary text-center">
              <div className={`text-[12px] font-display font-bold ${gc}`}>
                {trip.esgScore}
              </div>
              <div className="text-[9px] text-foreground-tertiary">ESG pts</div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

// ─── Item card ────────────────────────────────────────────────────────────────
const ItemCard: React.FC<{
  item: ScannedItem;
  expanded: boolean;
  onToggle: () => void;
}> = ({ item, expanded, onToggle }) => {
  const CategoryIcon = scanCategoryIcons[item.category];
  const co2Color =
    item.co2 > 2000
      ? "text-destructive"
      : item.co2 > 800
        ? "text-warning"
        : "text-primary";

  return (
    <div className="card-surface overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {CategoryIcon ? (
              <CategoryIcon size={14} className="text-primary" />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-foreground truncate">
              {item.name}
              {item.brand ? ` — ${item.brand}` : ""}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground-tertiary mt-0.5">
              <span>{item.origin.flag}</span>
              <span>{item.origin.region ?? item.origin.country}</span>
              <span>·</span>
              <span>{item.origin.distance.toLocaleString()} km</span>
              <span>·</span>
              <span className="capitalize">{item.transport}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className={`text-[12px] font-mono font-bold ${co2Color}`}>
                {item.co2 >= 1000
                  ? `${(item.co2 / 1000).toFixed(1)}kg`
                  : `${item.co2}g`}
              </div>
              <div className="text-[9px] text-foreground-tertiary">
                ${item.price.toFixed(2)}
              </div>
            </div>
            {expanded ? (
              <ChevronUp size={13} className="text-foreground-tertiary" />
            ) : (
              <ChevronDown size={13} className="text-foreground-tertiary" />
            )}
          </div>
        </div>

        {/* ESG score bar */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-background-tertiary overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.esgScore}%`,
                background:
                  item.esgScore >= 70
                    ? "hsl(142 69% 58%)"
                    : item.esgScore >= 45
                      ? "hsl(43 96% 56%)"
                      : "hsl(0 72% 71%)",
              }}
            />
          </div>
          <span className="text-[10px] text-foreground-tertiary font-mono shrink-0">
            {item.esgScore}/100
          </span>
          {item.localAlt && !expanded && (
            <span className="text-[9px] text-primary font-medium shrink-0 flex items-center gap-0.5">
              <Sprout size={9} /> swap
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-up border-t border-border/40 pt-4">
          <GlobeVisualization
            origin={item.origin}
            transport={item.transport}
            distance={item.origin.distance}
          />

          {/* Emission breakdown */}
          <div>
            <div className="text-[11px] text-foreground-tertiary mb-2">
              Emission breakdown
            </div>
            <div className="flex rounded-xl overflow-hidden h-3 bg-background-tertiary">
              <div
                className="bg-primary/50"
                style={{ width: `${item.breakdown.farming}%` }}
              />
              <div
                className="bg-primary"
                style={{ width: `${item.breakdown.processing}%` }}
              />
              <div
                style={{
                  width: `${item.breakdown.transport}%`,
                  background:
                    item.transport === "air"
                      ? "hsl(0 72% 71%)"
                      : "hsl(43 96% 56%)",
                }}
              />
              <div
                className="bg-foreground-tertiary/30"
                style={{ width: `${item.breakdown.packaging}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-foreground-tertiary">
              <span>Farm {item.breakdown.farming}%</span>
              <span>Process {item.breakdown.processing}%</span>
              <span>Transport {item.breakdown.transport}%</span>
              <span>Pack {item.breakdown.packaging}%</span>
            </div>
          </div>

          <div
            className={`text-[11px] font-medium ${item.inSeason ? "text-primary" : "text-warning"}`}
          >
            {item.inSeason ? "✓ In season locally" : "✗ Out of local season"}
          </div>

          {item.barcode && (
            <div className="text-[10px] font-mono text-foreground-tertiary/70">
              Barcode: {item.barcode}
            </div>
          )}

          {item.localAlt && (
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/15">
              <div className="text-[10px] text-foreground-tertiary mb-2">
                🌿 Local alternative
              </div>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <div className="text-[13px] font-semibold text-foreground">
                    {item.localAlt.name}
                  </div>
                  <div className="text-[10px] text-foreground-tertiary">
                    {item.localAlt.origin} · {item.localAlt.distance} km
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-mono font-bold text-primary">
                    {item.localAlt.co2}g CO₂
                  </div>
                  <div className="text-[10px] text-primary">
                    -
                    {Math.round(
                      ((item.co2 - item.localAlt.co2) / item.co2) * 100,
                    )}
                    % carbon
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-[12px] font-display font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                Swap next time <MoveRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScannerScreen;
