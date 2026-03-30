import React, { useState } from "react";
import { BellDot, TreePine, HeartHandshake, MessageSquareText, Forward, Sparkles, Target } from "lucide-react";
import { userData, communityPosts, weeklyChallenge } from "@/data/mockData";

const HomeScreen: React.FC = () => {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const toggleLike = (id: number) =>
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <TreePine size={16} className="text-primary" />
          </div>
          <span className="font-display font-bold text-base text-foreground">GreenCart</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-xl bg-card flex items-center justify-center glow-border">
            <BellDot size={16} className="text-foreground-secondary" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
            {userData.avatar}
          </div>
        </div>
      </div>

      {/* Weekly Challenge Banner */}
      <div className="px-5 pb-3">
        <div className="card-surface p-4" style={{ border: "0.5px solid hsl(142 69% 58% / 0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-primary" />
              <span className="font-display font-semibold text-[13px] text-foreground">{weeklyChallenge.name}</span>
            </div>
            <span className="pill text-[10px]">+{weeklyChallenge.xpReward} XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-background-tertiary overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(weeklyChallenge.progress / weeklyChallenge.total) * 100}%`, boxShadow: "0 0 8px hsl(142 69% 58% / 0.4)" }}
            />
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-foreground-secondary">{weeklyChallenge.progress}/{weeklyChallenge.total} items local</span>
            <span className="text-foreground-tertiary">{weeklyChallenge.daysLeft} days left</span>
          </div>
        </div>
      </div>

      {/* Feed Toggle */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <button className="pill text-[11px] flex items-center gap-1"><Sparkles size={10} /> Trending</button>
        <button className="px-3 py-1 rounded-full text-[11px] font-semibold text-foreground-tertiary">Latest</button>
      </div>

      {/* Community Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4 space-y-3 stagger-children">
        {communityPosts.map(post => (
          <div key={post.id} className="card-surface animate-fade-up">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                {post.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-[13px] text-foreground">{post.user}</span>
                  <span className="pill text-[9px] py-0.5 px-2">{post.levelName} Lv.{post.level}</span>
                </div>
                <span className="text-[11px] text-foreground-tertiary">{post.handle} · {post.time}</span>
              </div>
            </div>

            {/* Content */}
            <p className="text-[13px] text-foreground-secondary leading-relaxed mb-3">{post.content}</p>

            {/* Receipt Score Attachment */}
            {post.receiptScore && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-background-tertiary mb-3">
                <div className="font-mono font-bold text-xl text-primary">{post.receiptScore.score}</div>
                <div>
                  <div className="text-[11px] text-foreground-secondary">Trip Score</div>
                  <span className="pill text-[10px] py-0.5">{post.receiptScore.grade}</span>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map(tag => (
                <span key={tag} className="text-[11px] text-primary/70 font-medium">{tag}</span>
              ))}
            </div>

            {/* Interaction Row */}
            <div className="flex items-center gap-6 text-foreground-tertiary">
              <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-[12px] transition-colors">
                <HeartHandshake size={14} fill={liked.has(post.id) ? "hsl(0 72% 71%)" : "none"} className={liked.has(post.id) ? "text-destructive" : ""} />
                <span>{post.likes + (liked.has(post.id) ? 1 : 0)}</span>
              </button>
              <button className="flex items-center gap-1.5 text-[12px]">
                <MessageSquareText size={14} />
                <span>{post.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-[12px]">
                <Forward size={14} />
                <span>{post.shares}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        className="absolute bottom-[84px] right-6 w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-glow-pulse"
        style={{ boxShadow: "0 4px 20px hsl(142 69% 58% / 0.3)" }}
      >
        <Sparkles size={20} className="text-primary-foreground" />
      </button>
    </div>
  );
};

export default HomeScreen;
