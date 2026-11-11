"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Play, Volume2, VolumeX, ShieldCheck, Sparkles, X } from "lucide-react";
import { AD_CONFIG } from "@/lib/ads-config";

interface GameAdGateModalProps {
  isOpen: boolean;
  gameTitle: string;
  gameIcon?: string;
  onAdCompleted: () => void;
  onCancel: () => void;
}

const SAMPLE_ADS = [
  {
    title: "⚔️ Raid of Champions: Fantasy MMO",
    sponsor: "Epic Game Studios &bull; Verified Partner",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: 10,
  },
  {
    title: "🚀 Starfield Odyssey: Infinite Galaxy",
    sponsor: "Top Cloud Games &bull; Direct Sponsor",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: 10,
  },
  {
    title: "🏎️ Nitro Speed: Hyper Street Racer",
    sponsor: "Mobile Arcade Network &bull; Verified",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    duration: 10,
  },
];

export function GameAdGateModal({
  isOpen,
  gameTitle,
  gameIcon = "🎮",
  onAdCompleted,
  onCancel,
}: GameAdGateModalProps) {
  const [adIndex] = useState(() => Math.floor(Math.random() * SAMPLE_ADS.length));
  const activeAd = SAMPLE_ADS[adIndex];

  const [secondsLeft, setSecondsLeft] = useState<number>(activeAd.duration);
  const [progress, setProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPausedDueToBlur, setIsPausedDueToBlur] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<number>(0);

  // Anti-tamper: pause if user switches browser tabs
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPausedDueToBlur(true);
        if (videoRef.current) videoRef.current.pause();
      } else {
        setIsPausedDueToBlur(false);
        if (videoRef.current) videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Start watch session
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    elapsedRef.current = 0;
    setProgress(0);
    setSecondsLeft(activeAd.duration);
    setIsClaiming(false);

    // Call server to initiate ad watch session token
    fetch("/api/ads/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", tier: "STANDARD" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
        }
      })
      .catch(() => {});

    // Auto-play video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (document.hidden) return;

      elapsedRef.current += 1;
      const current = elapsedRef.current;
      const dur = activeAd.duration;
      const pct = Math.min((current / dur) * 100, 100);

      setProgress(pct);
      setSecondsLeft(Math.max(0, dur - current));

      if (current >= dur) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishAdAndUnlock();
      }
    }, 1000);

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const finishAdAndUnlock = async () => {
    setIsClaiming(true);

    try {
      if (sessionToken) {
        // Attempt to claim +50 coins ad reward
        const res = await fetch("/api/ads/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "claim", sessionToken }),
        });
        const data = await res.json();
        if (data.coinsEarned) {
          window.dispatchEvent(
            new CustomEvent("balance-updated", {
              detail: { coinsDelta: data.coinsEarned },
            })
          );
        }
      }
    } catch {
      // Continue even if network glitch occurs so user gets their game
    } finally {
      setIsClaiming(false);
      onAdCompleted();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-3xl overflow-hidden max-w-md w-full shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{gameIcon}</span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Unlocking {gameTitle}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +50 Coins Bonus
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Sponsor message &bull; Game starts when ad finishes
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-xs"
            title="Cancel"
          >
            ✕
          </button>
        </div>

        {/* Video Player Arena */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={activeAd.videoSrc}
            playsInline
            muted={isMuted}
            autoPlay
            onEnded={finishAdAndUnlock}
            className="w-full h-full object-cover"
          />

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white/90 border border-white/20 transition cursor-pointer z-10"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Tab Inactive Warning Overlay */}
          {isPausedDueToBlur && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
              <span className="text-2xl mb-1">⚠️</span>
              <p className="text-sm font-bold text-amber-400">Playback Paused</p>
              <p className="text-xs text-slate-300 mt-1">
                Please return to this tab to resume the sponsor ad and unlock your game.
              </p>
            </div>
          )}

          {/* Claiming Overlay */}
          {isClaiming && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
              <p className="text-sm font-bold text-white">Crediting Bonus &amp; Starting Game...</p>
            </div>
          )}

          {/* Live Timer Pill */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm text-xs font-mono font-bold text-white border border-white/20 flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ad ends in {secondsLeft}s</span>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 overflow-hidden z-10">
            <div
              className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Sponsor Footer info */}
        <div className="p-4 bg-slate-900 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-white text-xs">{activeAd.title}</p>
            <p
              className="text-[11px] text-slate-400 mt-0.5"
              dangerouslySetInnerHTML={{ __html: activeAd.sponsor }}
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+50 Coins reward</span>
          </div>
        </div>
      </div>
    </div>
  );
}
