import React from "react";
import { SlidersHorizontal, BellRing, ShieldCheck, LifeBuoy, ChevronRight, DoorOpen, Repeat2, Sprout } from "lucide-react";
import { userData, badges, swapHistory } from "@/data/mockData";
import { badgeIcons } from "@/components/IconMap";

const ProfileScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary glow-border">
            {userData.avatar}
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-[17px] text-foreground">{userData.name}</h1>
            <p className="text-[12px] text-foreground-tertiary">{userData.handle}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="pill text-[10px] py-0.5 flex items-center gap-1">
                <Sprout size={10} /> {userData.levelName} Lv.{userData.level}
              </span>
              <span className="text-[10px] text-foreground-tertiary">Since {userData.memberSince}</span>
            </div>
          </div>
          <button className="w-9 h-9 rounded-xl bg-card flex items-center justify-center glow-border">
            <SlidersHorizontal size={16} className="text-foreground-secondary" />
          </button>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-foreground-secondary font-semibold">Experience</span>
            <span className="text-foreground-tertiary font-mono">{userData.xp} / {userData.xpNext} XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-card overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(userData.xp / userData.xpNext) * 100}%`, boxShadow: "0 0 8px hsl(142 69% 58% / 0.4)" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6 space-y-4">
        {/* Stats Row */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {[
            { label: "Scans", value: userData.totalScans },
            { label: "Items", value: userData.totalItems },
            { label: "CO₂ Saved", value: `${userData.savedCO2}kg` },
            { label: "Saved", value: `$${userData.savedMoney}` },
            { label: "Streak", value: `${userData.streak}w` },
          ].map(s => (
            <div key={s.label} className="card-surface shrink-0 py-3 px-4 text-center min-w-[72px]">
              <div className="font-mono font-bold text-[15px] text-foreground">{s.value}</div>
              <div className="text-[9px] text-foreground-tertiary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Swap History */}
        <div className="card-surface">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display font-semibold text-[13px] text-foreground">Swap History</h3>
            <span className="text-[11px] text-primary font-medium">See all</span>
          </div>
          <div className="space-y-2.5">
            {swapHistory.map((swap, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-background-tertiary">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Repeat2 size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-foreground-tertiary">{swap.from}</div>
                  <div className="text-[12px] font-semibold text-foreground">→ {swap.to}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-mono font-semibold text-primary">-{swap.co2Saved}kg</div>
                  <div className="text-[9px] text-foreground-tertiary">{swap.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="card-surface">
          <h3 className="font-display font-semibold text-[13px] text-foreground mb-3">Achievements</h3>
          <div className="grid grid-cols-4 gap-2">
            {badges.map(b => {
              const BadgeIcon = badgeIcons[b.icon];
              return (
                <div key={b.name} className={`flex flex-col items-center p-2.5 rounded-2xl text-center transition-all ${b.earned ? "bg-primary/8" : "bg-background-tertiary opacity-40"}`}>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                    {BadgeIcon ? <BadgeIcon size={18} className={b.earned ? "text-primary" : "text-foreground-tertiary"} /> : null}
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

        {/* Settings */}
        <div className="card-surface" style={{ padding: 0 }}>
          {[
            { icon: BellRing, label: "Notifications" },
            { icon: ShieldCheck, label: "Privacy" },
            { icon: LifeBuoy, label: "Help & Support" },
            { icon: DoorOpen, label: "Sign Out", danger: true },
          ].map((item, i) => (
            <button key={item.label} className={`w-full flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}>
              <item.icon size={16} className={item.danger ? "text-destructive" : "text-foreground-secondary"} />
              <span className={`text-[13px] font-medium flex-1 text-left ${item.danger ? "text-destructive" : "text-foreground"}`}>{item.label}</span>
              {!item.danger && <ChevronRight size={14} className="text-foreground-tertiary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
