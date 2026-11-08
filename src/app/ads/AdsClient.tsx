"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  PlayCircle,
  CheckCircle2,
  Tv2,
  Loader2,
  Lock,
} from "lucide-react";

interface AdTierInfo {
  tier: "STANDARD" | "GOLD" | "PREMIUM";
  coinsPerAd: number;
  maxPerDay: number;
  watchedToday: number;
  remaining: number;
  maxDailyCoins: number;
}

const TIER_CONFIG = {
  STANDARD: {
    label: "Standard",
    color: "zinc",
    duration: 15,
    badge: "bg-gray-100 text-[#102A43]",
    icon: "📺",
  },
  GOLD: {
    label: "Gold",
    color: "amber",
    duration: 20,
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: "⭐",
  },
  PREMIUM: {
    label: "Premium",
    color: "indigo",
    duration: 30,
    badge: "bg-[#EAF3FF] text-[#1769D2] border border-[#BFDBFE]",
    icon: "💎",
  },
} as const;

export default function AdsClient({
  initialTiers,
}: {
  initialTiers: AdTierInfo[];
}) {
  const [tiers, setTiers] = useState<AdTierInfo[]>(initialTiers);
  const [activeTier, setActiveTier] = useState<AdTierInfo["tier"]>("STANDARD");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTierInfo = tiers.find((t) => t.tier === activeTier) || tiers[0];
  const cfg = TIER_CONFIG[activeTier];

  // ── Tier Progression: each tier requires at least 1 watch on the previous tier ──
  const standardWatched = tiers.find((t) => t.tier === "STANDARD")?.watchedToday ?? 0;
  const goldWatched     = tiers.find((t) => t.tier === "GOLD")?.watchedToday ?? 0;

  const tierLocked: Record<"STANDARD" | "GOLD" | "PREMIUM", boolean> = {
    STANDARD: false,
    GOLD:     standardWatched < 1,
    PREMIUM:  goldWatched < 1,
  };

  const tierLockReason: Record<"STANDARD" | "GOLD" | "PREMIUM", string> = {
    STANDARD: "",
    GOLD:     "Watch at least 1 Standard video first to unlock Gold.",
    PREMIUM:  "Watch at least 1 Gold video first to unlock Premium.",
  };

  const isCurrentLocked = tierLocked[activeTier];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startAd = async () => {
    if (isPlaying || isStarting || isRecording || isCurrentLocked || currentTierInfo.remaining === 0) return;
    setIsStarting(true);
    setMessage(null);

    try {
      // 1. Request signed watch session token from server
      const res = await fetch("/api/ads/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", tier: activeTier }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Failed to initiate ad watch." });
        return;
      }

      const token = data.sessionToken;
      const duration = data.duration || cfg.duration;

      setIsPlaying(true);
      setProgress(0);
      setSecondsLeft(duration);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed++;
        const pct = Math.min((elapsed / duration) * 100, 100);
        setProgress(pct);
        setSecondsLeft(Math.max(0, duration - elapsed));

        if (elapsed >= duration) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          handleClaimReward(token);
        }
      }, 1000);
    } catch {
      setMessage({ type: "error", text: "Network error connecting to ad server. Please try again." });
    } finally {
      setIsStarting(false);
    }
  };

  const handleClaimReward = async (token: string) => {
    setIsRecording(true);
    setMessage(null);

    try {
      const res = await fetch("/api/ads/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", sessionToken: token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Failed to record ad watch." });
        return;
      }

      setMessage({
        type: "success",
        text: `Success! +${data.coinsEarned || currentTierInfo.coinsPerAd} Coins added to your wallet!`,
      });

      // Real-time update global header coins
      window.dispatchEvent(
        new CustomEvent("balance-updated", {
          detail: {
            newCoins: data.newBalance,
            coinsDelta: data.coinsEarned || currentTierInfo.coinsPerAd,
          },
        })
      );

      setTiers((prev) =>
        prev.map((t) =>
          t.tier === activeTier
            ? { ...t, watchedToday: data.watchedToday, remaining: data.remaining }
            : t
        )
      );
    } catch {
      setMessage({ type: "error", text: "Network error recording ad. Please try again." });
    } finally {
      setIsRecording(false);
    }
  };

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

      {/* ── Header Explainer Card ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1769D2]">
          <PlayCircle className="w-4 h-4" />
          <span>Rewarded Sponsor Video Stream</span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-[#102A43] tracking-tight">
          Watch Short Video Clips &amp; Earn Verified Coins
        </h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Watch short video clips to completion to receive instant coin rewards. 
          Each tier allows up to 10 daily watches and resets at 00:00 UTC.
        </p>
      </section>

      {/* ── 3 Tier Selection Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["STANDARD", "GOLD", "PREMIUM"] as const).map((tierKey) => {
          const tInfo = tiers.find((t) => t.tier === tierKey);
          const tCfg = TIER_CONFIG[tierKey];
          const isSelected = activeTier === tierKey;
          const isMaxed = tInfo ? tInfo.remaining === 0 : false;
          const isLocked = tierLocked[tierKey];

          return (
            <button
              key={tierKey}
              onClick={() => {
                if (!isPlaying) {
                  setActiveTier(tierKey);
                  setMessage(null);
                }
              }}
              disabled={isPlaying}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all shadow-xs relative ${
                isLocked
                  ? "bg-[#F8FAFC] border-[#E2E8F0] opacity-70 cursor-not-allowed"
                  : isSelected
                  ? "bg-white border-[#1769D2] ring-2 ring-[#1769D2]/20 cursor-pointer"
                  : "bg-white border-[#E2E8F0] hover:border-[#BFDBFE] cursor-pointer"
              }`}
            >
              {/* Lock overlay badge */}
              {isLocked && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#1E293B]/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" />
                  LOCKED
                </div>
              )}

              <div className="flex items-center justify-between w-full">
                <span className={`text-xl ${isLocked ? "grayscale" : ""}`}>{tCfg.icon}</span>
                {!isLocked && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tCfg.badge}`}>
                    +{tInfo?.coinsPerAd} Coins
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-bold text-[#102A43]">{tCfg.label} Video</h3>
                {isLocked ? (
                  <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-snug">
                    {tierLockReason[tierKey]}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#64748B] mt-0.5">{tCfg.duration}s duration</p>
                )}
              </div>

              {!isLocked && (
                <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs w-full">
                  <span className="text-[#64748B] text-[11px]">
                    {tInfo ? `${tInfo.watchedToday}/10 watched` : "0/10"}
                  </span>
                  {isMaxed ? (
                    <span className="text-emerald-600 font-bold text-[10px]">Maxed</span>
                  ) : (
                    <span className="text-[#1769D2] font-semibold text-[10px]">{tInfo?.remaining} left</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Interactive Video Player Card ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] flex items-center justify-center text-lg">
              {cfg.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102A43]">
                {cfg.label} Ad Stream
              </h3>
              <p className="text-xs text-[#64748B]">
                +{currentTierInfo.coinsPerAd} Coins · Value ${(currentTierInfo.coinsPerAd / 1000).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[#102A43] block">
              {currentTierInfo.remaining} watches left today
            </span>
            <span className="text-[10px] text-[#64748B]">
              Max {currentTierInfo.maxDailyCoins} coins/day
            </span>
          </div>
        </div>

        {/* Video Simulation Canvas */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B1120] flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden shadow-inner border border-white/10">
          {isPlaying ? (
            <div className="w-full h-full flex flex-col items-center justify-between py-2 relative z-10">
              {/* Top video HUD */}
              <div className="w-full flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-amber-300 font-bold border border-amber-500/30 text-[10px] uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Sponsored Stream
                </span>
                <span className="px-3 py-1 rounded-full bg-[#1769D2]/90 backdrop-blur-md text-white font-extrabold text-xs shadow-md border border-white/20">
                  Reward in {secondsLeft}s
                </span>
              </div>

              {/* Center animated visual */}
              <div className="flex flex-col items-center gap-2 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl animate-pulse">
                  <Tv2 className="w-7 h-7 text-[#60A5FA]" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-white tracking-wide block">
                    {activeTier === "STANDARD"
                      ? "⚔️ Hero Quest: Mobile Legends"
                      : activeTier === "GOLD"
                      ? "📈 CryptoTrade Pro: Zero Fees"
                      : "💎 CyberWorld: Open World MMO"}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">
                    Verified Sponsor • Streaming High Definition Clip
                  </span>
                </div>
              </div>

              {/* Bottom notice */}
              <div className="text-[11px] text-gray-400 font-medium">
                Keep this window in focus to verify stream completion
              </div>
            </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <span className="text-xs font-bold text-amber-300">Crediting coins to ledger…</span>
            </div>
          ) : isCurrentLocked ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Lock className="w-8 h-8 text-amber-400" />
              <span className="text-sm font-bold text-white">Tier Locked</span>
              <p className="text-xs text-blue-200 max-w-xs">
                {tierLockReason[activeTier]}
              </p>
            </div>
          ) : currentTierInfo.remaining === 0 ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="text-sm font-bold text-white">Daily Limit Reached!</span>
              <p className="text-xs text-blue-200 max-w-xs">
                You have watched all 10 {cfg.label} ads today. Your limit resets at midnight UTC.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1769D2] flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Play className="w-6 h-6 text-white ml-0.5 fill-current" />
              </div>
              <div>
                <span className="text-sm font-bold block">Ready to Play</span>
                <span className="text-xs text-blue-200">
                  Tap Watch Video to begin the {cfg.duration}-second clip.
                </span>
              </div>
            </div>
          )}

          {/* Progress bar along bottom of player */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20">
              <div
                className="h-full bg-emerald-400 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={startAd}
          disabled={isPlaying || isStarting || isRecording || isCurrentLocked || currentTierInfo.remaining === 0}
          className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
            isPlaying || isStarting || isRecording
              ? "bg-gray-100 text-[#64748B] cursor-not-allowed border border-[#E2E8F0]"
              : isCurrentLocked
              ? "bg-gray-100 text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
              : currentTierInfo.remaining === 0
              ? "bg-gray-100 text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
              : "bg-[#1769D2] hover:bg-[#1558b0] text-white active:scale-95"
          }`}
        >
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#1769D2]" />
              <span>Connecting to Video Sponsor…</span>
            </>
          ) : isPlaying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Playing {cfg.label} Video ({secondsLeft}s)…</span>
            </>
          ) : isRecording ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Processing Reward…</span>
            </>
          ) : currentTierInfo.remaining === 0 ? (
            <span>All {cfg.label} Ads Completed</span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Video (+{currentTierInfo.coinsPerAd} Coins)</span>
            </>
          )}
        </button>
      </section>
    </div>
  );
}
