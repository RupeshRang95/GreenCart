import React, { useEffect, useState } from "react";
import { Zap, TrendingUp, ChevronRight, X, Flame, Star } from "lucide-react";
import type { XPBreakdown } from "@/lib/gamification";
import { getLevelInfo, getLevelProgress } from "@/lib/gamification";

interface ScanCelebrationProps {
  breakdown: XPBreakdown;
  totalXP: number;
  streak: number;
  onClose: () => void;
}

const ScanCelebration: React.FC<ScanCelebrationProps> = ({
  breakdown,
  totalXP,
  streak,
  onClose,
}) => {
  const [show, setShow] = useState(false);
  const levelInfo = getLevelInfo(totalXP);
  const progress = getLevelProgress(totalXP);
  const prevProgress = getLevelProgress(totalXP - breakdown.total);

  useEffect(() => {
    // Slight delay so animation runs on mount
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 200);
  };

  const xpRows = [
    { label: "Scan base",          value: breakdown.base,             show: true },
    { label: `ESG score bonus`,    value: breakdown.esgBonus,         show: breakdown.esgBonus > 0 },
    { label: `Local items ×${breakdown.localBonus / 5}`,  value: breakdown.localBonus,       show: breakdown.localBonus > 0 },
    { label: "Organic items",      value: breakdown.organicBonus,     show: breakdown.organicBonus > 0 },
    { label: "In-season items",    value: breakdown.inSeasonBonus,    show: breakdown.inSeasonBonus > 0 },
    { label: "Zero air freight!",  value: breakdown.zeroAirBonus,     show: breakdown.zeroAirBonus > 0 },
    { label: "80%+ local trip!",   value: breakdown.allLocalBonus,    show: breakdown.allLocalBonus > 0 },
    { label: "Perfect trip (A+)!", value: breakdown.perfectTripBonus, show: breakdown.perfectTripBonus > 0 },
  ].filter((r) => r.show);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-card border-t border-border overflow-hidden"
        style={{
          transform: show ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex flex-col items-center pt-6 pb-4 px-5">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center"
          >
            <X size={14} className="text-foreground-tertiary" />
          </button>

          {/* XP burst */}
          <div className="w-16 h-16 rounded-3xl bg-primary/15 border border-primary/30 flex flex-col items-center justify-center mb-3 relative">
            <Zap size={20} className="text-primary mb-0.5" />
            <div
              className="text-[18px] font-display font-black text-primary leading-none"
              style={{
                transform: show ? "scale(1)" : "scale(0.5)",
                transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
              }}
            >
              +{breakdown.total}
            </div>
          </div>
          <p className="text-[15px] font-display font-bold text-foreground">Trip Complete!</p>
          <p className="text-[11px] text-foreground-tertiary">
            {breakdown.leveledUp ? `🎉 Level up! ${levelInfo.icon} ${levelInfo.name}` : "Your eco impact is tracked"}
          </p>
        </div>

        {/* XP breakdown */}
        <div className="mx-4 mb-3 rounded-2xl bg-background-tertiary overflow-hidden">
          {xpRows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-3 py-2"
              style={{ borderTop: i > 0 ? "1px solid hsl(var(--border) / 0.4)" : "none" }}
            >
              <span className="text-[11px] text-foreground-secondary">{row.label}</span>
              <span className="text-[11px] font-mono font-semibold text-primary">+{row.value} XP</span>
            </div>
          ))}
          {breakdown.streakMultiplier > 1 && (
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderTop: "1px solid hsl(var(--border) / 0.4)" }}
            >
              <span className="text-[11px] text-foreground-secondary flex items-center gap-1.5">
                <Flame size={11} className="text-orange-400" />
                {streak}-week streak ({breakdown.streakMultiplier}×)
              </span>
              <span className="text-[11px] font-mono font-semibold text-orange-400">
                ×{breakdown.streakMultiplier}
              </span>
            </div>
          )}
          <div
            className="flex items-center justify-between px-3 py-2 bg-primary/8"
            style={{ borderTop: "1px solid hsl(var(--border) / 0.4)" }}
          >
            <span className="text-[12px] font-display font-semibold text-foreground">Total earned</span>
            <span className="text-[13px] font-display font-black text-primary">+{breakdown.total} XP</span>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="mx-4 mb-3 p-3 rounded-2xl bg-card-elevated">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px]">{levelInfo.icon}</span>
              <span className="text-[12px] font-display font-semibold text-foreground">
                Level {levelInfo.level} {levelInfo.name}
              </span>
            </div>
            <span className="text-[10px] text-foreground-tertiary font-mono">
              {totalXP.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2 rounded-full bg-background-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${prevProgress}%` }}
            />
            <div
              className="h-full rounded-full bg-primary -mt-2 transition-all duration-1000 ease-out"
              style={{
                width: show ? `${progress}%` : `${prevProgress}%`,
                transitionDelay: "0.3s",
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-foreground-tertiary">L{levelInfo.level}</span>
            <span className="text-[9px] text-foreground-tertiary">L{levelInfo.level + 1}</span>
          </div>
        </div>

        {/* New badges */}
        {breakdown.newBadges.length > 0 && (
          <div className="mx-4 mb-3">
            <p className="text-[10px] text-foreground-tertiary mb-2 uppercase tracking-widest">
              Badge{breakdown.newBadges.length > 1 ? "s" : ""} unlocked 🎉
            </p>
            <div className="flex flex-wrap gap-2">
              {breakdown.newBadges.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10 border border-primary/20"
                >
                  <span className="text-[16px]">{b.icon}</span>
                  <div>
                    <div className="text-[11px] font-display font-semibold text-foreground">{b.name}</div>
                    <div className="text-[9px] text-foreground-tertiary">{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streak */}
        {streak >= 2 && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-orange-400/10 border border-orange-400/20">
            <Flame size={14} className="text-orange-400" />
            <span className="text-[11px] font-semibold text-orange-300">
              {streak}-week scanning streak
            </span>
            {breakdown.streakMultiplier > 1 && (
              <span className="ml-auto text-[10px] text-orange-400/70">{breakdown.streakMultiplier}× XP</span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-[13px] flex items-center justify-center gap-2"
          >
            View results <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanCelebration;
