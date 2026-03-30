import React, { useState } from "react";
import PhoneFrame from "@/components/PhoneFrame";
import TabBar, { TabId } from "@/components/TabBar";
import HomeScreen from "@/screens/HomeScreen";
import ScannerScreen from "@/screens/ScannerScreen";
import MarketScreen from "@/screens/MarketScreen";
import PortfolioScreen from "@/screens/PortfolioScreen";
import ProfileScreen from "@/screens/ProfileScreen";

const screens: Record<TabId, React.FC> = {
  home: HomeScreen,
  scan: ScannerScreen,
  market: MarketScreen,
  portfolio: PortfolioScreen,
  profile: ProfileScreen,
};

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const ActiveScreen = screens[activeTab];

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-hidden relative">
        <ActiveScreen />
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </PhoneFrame>
  );
};

export default Index;
