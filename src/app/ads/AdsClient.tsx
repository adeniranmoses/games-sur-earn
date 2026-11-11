"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  PlayCircle,
  Tv2,
  Loader2,
  Lock,
  Volume2,
  VolumeX,
  AlertTriangle,
  ExternalLink,
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
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "⚔️ Raid Legends: Battle for the Realm",
    sponsor: "Google Cloud CDN Verified Sponsor",
  },
  GOLD: {
    label: "Gold",
    color: "amber",
    duration: 20,
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: "⭐",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    title: "🚀 Galaxy Odyssey: Space Exploration MMO",
    sponsor: "Top Tier Ad Network Partner",
  },
  PREMIUM: {
    label: "Premium",
    color: "indigo",
    duration: 30,
    badge: "bg-[#EAF3FF] text-[#1769D2] border border-[#BFDBFE]",
    icon: "💎",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    title: "🏎️ Velocity Horizon: Hyper Real Racing",
    sponsor: "Premium Brand Direct Campaign",
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
  const [isPausedDueToBlur, setIsPausedDueToBlur] = useState(false);
  const [progress, setProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSessionToken = useRef<string | null>(null);
  const elapsedSecondsRef = useRef<number>(0);
  const requiredDurationRef = useRef<number>(15);

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

  // Anti-Tab-Switch (Visibility API) Guard:
  // Industry-standard anti-fraud: Pauses if user minimizes window or switches browser tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPlaying) {
          setIsPausedDueToBlur(true);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      } else {
        if (isPlaying) {
          setIsPausedDueToBlur(false);
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

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

      activeSessionToken.current = token;
      requiredDurationRef.current = duration;
      elapsedSecondsRef.current = 0;

      setIsPlaying(true);
      setIsPausedDueToBlur(false);
      setProgress(0);
      setSecondsLeft(duration);

      // Play video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((err) => {
          console.warn("Video auto-play prevented:", err);
        });
      }

      // Start elapsed timer (pauses if tab hidden)
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (document.hidden) return; // Freeze timer if user leaves tab

        elapsedSecondsRef.current += 1;
        const currentElapsed = elapsedSecondsRef.current;
        const dur = requiredDurationRef.current;
        const pct = Math.min((currentElapsed / dur) * 100, 100);

        setProgress(pct);
        setSecondsLeft(Math.max(0, dur - currentElapsed));

        if (currentElapsed >= dur) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          if (activeSessionToken.current) {
            handleClaimReward(activeSessionToken.current);
          }
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
          detail: { coinsDelta: data.coinsEarned || currentTierInfo.coinsPerAd },
        })
      );

      // Refresh tier counts locally
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
          <span>Real Rewarded Video Sponsor Network</span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-[#102A43] tracking-tight">
          Watch Short Video Ads &amp; Earn Verified Coins
        </h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Stream real sponsored videos to completion to earn instant coins. Complete the video without switching tabs to receive verified credit directly to your ledger.
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
                  <p className="text-[11px] text-[#64748B] mt-0.5">{tCfg.duration}s stream</p>
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

      {/* ── Interactive Real Video Player Card ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] flex items-center justify-center text-lg">
              {cfg.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102A43]">
                {cfg.label} Sponsor Video
              </h3>
              <p className="text-xs text-[#64748B]">
                +{currentTierInfo.coinsPerAd} Coins &bull; Value ${(currentTierInfo.coinsPerAd / 1000).toFixed(2)} USD
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

        {/* Video Player Canvas */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl bg-black flex flex-col items-center justify-center text-center text-white overflow-hidden shadow-inner border border-white/10 select-none">
          {/* Real HTML5 Video element */}
          <video
            ref={videoRef}
            src={cfg.videoSrc}
            muted={isMuted}
            playsInline
            preload="auto"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isPlaying ? "opacity-100" : "opacity-30"
            }`}
          />

          {/* Tab Blur Security Overlay */}
          {isPausedDueToBlur && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-30">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
              <h4 className="font-extrabold text-sm text-white">Stream Paused!</h4>
              <p className="text-xs text-amber-200 mt-1 max-w-xs text-center">
                To prevent fraud, video streaming pauses when you switch tabs. Please keep this tab active to finish earning your coins.
              </p>
            </div>
          )}

          {/* Playing HUD overlay */}
          {isPlaying && (
            <div className="absolute inset-0 flex flex-col justify-between p-3.5 z-20 pointer-events-none">
              {/* Top HUD */}
              <div className="w-full flex items-center justify-between text-xs pointer-events-auto">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-amber-300 font-bold border border-amber-500/30 text-[10px] uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live Sponsor Stream
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted((prev) => !prev)}
                    className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <span className="px-3 py-1 rounded-full bg-[#1769D2]/90 backdrop-blur-md text-white font-extrabold text-xs shadow-md border border-white/20">
                    Reward in {secondsLeft}s
                  </span>
                </div>
              </div>

              {/* Bottom Video Information */}
              <div className="w-full flex items-end justify-between text-left">
                <div>
                  <span className="text-xs font-bold text-white drop-shadow-md block">
                    {cfg.title}
                  </span>
                  <span className="text-[10px] text-zinc-300 drop-shadow-md">
                    {cfg.sponsor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Idle Start Overlay */}
          {!isPlaying && !isRecording && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/50 z-20">
              <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg mb-2 cursor-pointer transition active:scale-95">
                <Play className="w-6 h-6 text-white ml-1 fill-white" />
              </div>
              <p className="font-bold text-sm text-white drop-shadow-md">
                Ready to stream {cfg.label} ad ({cfg.duration}s)
              </p>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Earn +{currentTierInfo.coinsPerAd} Coins upon stream completion
              </p>
            </div>
          )}

          {/* Processing / Crediting Overlay */}
          {isRecording && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs z-30">
              <Loader2 className="w-9 h-9 text-[#60A5FA] animate-spin mb-2" />
              <p className="font-bold text-sm text-white">Validating Stream &amp; Crediting Wallet...</p>
              <p className="text-[11px] text-zinc-400 mt-1">Applying double-entry ledger entry</p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 overflow-hidden z-20">
            <div
              className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-xs text-[#64748B] flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Anti-tab tampering active &bull; Unskippable playback</span>
          </div>

          <button
            onClick={startAd}
            disabled={isPlaying || isStarting || isRecording || isCurrentLocked || currentTierInfo.remaining === 0}
            className={`w-full sm:w-auto px-6 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
              isCurrentLocked || currentTierInfo.remaining === 0
                ? "bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed"
                : "bg-[#1769D2] hover:bg-[#1557B0] text-white cursor-pointer"
            }`}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting Ad Server...</span>
              </>
            ) : isPlaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                <span>Playing ({secondsLeft}s)...</span>
              </>
            ) : isCurrentLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Tier Locked</span>
              </>
            ) : currentTierInfo.remaining === 0 ? (
              <span>Daily Limit Reached (10/10)</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Video &amp; Earn +{currentTierInfo.coinsPerAd} Coins</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
