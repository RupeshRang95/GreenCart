import React, { useState, useRef, useMemo } from "react";
import {
  BellDot, Bell, TreePine, HeartHandshake, MessageSquareText, Forward,
  Target, X, Send, Image, Tag, ChevronRight, Flame, Zap, TrendingUp,
  Clock, Plus, Camera, Check, MapPinned,
} from "lucide-react";
import { userData, weeklyChallenge } from "@/data/mockData";
import { loadTripHistory } from "@/lib/tripHistory";
import { loadGamificationState } from "@/lib/gamification";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  user: string;
  handle: string;
  avatar: string;
  avatarColor: string;
  level: number;
  levelName: string;
  levelIcon: string;
  content: string;
  likes: number;
  comments: Comment[];
  shares: number;
  time: string;
  timeMs: number;
  tags: string[];
  tripScore?: { score: number; grade: string; items: number; local: number; co2: string };
  photo?: { emoji: string; bg: string; caption: string };
  isUser?: boolean;
}

interface Comment {
  id: number;
  user: string;
  avatar: string;
  avatarColor: string;
  time: string;
  text: string;
}

interface Notification {
  id: number;
  icon: string;
  text: string;
  time: string;
  read: boolean;
  type: "badge" | "like" | "comment" | "streak" | "challenge" | "nearby" | "tip";
}

// ── Static mock data ──────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  PS: "bg-violet-400/20 text-violet-300",
  MR: "bg-blue-400/20 text-blue-300",
  AK: "bg-amber-400/20 text-amber-300",
  DP: "bg-rose-400/20 text-rose-300",
  LW: "bg-teal-400/20 text-teal-300",
  KL: "bg-primary/20 text-primary",
};

const MOCK_COMMENTS: Record<number, Comment[]> = {
  1: [
    { id: 1, user: "Marcus Rivera", avatar: "MR", avatarColor: AVATAR_COLORS.MR, time: "45m ago", text: "Which farm stand? I'm in Waterloo Region too!" },
    { id: 2, user: "Dev Patel", avatar: "DP", avatarColor: AVATAR_COLORS.DP, time: "1h ago", text: "Local lettuce is such an easy win, especially this time of year 🥬" },
    { id: 3, user: "Luna Weber", avatar: "LW", avatarColor: AVATAR_COLORS.LW, time: "1h ago", text: "Herrle's in St. Agatha is incredible! Only 15km and they have everything" },
  ],
  2: [
    { id: 1, user: "Priya Sharma", avatar: "PS", avatarColor: AVATAR_COLORS.PS, time: "2h ago", text: "This is brilliant! Did you find it at your usual store?" },
    { id: 2, user: "Aisha Khan", avatar: "AK", avatarColor: AVATAR_COLORS.AK, time: "3h ago", text: "4.2kg → 0.8kg is massive. Which brand did you switch to?" },
  ],
  3: [
    { id: 1, user: "Marcus Rivera", avatar: "MR", avatarColor: AVATAR_COLORS.MR, time: "4h ago", text: "That scanner is addictive haha, scanned everything in my fridge already" },
    { id: 2, user: "Luna Weber", avatar: "LW", avatarColor: AVATAR_COLORS.LW, time: "5h ago", text: "Costco actually has decent local options if you know where to look!" },
    { id: 3, user: "Priya Sharma", avatar: "PS", avatarColor: AVATAR_COLORS.PS, time: "6h ago", text: "78% is amazing for Costco honestly 💪" },
  ],
  4: [
    { id: 1, user: "Aisha Khan", avatar: "AK", avatarColor: AVATAR_COLORS.AK, time: "7h ago", text: "Congrats on Level 15!! 🎉 340 swaps is incredible" },
  ],
  5: [
    { id: 1, user: "Dev Patel", avatar: "DP", avatarColor: AVATAR_COLORS.DP, time: "10h ago", text: "2.4 tonnes — that's like taking 5 cars off the road for a month! 🌍" },
    { id: 2, user: "Priya Sharma", avatar: "PS", avatarColor: AVATAR_COLORS.PS, time: "11h ago", text: "So proud of this community ❤️" },
  ],
};

