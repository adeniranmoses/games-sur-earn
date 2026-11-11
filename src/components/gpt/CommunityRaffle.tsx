"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Ticket,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Users,
} from "lucide-react";
import Link from "next/link";

interface RaffleData {
  roundName: string;
  totalPrizePoolCoins: number;
  totalPrizePoolUsd: number;
  nextDrawAt: string;
  userTickets: number;
  totalTicketsInPool: number;
  userWinChancePercent: number;
  prizeDistribution: Array<{
    place: string;
    coins: number;
    valueUsd: number;
    badge: string;
  }>;
  recentWinners: Array<{
    name: string;
    country: string;
    prize: string;
    ticketsHeld: number;
    drawDate: string;
  }>;
}

export function CommunityRaffle({ currentTickets }: { currentTickets: number }) {
  const [raffle, setRaffle] = useState<RaffleData | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeTab, setActiveTab] = useState<"prizes" | "winners">("prizes");

  useEffect(() => {
    fetch("/api/raffle")
      .then((res) => res.json())
      .then((data) => {
        if (data.roundName) {
          setRaffle(data);
        }
      })
      .catch(() => {});
  }, []);

  // Update countdown
  useEffect(() => {
    if (!raffle?.nextDrawAt) return;

    const target = new Date(raffle.nextDrawAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [raffle?.nextDrawAt]);

  const tickets = currentTickets ?? raffle?.userTickets ?? 0;
  const poolTickets = raffle?.totalTicketsInPool || 1000;
  const userPercent = poolTickets > 0 ? ((tickets / poolTickets) * 100).toFixed(2) : "0.00";

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-linear-to-r from-indigo-900 via-blue-900 to-[#102A43] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 text-2xl shadow-inner shrink-0">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {raffle?.roundName || "Weekly Jackpot"}
              </span>
              <span className="text-xs text-blue-200">Provably Fair Draw</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              ${raffle?.totalPrizePoolUsd || 500} Prize Pool{" "}
              <span className="text-xs font-semibold text-amber-300">
                ({((raffle?.totalPrizePoolCoins || 500000)).toLocaleString()} Coins)
              </span>
            </h2>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 sm:px-3 sm:py-2 border border-white/15 flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Clock className="w-4 h-4 text-amber-300 shrink-0" />
          <div className="flex items-center gap-1 font-mono text-xs font-bold text-white">
            <span className="bg-black/30 px-1.5 py-0.5 rounded">{timeLeft.days}d</span>:
            <span className="bg-black/30 px-1.5 py-0.5 rounded">
              {String(timeLeft.hours).padStart(2, "0")}h
            </span>:
            <span className="bg-black/30 px-1.5 py-0.5 rounded">
              {String(timeLeft.minutes).padStart(2, "0")}m
            </span>:
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-amber-300">
              {String(timeLeft.seconds).padStart(2, "0")}s
            </span>
          </div>
        </div>
      </div>

      {/* User Tickets & Probability Bar */}
      <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">Your Tickets Entered</span>
            <span className="text-lg font-bold text-[#102A43] block mt-0.5">
              {tickets.toLocaleString()} 🎟️
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#1769D2]">
            <Ticket className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">Current Win Chance</span>
            <span className="text-lg font-bold text-emerald-600 block mt-0.5">
              ~{userPercent}%
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">Total Pool Tickets</span>
            <span className="text-lg font-bold text-[#102A43] block mt-0.5">
              {poolTickets.toLocaleString()}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-4 pt-3 flex items-center justify-between border-b border-[#E2E8F0]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("prizes")}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "prizes"
                ? "border-[#1769D2] text-[#1769D2]"
                : "border-transparent text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            Prize Distribution
          </button>
          <button
            onClick={() => setActiveTab("winners")}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "winners"
                ? "border-[#1769D2] text-[#1769D2]"
                : "border-transparent text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            Recent Winners
          </button>
        </div>

        <Link
          href="/earn"
          className="text-[11px] font-semibold text-[#1769D2] hover:underline flex items-center gap-0.5 pb-2"
        >
          <span>Earn more tickets</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "prizes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {raffle?.prizeDistribution.map((prize, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between hover:border-blue-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold">{prize.badge.split(" ")[0]}</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#102A43]">{prize.place}</h4>
                    <p className="text-[10px] text-[#64748B]">${prize.valueUsd}.00 Cash Value</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  +{prize.coins.toLocaleString()} Coins
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "winners" && (
          <div className="flex flex-col divide-y divide-[#E2E8F0]">
            {raffle?.recentWinners.map((winner, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold text-[#102A43]">
                      {winner.name}{" "}
                      <span className="text-[10px] font-normal text-[#64748B]">
                        ({winner.country})
                      </span>
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      Held {winner.ticketsHeld} tickets &bull; {winner.drawDate}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-[#1769D2]">{winner.prize}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Earning Tips Banner */}
      <div className="p-3 bg-amber-50/70 border-t border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Pro Tip:</strong> Win raffle tickets daily by playing the <strong>Lucky Wheel</strong>, <strong>Scratch Cards</strong>, and keeping your <strong>7-Day Streak</strong> active!
          </span>
        </div>
        <Link
          href="/earn"
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 text-center transition"
        >
          Play Arcade
        </Link>
      </div>
    </div>
  );
}
