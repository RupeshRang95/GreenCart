import React from "react";
import {
  Smartphone, ShoppingCart, MapPinCheck, PlaneTakeoff,
  Leaf, Flame, MessageSquare, Axe,
  Beef, Milk, Salad, Wheat, Package, Croissant,
  Warehouse, Store, Carrot, Recycle, Apple, CakeSlice,
  ScanSearch, ClipboardCheck, Globe2, BarChart4,
  ShoppingBag, Sprout, MapPinned, Banknote,
  type LucideIcon,
} from "lucide-react";

// Badge icons
export const badgeIcons: Record<string, LucideIcon> = {
  "📱": Smartphone,
  "🛒": ShoppingCart,
  "📍": MapPinCheck,
  "✈️": PlaneTakeoff,
  "🍂": Leaf,
  "🔥": Flame,
  "💬": MessageSquare,
  "🪓": Axe,
};

// Carbon breakdown category icons
export const categoryIcons: Record<string, LucideIcon> = {
  "🥩": Beef,
  "🥛": Milk,
  "🥬": Salad,
  "🌾": Wheat,
  "📦": Package,
  "🍞": Croissant,
};

// Marketplace business icons
export const businessIcons: Record<string, LucideIcon> = {
  "🌽": Warehouse,
  "🏪": Store,
  "🥕": Carrot,
  "♻️": Recycle,
  "🍎": Apple,
  "🧀": CakeSlice,
};

// Scanner category icons
export const scanCategoryIcons: Record<string, LucideIcon> = {
  fruit: Apple,
  vegetable: Salad,
  meat: Beef,
  dairy: Milk,
  grain: Wheat,
  packaged: Package,
  bakery: Croissant,
};

// Stats icons
export const statIcons: Record<string, LucideIcon> = {
  "🛒": ShoppingCart,
  "🌱": Sprout,
  "💰": Banknote,
  "📍": MapPinned,
};

// Processing step icons
export const processingIcons: Record<string, LucideIcon> = {
  "📷": ScanSearch,
  "🔍": ClipboardCheck,
  "🌍": Globe2,
  "📊": BarChart4,
};

// How it works icons
export const howItWorksIcons: Record<string, LucideIcon> = {
  "📷": ScanSearch,
  "🤖": ClipboardCheck,
  "🌍": Globe2,
  "📊": BarChart4,
};

// Trip summary icons
export const tripSummaryIcons: Record<string, LucideIcon> = {
  "📋": ShoppingCart,
  "📍": MapPinned,
  "💨": Sprout,
  "💰": Banknote,
};

// Level icons
export const levelIcons: Record<string, LucideIcon> = {
  "🌱": Sprout,
  "🌿": Leaf,
  "🪴": Sprout,
  "🌳": Leaf,
  "🌲": Leaf,
};

interface MappedIconProps {
  iconKey: string;
  map: Record<string, LucideIcon>;
  size?: number;
  className?: string;
}

export const MappedIcon: React.FC<MappedIconProps> = ({ iconKey, map, size = 16, className = "text-primary" }) => {
  const Icon = map[iconKey];
  if (!Icon) return <span className={className}>{iconKey}</span>;
  return <Icon size={size} className={className} />;
};
