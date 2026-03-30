import React, { useMemo } from "react";
import {
  SlidersHorizontal, BellRing, ShieldCheck, LifeBuoy, ChevronRight,
  DoorOpen, Repeat2, Flame, Zap, Trophy, Star,
} from "lucide-react";
import { userData, swapHistory } from "@/data/mockData";
import { getProfileStats, ALL_BADGES } from "@/lib/gamification";

const ProfileScreen: React.FC = () => {
  const stats = useMemo(() => getProfileStats(), []);
  const { levelInfo, progress, streak, xp, totalScans, totalItems, co2SavedKg, allBadges } = stats;

  // Merge with mock static data for things we don't track yet (money saved, member since)
  const displayStats = [
    { label: "Scans",    value: totalScans > 0 ? totalScans       : userData.totalScans },
    { label: "Items",    value: totalItems > 0 ? totalItems       : userData.totalItems },
    { label: "CO₂ Saved",value: `${parseFloat(co2SavedKg) > 0 ? co2SavedKg : userData.savedCO2}kg` },
    { label: "Streak",   value: `${streak > 0 ? streak : userData.streak}w` },
  ];

  const displayXP = xp > 0 ? xp : userData.xp;
  const displayLevel = xp > 0 ? levelInfo.level : userData.level;
  const displayLevelName = xp > 0 ? `${levelInfo.icon} ${levelInfo.name}` : `${userData.levelIcon} ${userData.levelName}`;
  const displayProgress = xp > 0 ? progress : Math.round((userData.xp / userData.xpNext) * 100);
  const displayXPNext = xp > 0 ? levelInfo.xpNextLevel : userData.xpNext;

  // Badge display — use real gamification badges (ALL_BADGES) if we have data, else mockData fallback
  const badgesToShow = allBadges.length > 0 ? allBadges : ALL_BADGES.map((b) => ({ ...b, earned: false }));

  // Group badges by category
  const badgeGroups: { label: string; items: typeof badgesToShow }[] = [
    { label: "🏆 Milestones",   items: badgesToShow.filter((b) => b.category === "milestone") },
    { label: "🌿 Eco Actions",  items: badgesToShow.filter((b) => b.category === "behaviour") },
    { label: "🔥 Streaks",      items: badgesToShow.filter((b) => b.category === "streak")   },
    { label: "💬 Social",       items: badgesToShow.filter((b) => b.category === "social")   },
  ];

  const earnedCount = badgesToShow.filter((b) => b.earned).length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary glow-border">
            {userData.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-[17px] text-foreground truncate">{userData.name}</h1>
            <p className="text-[12px] text-foreground-tertiary">{userData.handle}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="pill text-[10px] py-0.5 flex items-center gap-1">
                Lv.{displayLevel} {displayLevelName}
              </span>
              {streak >= 2 && (
                <span className="flex items-center gap-1 text-[10px] text-orange-400 font-semibold">
                  <Flame size={10} /> {streak}w
                </span>
              )}
            </div>
          </div>
          <button className="w-9 h-9 rounded-xl bg-card flex items-center justify-center glow-border shrink-0">
            <SlidersHorizontal size={16} className="text-foreground-secondary" />
          </button>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-foreground-secondary font-semibold flex items-center gap-1">
              <Zap size={10} className="text-primary" /> Experience
            </span>
            <span className="text-foreground-tertiary font-mono">{displayXP.toLocaleString()} / {displayXPNext.toLocaleString()} XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-card overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${displayProgress}%`, boxShadow: "0 0 8px hsl(142 69% 58% / 0.4)" }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-foreground-tertiary">
            <span>L{displayLevel}</span>
            <span>L{displayLevel + 1}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6 space-y-3">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {displayStats.map((s) => (
            <div key={s.label} className="card-surface py-3 px-2 text-center">
              <div className="font-mono font-bold text-[15px] text-foreground">{s.value}</div>
              <div className="text-[9px] text-foreground-tertiary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Streak card */}
        {(streak > 0 || userData.streak > 0) && (
          <div className="card-surface p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center shrink-0">
              <Flame size={18} className="text-orange-400" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-display font-bold text-foreground">
                {streak > 0 ? streak : userData.streak}-Week Streak 🔥
              </div>
              <div className="text-[10px] text-foreground-tertiary">
                {streak >= 12 ? "2× XP multiplier active!" : streak >= 8 ? "1.5× XP multiplier active!" : streak >= 4 ? "1.2× XP multiplier active!" : "Keep scanning weekly to earn streak bonuses"}
              </div>
            </div>
          </div>
        )}

        {/* Badges / Achievements */}
        <div className="card-surface">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-[13px] text-foreground flex items-center gap-2">
              <Trophy size={13} className="text-primary" /> Achievements
            </h3>
            <span className="text-[10px] text-foreground-tertiary">{earnedCount} / {badgesToShow.length} unlocked</span>
          </div>

          {badgeGroups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="text-[10px] text-foreground-tertiary mb-2">{group.label}</p>
              <div className="grid grid-cols-4 gap-2">
                {group.items.map((b) => (
                  <div
                    key={b.id}
                    className={`flex flex-col items-center p-2 rounded-2xl text-center transition-all ${
                      b.earned ? "bg-primary/10 border border-primary/20" : "bg-background-tertiary opacity-40"
                    }`}
                  >
                    <span className="text-[18px] mb-1">{b.icon}</span>
                    <span className="text-[9px] text-foreground-secondary leading-tight line-clamp-2">{b.name}</span>
                    {b.earned && <span className="text-[8px] text-primary mt-0.5 font-bold">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Swap History */}
        <div className="card-surface">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display font-semibold text-[13px] text-foreground">Swap History</h3>
          </div>
          <div className="space-y-2">
            {swapHistory.map((swap, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-background-tertiary">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Repeat2 size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-foreground-tertiary truncate">{swap.from}</div>
                  <div className="text-[11px] font-semibold text-foreground truncate">→ {swap.to}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono font-bold text-primary">-{swap.co2Saved}kg</div>
                  <div className="text-[9px] text-foreground-tertiary">{swap.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="card-surface" style={{ padding: 0 }}>
          {[
            { icon: BellRing,   label: "Notifications" },
            { icon: ShieldCheck, label: "Privacy" },
            { icon: LifeBuoy,   label: "Help & Support" },
            { icon: DoorOpen,   label: "Sign Out", danger: true },
          ].map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <item.icon size={16} className={item.danger ? "text-destructive" : "text-foreground-secondary"} />
              <span className={`text-[13px] font-medium flex-1 text-left ${item.danger ? "text-destructive" : "text-foreground"}`}>
                {item.label}
              </span>
              {!item.danger && <ChevronRight size={14} className="text-foreground-tertiary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