const SEED_POSTS: Post[] = [
  {
    id: 1, user: "Priya Sharma", handle: "@priya_eco", avatar: "PS",
    avatarColor: AVATAR_COLORS.PS, level: 18, levelName: "Sapling", levelIcon: "🪴",
    content: "Just discovered an amazing local farm stand only 3km away! Their organic lettuce scored 96. No more imported greens for me! 🥬",
    likes: 87, shares: 23, time: "2h ago", timeMs: Date.now() - 7_200_000,
    comments: MOCK_COMMENTS[1],
    tags: ["#LocalFirst", "#FarmFresh"],
    tripScore: { score: 724, grade: "B+", items: 8, local: 75, co2: "3.2" },
    photo: { emoji: "🥬🍅🥕", bg: "from-green-900/60 to-emerald-800/40", caption: "Local haul from St. Agatha 🌿" },
  },
  {
    id: 2, user: "Marcus Rivera", handle: "@marcus_green", avatar: "MR",
    avatarColor: AVATAR_COLORS.MR, level: 22, levelName: "Tree", levelIcon: "🌳",
    content: "Swapped imported avocados for local greenhouse ones — carbon dropped from 4.2kg to 0.8kg per item! 🥑 Small changes, massive impact.",
    likes: 120, shares: 31, time: "4h ago", timeMs: Date.now() - 14_400_000,
    comments: MOCK_COMMENTS[2],
    tags: ["#ItemSwap", "#CO2Reduction"],
    photo: { emoji: "🥑", bg: "from-lime-900/60 to-green-800/40", caption: "Before vs after the swap ♻️" },
  },
  {
    id: 3, user: "Aisha Khan", handle: "@aisha_sustain", avatar: "AK",
    avatarColor: AVATAR_COLORS.AK, level: 8, levelName: "Sprout", levelIcon: "🌿",
    content: "Scanned my entire Costco receipt — 78% of items were within 200km! The scanner is honestly addictive 📱",
    likes: 65, shares: 15, time: "6h ago", timeMs: Date.now() - 21_600_000,
    comments: MOCK_COMMENTS[3],
    tags: ["#ReceiptScan", "#LocalFirst"],
    tripScore: { score: 681, grade: "B", items: 11, local: 78, co2: "8.1" },
  },
  {
    id: 4, user: "Dev Patel", handle: "@dev_planet", avatar: "DP",
    avatarColor: AVATAR_COLORS.DP, level: 15, levelName: "Sapling", levelIcon: "🪴",
    content: "🎉 Just hit Level 15! This journey to sustainable shopping has been incredible. 340 items swapped so far!",
    likes: 103, shares: 28, time: "8h ago", timeMs: Date.now() - 28_800_000,
    comments: MOCK_COMMENTS[4],
    tags: ["#EcoWarrior", "#LevelUp"],
    photo: { emoji: "🏆🌿✨", bg: "from-yellow-900/60 to-amber-800/40", caption: "Level 15 Sapling unlocked!" },
  },
  {
    id: 5, user: "Luna Weber", handle: "@luna_earth", avatar: "LW",
    avatarColor: AVATAR_COLORS.LW, level: 31, levelName: "Forest", levelIcon: "🌲",
    content: "Our community has collectively saved 2.4 tonnes of CO₂ this month! 🌍 Every scan counts. So proud of everyone here.",
    likes: 98, shares: 19, time: "12h ago", timeMs: Date.now() - 43_200_000,
    comments: MOCK_COMMENTS[5],
    tags: ["#CO2Reduction", "#Community"],
  },
  {
    id: 6, user: "Priya Sharma", handle: "@priya_eco", avatar: "PS",
    avatarColor: AVATAR_COLORS.PS, level: 18, levelName: "Sapling", levelIcon: "🪴",
    content: "PSA: Ontario strawberries are coming in season next month! Time to drop those 3,500km Mexican imports 🍓 Who's in?",
    likes: 74, shares: 12, time: "1d ago", timeMs: Date.now() - 86_400_000,
    comments: [],
    tags: ["#InSeason", "#LocalFirst"],
    photo: { emoji: "🍓🍓🍓", bg: "from-red-900/50 to-rose-800/30", caption: "Ontario berries > everything" },
  },
  {
    id: 7, user: "Marcus Rivera", handle: "@marcus_green", avatar: "MR",
    avatarColor: AVATAR_COLORS.MR, level: 22, levelName: "Tree", levelIcon: "🌳",
    content: "Quick tip: check the 'origin' flag on packaged goods, not just fresh produce. My 'Canadian' granola was made with oats from Ukraine 🤔",
    likes: 156, shares: 44, time: "1d ago", timeMs: Date.now() - 100_000_000,
    comments: [],
    tags: ["#ProTip", "#KnowYourFood"],
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "badge",     icon: "🏆", text: "Badge unlocked: Zero Air Freight Trip!",         time: "Just now",   read: false },
  { id: 2, type: "like",      icon: "❤️",  text: "Luna Weber liked your post",                    time: "1h ago",     read: false },
  { id: 3, type: "comment",   icon: "💬", text: "Marcus Rivera: \"That local swap is genius!\"",  time: "3h ago",     read: false },
  { id: 4, type: "streak",    icon: "🔥", text: "2-week streak! Scan this week to keep it alive", time: "Yesterday",  read: true  },
  { id: 5, type: "challenge", icon: "🎯", text: "Weekly challenge: 4/7 items local. 3 to go!",   time: "Yesterday",  read: true  },
  { id: 6, type: "nearby",    icon: "📍", text: "St. Jacobs Farmers' Market is 12km away",        time: "2d ago",     read: true  },
  { id: 7, type: "tip",       icon: "💡", text: "Ontario asparagus is in season — great swap!",   time: "3d ago",     read: true  },
];

