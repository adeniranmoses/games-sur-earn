"use client";

import React, { useState } from "react";
import { LuckySpinWheel } from "./LuckySpinWheel";
import { ScratchCardGame } from "./ScratchCardGame";
import { CoinFlipGame } from "./CoinFlipGame";
import { Gamepad2, Sparkles } from "lucide-react";

type ArcadeGameTab = "spin" | "scratch" | "coinflip";

export function ArcadeHub() {
  const [activeTab, setActiveTab] = useState<ArcadeGameTab>("spin");

  return (
    <div className="flex flex-col gap-3">
      {/* Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#102A43]">
              Arcade &amp; Mini-Games
            </h2>
            <p className="text-xs text-[#64748B]">
              Play instant games to earn Coins and Raffle Tickets
            </p>
          </div>
        </div>

        {/* Game Tabs */}
        <div className="flex items-center bg-white border border-[#E2E8F0] p-1 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("spin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "spin"
                ? "bg-[#1769D2] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            <span>🎡</span>
            <span>Lucky Wheel</span>
          </button>

          <button
            onClick={() => setActiveTab("scratch")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "scratch"
                ? "bg-[#1769D2] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            <span>🎟️</span>
            <span>Scratch &amp; Win</span>
          </button>

          <button
            onClick={() => setActiveTab("coinflip")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "coinflip"
                ? "bg-[#1769D2] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            <span>🪙</span>
            <span>Coin Flip</span>
          </button>
        </div>
      </div>

      {/* Render Active Game */}
      {activeTab === "spin" && <LuckySpinWheel />}
      {activeTab === "scratch" && <ScratchCardGame />}
      {activeTab === "coinflip" && <CoinFlipGame />}
    </div>
  );
}
