"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  CheckCircle2,
  Ticket,
  Sparkles,
  ExternalLink,
  Loader2,
  Gift
} from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { CommunityRaffle } from "@/components/gpt/CommunityRaffle";

interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  rewardType: "TICKETS" | "COINS" | "CASH";
  rewardAmount: number;
  rewardDisplay: string;
  actionLabel: string;
  actionUrl: string | null;
  isRecurring: boolean;
  completed: boolean;
  canClaim: boolean;
}

export default function QuestsClient({
  referralCode,
  initialTickets,
  initialStreak,
}: {
  referralCode: string;
  initialTickets: number;
  initialStreak: number;
}) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [tickets, setTickets] = useState(initialTickets);
  const [streak, setStreak] = useState(initialStreak);
  const [streakCanClaim, setStreakCanClaim] = useState(true);
  const [hoursUntilNext, setHoursUntilNext] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [verifyingQuests, setVerifyingQuests] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active countdown timer for quests in 15-second verification cooldown
  useEffect(() => {
    const hasActive = Object.values(verifyingQuests).some((s) => s > 0);
    if (!hasActive) return;

    const interval = setInterval(() => {
      setVerifyingQuests((prev) => {
        const next: Record<string, number> = {};
        for (const [id, sec] of Object.entries(prev)) {
          if (sec > 1) {
            next[id] = sec - 1;
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [verifyingQuests]);

  const handleVisitTask = async (questId: string, url: string) => {
    try {
      fetch("/api/quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, action: "visit" }),
      }).catch(() => {});
    } catch {}

    window.open(url, "_blank", "noopener,noreferrer");
    setVerifyingQuests((prev) => ({ ...prev, [questId]: 15 }));
  };

  const streakDays = [
    { day: 1, reward: "10 Tix" },
    { day: 2, reward: "15 Tix" },
    { day: 3, reward: "20 Tix" },
    { day: 4, reward: "25 Tix" },
    { day: 5, reward: "30 Tix" },
    { day: 6, reward: "40 Tix" },
    { day: 7, reward: "100 Tix + $0.50", isGrand: true },
  ];

  useEffect(() => {
    let ignore = false;
    const loadQuests = async () => {
      try {
        const res = await fetch("/api/quests");
        const data = await res.json();
        if (ignore) return;
        if (data.quests) setQuests(data.quests);
        if (data.userTickets !== undefined) setTickets(data.userTickets);
        if (data.currentStreak !== undefined) setStreak(data.currentStreak);
        if (data.streakCanClaim !== undefined) setStreakCanClaim(data.streakCanClaim);
        if (data.hoursUntilNextStreak !== undefined) setHoursUntilNext(data.hoursUntilNextStreak);
      } catch (err) {
        console.error("Failed to load quests:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadQuests();
    return () => {
      ignore = true;
    };
  }, []);

  const handleClaim = async (questId: string) => {
    setClaimingId(questId);
    setMessage(null);

    try {
      const res = await fetch("/api/quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Failed to claim reward." });
        return;
      }

      setMessage({ type: "success", text: data.message || "Reward claimed successfully!" });
      if (data.newTickets !== undefined) setTickets(data.newTickets);
      if (data.currentStreak !== undefined) setStreak(data.currentStreak);

      // Dispatch balance update to global header
      window.dispatchEvent(
        new CustomEvent("balance-updated", {
          detail: {
            newTickets: data.newTickets,
            newCoins: data.newAvailableCoins,
            ticketsDelta: data.rewardType === "TICKETS" ? data.rewardGranted : undefined,
            coinsDelta: data.rewardType === "COINS" ? data.rewardGranted : undefined,
          },
        })
      );

      // Refresh quests status
      setQuests((prev) =>
        prev.map((q) =>
          q.id === questId ? { ...q, completed: true, canClaim: false } : q
        )
      );
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setClaimingId(null);
    }
  };

  // Find daily streak quest if present
  const streakQuest = quests.find((q) => q.isRecurring);

  const categories = ["ALL", "DAILY", "SOCIAL", "ENGAGEMENT"];
  const filteredQuests =
    activeFilter === "ALL"
      ? quests.filter((q) => !q.isRecurring)
      : quests.filter((q) => !q.isRecurring && q.category === activeFilter);

  return (
    <div className="flex flex-col gap-5">
      {/* Toast Alert Message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* ── 7-Day Streak Card ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
              <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#102A43]">
                  {streak}-Day Streak Active
                </h2>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Daily Check-in
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Check in every 24 hours to earn free raffle tickets and coin multipliers.
              </p>
            </div>
          </div>

          {/* Daily streak claim button */}
          {streakQuest && (
            <button
              onClick={() => handleClaim(streakQuest.id)}
              disabled={!streakCanClaim || claimingId === streakQuest.id}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                streakCanClaim
                  ? "bg-[#1769D2] hover:bg-[#1558b0] text-white active:scale-95"
                  : "bg-gray-100 text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
              }`}
            >
              {claimingId === streakQuest.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Claiming…</span>
                </>
              ) : streakCanClaim ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Check In Today</span>
                </>
              ) : (
                <span>Next check-in in {hoursUntilNext}h</span>
              )}
            </button>
          )}
        </div>

        {/* 7-Day Calendar Dots */}
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {streakDays.map((s) => {
            const isClaimed = s.day <= streak;
            const isToday = s.day === (streak % 7) + 1;

            return (
              <div
                key={s.day}
                className={`flex flex-col items-center justify-between p-2 rounded-xl text-center border transition-all ${
                  isClaimed
                    ? "bg-[#EAF3FF] border-[#BFDBFE] text-[#1769D2]"
                    : isToday
                    ? "bg-white border-[#1769D2] ring-2 ring-[#1769D2]/20 text-[#102A43]"
                    : "bg-[#F5F7FA] border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                <span className="text-[10px] font-bold">D{s.day}</span>
                <div className="my-1.5">
                  {isClaimed ? (
                    <div className="w-5 h-5 rounded-full bg-[#1769D2] text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center text-[10px] text-[#64748B]">
                      {s.day}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-semibold leading-tight line-clamp-1">{s.reward}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Community Prize Raffle Section ── */}
      <section>
        <CommunityRaffle currentTickets={tickets} />
      </section>

      {/* ── Quests Category Filter Pills ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeFilter === cat
                  ? "bg-[#1769D2] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#102A43] hover:bg-gray-50"
              }`}
            >
              {cat === "ALL" ? "All Quests" : cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#64748B] font-medium shrink-0">
          Tickets: <strong className="text-[#102A43] font-bold">{tickets.toLocaleString()}</strong>
        </div>
      </div>

      {/* ── Quests List Cards ── */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
            <span>Loading active quests…</span>
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center text-xs text-[#64748B]">
            No quests found in this category.
          </div>
        ) : (
          filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-[#BFDBFE]"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] flex items-center justify-center text-[#1769D2] shrink-0 mt-0.5">
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#102A43] truncate">{quest.title}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF3FF] text-[#1769D2] shrink-0">
                      +{quest.rewardAmount} {quest.rewardType === "TICKETS" ? "Tickets" : "Coins"}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    {quest.description}
                  </p>
                </div>
              </div>

              {/* Action and Claim Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {quest.actionUrl && !quest.completed && (
                  <button
                    onClick={() => handleVisitTask(quest.id, quest.actionUrl!)}
                    className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-gray-50 text-xs font-semibold text-[#102A43] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{quest.actionLabel}</span>
                    <ExternalLink className="w-3 h-3 text-[#64748B]" />
                  </button>
                )}

                <button
                  onClick={() => handleClaim(quest.id)}
                  disabled={
                    quest.completed ||
                    !quest.canClaim ||
                    claimingId === quest.id ||
                    (verifyingQuests[quest.id] !== undefined && verifyingQuests[quest.id] > 0)
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    quest.completed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                      : verifyingQuests[quest.id] > 0
                      ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-wait"
                      : quest.canClaim
                      ? "bg-[#1769D2] hover:bg-[#1558b0] text-white active:scale-95"
                      : "bg-gray-100 text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
                  }`}
                >
                  {quest.completed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Completed</span>
                    </>
                  ) : claimingId === quest.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Claiming…</span>
                    </>
                  ) : verifyingQuests[quest.id] > 0 ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span>Verifying ({verifyingQuests[quest.id]}s)</span>
                    </>
                  ) : quest.canClaim ? (
                    <span>Claim Reward</span>
                  ) : (
                    <span>In Progress</span>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Invite Friends Bonus Card ── */}
      <section className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] flex items-center justify-center font-bold text-[#1769D2]">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#102A43]">Invite Friends &amp; Earn Tickets</h3>
            <p className="text-xs text-[#64748B]">
              Share your link to earn bonus tickets and 10% lifetime coin commission.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] font-mono font-bold text-[#1769D2] tracking-wider text-sm text-center">
            {referralCode}
          </div>
          <CopyButton text={referralCode} />
        </div>
      </section>
    </div>
  );
}