const AVAILABLE_TAGS = ["#LocalFirst", "#CO2Reduction", "#ItemSwap", "#ReceiptScan", "#InSeason", "#FarmFresh", "#EcoWarrior", "#ProTip"];

// ── Score grade colour ────────────────────────────────────────────────────────
function gradeCol(grade: string) {
  if (grade.startsWith("A")) return "text-primary";
  if (grade.startsWith("B")) return "text-[hsl(142_69%_58%)]";
  if (grade.startsWith("C")) return "text-warning";
  return "text-destructive";
}

// ── Main component ────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const [feedTab, setFeedTab] = useState<"trending" | "latest">("trending");
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  // Panels
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // Compose state
  const [composeText, setComposeText] = useState("");
  const [composeTags, setComposeTags] = useState<string[]>([]);
  const [composePhoto, setComposePhoto] = useState<string | null>(null);
  const [composeTripAttach, setComposeTripAttach] = useState(false);
  const [composePosting, setComposePosting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const tripHistory = useMemo(() => loadTripHistory(), []);
  const gsState = useMemo(() => loadGamificationState(), []);
  const lastTrip = tripHistory[0];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Feed sorting ────────────────────────────────────────────────────────────
  const displayPosts = useMemo(() => {
    const scored = posts.map((p) => ({
      ...p,
      engagementScore: p.likes + p.comments.length * 2 + p.shares * 1.5,
    }));
    if (feedTab === "trending") {
      return [...scored].sort((a, b) => b.engagementScore - a.engagementScore);
    }
    return [...scored].sort((a, b) => b.timeMs - a.timeMs);
  }, [posts, feedTab]);

  // ── Interactions ─────────────────────────────────────────────────────────────
  const toggleLike = (id: number) => {
    setLiked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    if (!liked.has(id)) {
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    } else {
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likes: p.likes - 1 } : p));
    }
  };

  const submitComment = () => {
    if (!commentText.trim() || !commentsPost) return;
    const newComment: Comment = {
      id: Date.now(), user: userData.name, avatar: userData.avatar,
      avatarColor: AVATAR_COLORS.KL, time: "Just now", text: commentText.trim(),
    };
    setPosts((prev) => prev.map((p) =>
      p.id === commentsPost.id
        ? { ...p, comments: [...p.comments, newComment] }
        : p
    ));
    setCommentsPost((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
    setCommentText("");
  };

  const handleShare = async (post: Post) => {
    const text = `"${post.content}" — ${post.user} on GreenCart`;
    if (navigator.share) {
      try { await navigator.share({ title: "GreenCart Post", text }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {});
    setSharePost(post);
    setShareCopied(false);
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(`greencart.app/post/${sharePost?.id}`).catch(() => {});
    setShareCopied(true);
    setTimeout(() => { setSharePost(null); setShareCopied(false); }, 1500);
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setComposePhoto(url);
    e.target.value = "";
  };

  const submitPost = async () => {
    if (!composeText.trim()) return;
    setComposePosting(true);
    await new Promise((r) => setTimeout(r, 600)); // brief loading feel

    const newPost: Post = {
      id: Date.now(),
      user: userData.name,
      handle: userData.handle,
      avatar: userData.avatar,
      avatarColor: AVATAR_COLORS.KL,
      level: gsState.xp > 0 ? 1 : userData.level,
      levelName: userData.levelName,
      levelIcon: userData.levelIcon,
      content: composeText.trim(),
      likes: 0, shares: 0,
      time: "Just now",
      timeMs: Date.now(),
      comments: [],
      tags: composeTags,
      isUser: true,
      ...(composeTripAttach && lastTrip ? {
        tripScore: {
          score: lastTrip.esgScore,
          grade: lastTrip.grade,
          items: lastTrip.itemCount,
          local: lastTrip.pctLocal,
          co2: (lastTrip.co2TotalG / 1000).toFixed(2),
        },
      } : {}),
    };

    setPosts((prev) => [newPost, ...prev]);
    setFeedTab("latest");
    setComposeText("");
    setComposeTags([]);
    setComposePhoto(null);
    setComposeTripAttach(false);
    setComposePosting(false);
    setComposeOpen(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background relative">
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <TreePine size={16} className="text-primary" />
          </div>
          <span className="font-display font-bold text-base text-foreground">GreenCart</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setNotifOpen(true); }}
            className="relative w-9 h-9 rounded-xl bg-card flex items-center justify-center glow-border"
          >
            {unreadCount > 0
              ? <BellDot size={16} className="text-primary" />
              : <Bell size={16} className="text-foreground-secondary" />}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
            {userData.avatar}
          </div>
        </div>
      </div>

      {/* Weekly Challenge Banner */}
      <div className="px-5 pb-3">
        <div className="card-surface p-3.5" style={{ border: "0.5px solid hsl(142 69% 58% / 0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={13} className="text-primary" />
              <span className="font-display font-semibold text-[12px] text-foreground">{weeklyChallenge.name}</span>
            </div>
            <span className="pill text-[10px]">+{weeklyChallenge.xpReward} XP</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-background-tertiary overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(weeklyChallenge.progress / weeklyChallenge.total) * 100}%`, boxShadow: "0 0 8px hsl(142 69% 58% / 0.4)" }}
            />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-foreground-secondary">{weeklyChallenge.progress}/{weeklyChallenge.total} items local</span>
            <span className="text-foreground-tertiary">{weeklyChallenge.daysLeft} days left</span>
          </div>
        </div>
      </div>

      {/* Feed Tabs */}
      <div className="flex items-center gap-1.5 px-5 pb-3">
        <button
          onClick={() => setFeedTab("trending")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
            feedTab === "trending" ? "bg-primary/15 text-primary" : "text-foreground-tertiary"
          }`}
        >
          <TrendingUp size={11} /> Trending
        </button>
        <button
          onClick={() => setFeedTab("latest")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
            feedTab === "latest" ? "bg-primary/15 text-primary" : "text-foreground-tertiary"
          }`}
        >
          <Clock size={11} /> Latest
        </button>
        <span className="ml-auto text-[10px] text-foreground-tertiary">
          {displayPosts.length} posts
        </span>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-24 space-y-3">
        {displayPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            liked={liked.has(post.id)}
            onLike={() => toggleLike(post.id)}
            onComment={() => setCommentsPost(post)}
            onShare={() => handleShare(post)}
          />
        ))}
      </div>

      {/* FAB — compose post */}
      <button
        onClick={() => setComposeOpen(true)}
        className="absolute bottom-[84px] right-5 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
        style={{ boxShadow: "0 4px 20px hsl(142 69% 58% / 0.35)" }}
      >
        <Plus size={22} className="text-primary-foreground" />
      </button>

      {/* ── Notifications panel ─────────────────────────────────────────────── */}
      {notifOpen && (
        <div className="absolute inset-0 z-40 flex flex-col bg-background animate-fade-up">
          <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-border">
            <h2 className="font-display font-bold text-[16px] text-foreground">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary font-medium">
                  Mark all read
                </button>
              )}
              <button onClick={() => setNotifOpen(false)} className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center">
                <X size={14} className="text-foreground-tertiary" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-1">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n))}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl transition-all ${
                  !notif.read ? "bg-primary/6 border border-primary/15" : "hover:bg-background-tertiary"
                }`}
              >
                <span className="text-[18px] shrink-0 mt-0.5">{notif.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] leading-snug ${!notif.read ? "text-foreground font-medium" : "text-foreground-secondary"}`}>
                    {notif.text}
                  </p>
                  <p className="text-[10px] text-foreground-tertiary mt-0.5">{notif.time}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Comments sheet ──────────────────────────────────────────────────── */}
      {commentsPost && (
        <div
          className="absolute inset-0 z-40 flex flex-col"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setCommentsPost(null)}
        >
          <div
            className="mt-auto rounded-t-3xl bg-card border-t border-border flex flex-col"
            style={{ maxHeight: "80vh", paddingBottom: "env(safe-area-inset-bottom,20px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/40">
              <h3 className="font-display font-bold text-[15px] text-foreground">
                Comments ({commentsPost.comments.length})
              </h3>
              <button onClick={() => setCommentsPost(null)} className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center">
                <X size={13} className="text-foreground-tertiary" />
              </button>
            </div>

            {/* Original post snippet */}
            <div className="px-5 py-3 border-b border-border/40 bg-background-tertiary/40">
              <p className="text-[11px] text-foreground-secondary line-clamp-2">{commentsPost.content}</p>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-3">
              {commentsPost.comments.length === 0 ? (
                <p className="text-[12px] text-foreground-tertiary text-center py-8">No comments yet — be the first!</p>
              ) : (
                commentsPost.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${c.avatarColor}`}>
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-foreground">{c.user}</span>
                        <span className="text-[10px] text-foreground-tertiary">{c.time}</span>
                      </div>
                      <p className="text-[12px] text-foreground-secondary leading-snug">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply input */}
            <div className="px-4 py-3 border-t border-border/40 flex gap-2 items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${AVATAR_COLORS.KL}`}>
                {userData.avatar}
              </div>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitComment(); } }}
                placeholder="Add a comment…"
                className="flex-1 bg-background-tertiary rounded-xl px-3 py-2 text-[12px] text-foreground placeholder:text-foreground-tertiary border border-border focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40"
              >
                <Send size={13} className="text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share sheet ─────────────────────────────────────────────────────── */}
      {sharePost && (
        <div
          className="absolute inset-0 z-40 flex flex-col"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSharePost(null)}
        >
          <div
            className="mt-auto rounded-t-3xl bg-card border-t border-border overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom,24px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-4 border-b border-border/40">
              <p className="font-display font-bold text-[14px] text-foreground">Share post</p>
              <p className="text-[11px] text-foreground-tertiary mt-0.5 line-clamp-1">{sharePost.content}</p>
            </div>
            <div className="px-5 py-3 space-y-2">
              {[
                { icon: "🔗", label: "Copy link", action: copyShareLink },
                { icon: "💬", label: "Share via messages", action: () => { handleShare(sharePost); } },
                { icon: "🌍", label: "Share to community feed", action: () => setSharePost(null) },
              ].map((opt) => (
                <button key={opt.label} onClick={opt.action} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-background-tertiary text-left">
                  <span className="text-[18px]">{opt.icon}</span>
                  <span className="text-[13px] font-medium text-foreground">{opt.label}</span>
                  {shareCopied && opt.label === "Copy link" && (
                    <span className="ml-auto text-[11px] text-primary flex items-center gap-1"><Check size={11} /> Copied!</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Compose post modal ──────────────────────────────────────────────── */}
      {composeOpen && (
        <div className="absolute inset-0 z-40 bg-background flex flex-col animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-border">
            <button onClick={() => setComposeOpen(false)} className="text-[13px] text-foreground-tertiary">Cancel</button>
            <h3 className="font-display font-bold text-[15px] text-foreground">New Post</h3>
            <button
              onClick={() => void submitPost()}
              disabled={!composeText.trim() || composePosting}
              className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[12px] font-display font-bold disabled:opacity-40 flex items-center gap-1.5"
            >
              {composePosting ? <div className="w-3 h-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> : null}
              Post 🌱
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pt-4 pb-6 space-y-4">
            {/* Avatar + text area */}
            <div className="flex gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${AVATAR_COLORS.KL}`}>
                {userData.avatar}
              </div>
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="Share a tip, swap, or insight with the community…"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground-tertiary resize-none min-h-[120px] focus:outline-none leading-relaxed"
                autoFocus
              />
            </div>

            {/* Photo preview */}
            {composePhoto && (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={composePhoto} alt="Attached" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => setComposePhoto(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            )}

            {/* Trip score attachment */}
            {composeTripAttach && lastTrip && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/8 border border-primary/20">
                <div>
                  <div className="text-[10px] text-foreground-tertiary mb-0.5">Trip attached</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[20px] font-display font-black ${gradeCol(lastTrip.grade)}`}>{lastTrip.grade}</span>
                    <div>
                      <div className="text-[12px] font-bold text-foreground">{lastTrip.esgScore} pts</div>
                      <div className="text-[10px] text-foreground-tertiary">{lastTrip.itemCount} items · {lastTrip.pctLocal}% local</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setComposeTripAttach(false)} className="ml-auto">
                  <X size={13} className="text-foreground-tertiary" />
                </button>
              </div>
            )}

            {/* Attach buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background-tertiary text-[11px] text-foreground-secondary font-medium"
              >
                <Camera size={13} className="text-primary" /> Photo
              </button>
              {lastTrip && !composeTripAttach && (
                <button
                  onClick={() => setComposeTripAttach(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background-tertiary text-[11px] text-foreground-secondary font-medium"
                >
                  <Zap size={13} className="text-primary" /> Attach trip score
                </button>
              )}
            </div>

            {/* Tag selector */}
            <div>
              <p className="text-[10px] text-foreground-tertiary mb-2 uppercase tracking-widest">Tags</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setComposeTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                      composeTags.includes(tag)
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-background-tertiary text-foreground-tertiary"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Post card ─────────────────────────────────────────────────────────────────
const PostCard: React.FC<{
  post: Post;
  liked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}> = ({ post, liked, onLike, onComment, onShare }) => (
  <div className={`card-surface animate-fade-up ${post.isUser ? "border border-primary/20" : ""}`}>
    {/* Header */}
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${post.avatarColor}`}>
        {post.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-display font-semibold text-[13px] text-foreground">{post.user}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {post.levelIcon} Lv.{post.level}
          </span>
          {post.isUser && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">You</span>
          )}
        </div>
        <span className="text-[10px] text-foreground-tertiary">{post.handle} · {post.time}</span>
      </div>
    </div>

    {/* Text */}
    <p className="text-[13px] text-foreground-secondary leading-relaxed mb-3">{post.content}</p>

    {/* Photo card */}
    {post.photo && (
      <div className={`rounded-2xl bg-gradient-to-br ${post.photo.bg} border border-white/5 p-4 mb-3 flex flex-col items-center gap-2`}>
        <span className="text-[32px] tracking-widest">{post.photo.emoji}</span>
        <p className="text-[11px] text-white/70 font-medium">{post.photo.caption}</p>
      </div>
    )}

    {/* Trip score attachment */}
    {post.tripScore && (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-background-tertiary border border-border/40 mb-3">
        <span className={`text-[24px] font-display font-black leading-none ${gradeCol(post.tripScore.grade)}`}>
          {post.tripScore.grade}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-foreground">{post.tripScore.score} pts</span>
            <span className="text-[10px] text-foreground-tertiary">Trip Score</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-foreground-tertiary mt-0.5">
            <span>{post.tripScore.items} items</span>
            <span>·</span>
            <MapPinned size={9} className="text-primary" />
            <span className="text-primary">{post.tripScore.local}% local</span>
            <span>·</span>
            <span>{post.tripScore.co2} kg CO₂</span>
          </div>
        </div>
      </div>
    )}

    {/* Tags */}
    {post.tags.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {post.tags.map((tag) => (
          <span key={tag} className="text-[10px] text-primary/70 font-medium">{tag}</span>
        ))}
      </div>
    )}

    {/* Interaction row */}
    <div className="flex items-center gap-5 text-foreground-tertiary border-t border-border/30 pt-3">
      <button
        onClick={onLike}
        className={`flex items-center gap-1.5 text-[12px] transition-colors ${liked ? "text-red-400" : ""}`}
      >
        <HeartHandshake size={14} fill={liked ? "currentColor" : "none"} />
        <span>{post.likes}</span>
      </button>
      <button onClick={onComment} className="flex items-center gap-1.5 text-[12px] hover:text-foreground-secondary transition-colors">
        <MessageSquareText size={14} />
        <span>{post.comments.length}</span>
      </button>
      <button onClick={onShare} className="flex items-center gap-1.5 text-[12px] hover:text-foreground-secondary transition-colors">
        <Forward size={14} />
        <span>{post.shares}</span>
      </button>
    </div>
  </div>
);

export default HomeScreen;
