import React from "react";
import { Sprout, ScanSearch, ShoppingBag, BarChart3, CircleUserRound } from "lucide-react";

export type TabId = "home" | "scan" | "market" | "portfolio" | "profile";

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: "home", icon: Sprout, label: "Home" },
  { id: "scan", icon: ScanSearch, label: "Scan" },
  { id: "market", icon: ShoppingBag, label: "Market" },
  { id: "portfolio", icon: BarChart3, label: "Portfolio" },
  { id: "profile", icon: CircleUserRound, label: "Profile" },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => (
  <div
    className="flex items-center justify-around h-[72px] shrink-0 px-2"
    style={{
      background: "hsl(138 30% 5%)",
      borderTop: "0.5px solid hsl(142 69% 58% / 0.1)",
    }}
  >
    {tabs.map(({ id, icon: Icon, label }) => {
      const active = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className="flex flex-col items-center gap-1 transition-all duration-200"
          style={{ minWidth: 56 }}
        >
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 ${
              active ? "bg-primary/15" : ""
            }`}
          >
            <Icon
              size={20}
              strokeWidth={active ? 2.2 : 1.5}
              className={`transition-colors duration-200 ${
                active ? "text-primary" : "text-foreground-tertiary"
              }`}
            />
          </div>
          <span
            className={`text-[10px] font-display transition-colors duration-200 ${
              active ? "text-primary font-semibold" : "text-foreground-tertiary font-medium"
            }`}
          >
            {label}
          </span>
        </button>
      );
    })}
  </div>
);

export default TabBar;
