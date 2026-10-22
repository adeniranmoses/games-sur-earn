"use client";

import { useState } from "react";
import { Sparkles, Ticket, DollarSign, Bell, Share2, ArrowRight, CheckCircle2 } from "lucide-react";
import { QuestItemData } from "@/types/gpt";

interface QuestsBannerProps {
  referralCode: string;
}

const DEFAULT_QUESTS: QuestItemData[] = [
  {
    id: "quest-social-1",
    title: "Follow FreeRewards on Twitter / X",
    description: "Stay up to date with new 2x multiplier weekend events and free promo codes.",
    rewardType: "TICKETS",
    rewardValue: "40 Tickets",
    actionLabel: "Follow @FreeRewards",
    completed: false,
    iconName: "social",
  },
  {
    id: "quest-streak-1",
    title: "Add Homepage Shortcut & Maintain 3-Day Streak",
    description: "Visit daily to keep your multiplier active and unlock the lucky spinner.",
    rewardType: "CASH",
    rewardValue: "$0.10 Cash",
    actionLabel: "Start Daily Streak",
    completed: false,
    iconName: "streak",
  },
  {
    id: "quest-bell-1",
    title: "Enable Browser Push Notifications",
    description: "Get notified instantly when high-paying $20+ game testing offers drop.",
    rewardType: "TICKETS",
    rewardValue: "25 Tickets",
    actionLabel: "Enable Notifications",
    completed: false,
    iconName: "bell",
  },
];

export default function QuestsBanner({ referralCode }: QuestsBannerProps) {
  const [activeTab, setActiveTab] = useState<"QUESTS" | "BONUSES" | "INVITE">("QUESTS");
  const [quests, setQuests] = useState<QuestItemData[]>(DEFAULT_QUESTS);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCompleteQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: true } : q))
    );
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`https://freerewards.gg/r/${referralCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-[#131926] to-indigo-950/80 border border-emerald-500/30 p-6 md:p-8 shadow-xl">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Special Rewards
              </span>
              <span className="text-xs text-zinc-400">Ends in 2d 14h</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Level Up Your Profile & Earn Free Tickets
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              Complete simple 1-click system tasks to boost your account tier, unlock multiplier events, and enter weekly prize raffles.
            </p>
          </div>

          {/* Quick claim preview badge */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl shrink-0 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Ticket className="w-6 h-6 rotate-12" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 uppercase font-bold block">Available to Claim</span>
              <span className="text-lg font-black text-amber-300">65+ Tickets</span>
            </div>
          </div>
        </div>

        {/* Interactive Sub-Tabs */}
        <div className="mt-8 flex items-center gap-2 border-b border-white/10 pb-3">
          {(["QUESTS", "BONUSES", "INVITE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-zinc-950 shadow-md"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab === "QUESTS" && "Active Quests"}
              {tab === "BONUSES" && "Multiplier Bonuses"}
              {tab === "INVITE" && "Invite Friends"}
            </button>
          ))}
        </div>

        {/* Tab 1: Quest Line Items */}
        {activeTab === "QUESTS" && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {quests.map((q) => (
              <div
                key={q.id}
                className="group p-4 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        q.rewardType === "TICKETS"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      +{q.rewardValue}
                    </span>
                    {q.completed ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Claimed
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-medium">1-Click</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {q.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {q.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCompleteQuest(q.id)}
                  disabled={q.completed}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    q.completed
                      ? "bg-white/5 text-zinc-600 cursor-default"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 active:scale-95"
                  }`}
                >
                  <span>{q.completed ? "Completed" : q.actionLabel}</span>
                  {!q.completed && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Bonuses */}
        {activeTab === "BONUSES" && (
          <div className="mt-5 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-indigo-400 uppercase">Weekend Special</span>
              <h4 className="text-lg font-black text-white">+50% Bonus on BitLabs Surveys</h4>
              <p className="text-xs text-zinc-400">
                All qualified completions earn an automatic +50% extra coins automatically deposited.
              </p>
            </div>
            <span className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-extrabold text-xs shrink-0">
              Active Now
            </span>
          </div>
        )}

        {/* Tab 3: Invite Friends */}
        {activeTab === "INVITE" && (
          <div className="mt-5 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-emerald-400 uppercase">Lifetime Commissions</span>
              <h4 className="text-lg font-black text-white">Earn 10% from every friend&apos;s offer</h4>
              <p className="text-xs text-zinc-400">
                Share your referral link. Whenever friends cash out or complete tasks, you get a 10% commission forever.
              </p>
            </div>
            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? "Link Copied!" : "Copy Referral Link"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
