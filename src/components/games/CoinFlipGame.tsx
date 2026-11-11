"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Coins, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";
import { GameAdGateModal } from "./GameAdGateModal";
import { AD_CONFIG } from "@/lib/ads-config";

export function CoinFlipGame() {
  const [choice, setChoice] = useState<"HEADS" | "TAILS">("HEADS");
  const [wager, setWager] = useState<number>(50);
  const [mode, setMode] = useState<"FREE" | "WAGER">("FREE");
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [resultOutcome, setResultOutcome] = useState<"HEADS" | "TAILS" | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [freeFlipsRemaining, setFreeFlipsRemaining] = useState<number>(5);
  const [availableCoins, setAvailableCoins] = useState<number>(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [provablyFair, setProvablyFair] = useState<{ serverHash: string; clientSeed: string } | null>(null);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/games/coinflip")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.freeFlipsRemaining === "number") {
          setFreeFlipsRemaining(data.freeFlipsRemaining);
          setAvailableCoins(data.availableCoins || 0);
          if (data.freeFlipsRemaining === 0) setMode("WAGER");
        }
      })
      .catch(() => {});
  }, []);

  const onFlipClick = () => {
    if (isFlipping) return;
    if (mode === "FREE" && AD_CONFIG.enabledForGames) {
      setShowAdModal(true);
    } else {
      handleFlip();
    }
  };

  const handleFlip = async () => {
    if (isFlipping) return;
    if (mode === "FREE" && freeFlipsRemaining <= 0) {
      setMessage({ type: "error", text: "No free flips left today. Switch to Coins wager mode!" });
      return;
    }
    if (mode === "WAGER" && availableCoins < wager) {
      setMessage({ type: "error", text: "Insufficient coin balance for this wager." });
      return;
    }

    setIsFlipping(true);
    setMessage(null);

    try {
      const res = await fetch("/api/games/coinflip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice,
          wager: mode === "WAGER" ? wager : 0,
          isFree: mode === "FREE",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.message || "Flip failed." });
        setIsFlipping(false);
        return;
      }

      // Calculate target rotation:
      // Even spins (e.g. 1800 deg) = Heads, Odd spins (e.g. 1980 deg) = Tails
      const extraRotations = 360 * 5; // 5 full rotations (1800 deg)
      const targetDeg = data.outcome === "HEADS" ? extraRotations : extraRotations + 180;
      setRotation((prev) => prev + targetDeg);

      setTimeout(() => {
        setIsFlipping(false);
        setResultOutcome(data.outcome);
        setAvailableCoins(data.newBalance);
        setFreeFlipsRemaining(data.freeFlipsRemaining);
        setProvablyFair(data.provablyFair);
        setMessage({
          type: data.won ? "success" : "error",
          text: data.message,
        });

        // Dispatch global balance update
        window.dispatchEvent(
          new CustomEvent("balance-updated", {
            detail: { coinsDelta: data.coinsDelta },
          })
        );
      }, 1500);
    } catch {
      setMessage({ type: "error", text: "Connection error during coin flip." });
      setIsFlipping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1769D2]">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#102A43] text-sm sm:text-base">
              Provably Fair Coin Flip
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Pick Heads or Tails &bull; 95% Payout Multiplier &bull; Instant Settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#F5F7FA] border border-[#E2E8F0] p-1 rounded-xl text-xs">
          <button
            onClick={() => setMode("FREE")}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              mode === "FREE"
                ? "bg-white text-[#1769D2] shadow-xs font-semibold"
                : "text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            Free Daily ({freeFlipsRemaining})
          </button>
          <button
            onClick={() => setMode("WAGER")}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              mode === "WAGER"
                ? "bg-white text-[#1769D2] shadow-xs font-semibold"
                : "text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            Wager Coins
          </button>
        </div>
      </div>

      {/* 3D Coin Stage */}
      <div className="my-5 flex flex-col items-center justify-center h-36">
        <div
          className="relative w-28 h-28 rounded-full shadow-xl transition-transform duration-1500 ease-out preserve-3d"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
          }}
        >
          {/* Heads Side */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-300 bg-linear-to-tr from-amber-500 via-yellow-300 to-amber-600 flex flex-col items-center justify-center text-zinc-950 font-black shadow-inner backface-hidden">
            <span className="text-3xl">👑</span>
            <span className="text-xs uppercase font-extrabold tracking-wider">Heads</span>
          </div>

          {/* Tails Side (rotated 180deg) */}
          <div
            className="absolute inset-0 rounded-full border-4 border-amber-400 bg-linear-to-tr from-yellow-500 via-amber-300 to-yellow-600 flex flex-col items-center justify-center text-zinc-950 font-black shadow-inner backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            <span className="text-3xl">🪙</span>
            <span className="text-xs uppercase font-extrabold tracking-wider">Tails</span>
          </div>
        </div>
      </div>

      {/* Choice Selector */}
      <div className="w-full max-w-xs flex gap-2 mb-3">
        <button
          onClick={() => setChoice("HEADS")}
          disabled={isFlipping}
          className={`flex-1 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            choice === "HEADS"
              ? "bg-[#EAF3FF] border-[#1769D2] text-[#1769D2]"
              : "border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
          }`}
        >
          <span>👑</span> Heads
        </button>
        <button
          onClick={() => setChoice("TAILS")}
          disabled={isFlipping}
          className={`flex-1 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            choice === "TAILS"
              ? "bg-[#EAF3FF] border-[#1769D2] text-[#1769D2]"
              : "border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
          }`}
        >
          <span>🪙</span> Tails
        </button>
      </div>

      {/* Wager amounts if in wager mode */}
      {mode === "WAGER" && (
        <div className="w-full max-w-xs flex items-center justify-between gap-1.5 mb-3">
          {[25, 50, 100, 250, 500].map((amt) => (
            <button
              key={amt}
              onClick={() => setWager(amt)}
              disabled={isFlipping}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                wager === amt
                  ? "bg-[#102A43] text-white border-[#102A43]"
                  : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
              }`}
            >
              {amt}
            </button>
          ))}
        </div>
      )}

      {/* Action Button */}
      <div className="w-full max-w-xs flex flex-col gap-2">
        <button
          onClick={onFlipClick}
          disabled={isFlipping}
          className="w-full h-11 rounded-xl bg-[#1769D2] hover:bg-[#1557B0] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
        >
          {isFlipping ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Flipping Coin...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {mode === "FREE"
                  ? `Free Flip (Win +25 Coins)`
                  : `Flip for +${Math.floor(wager * 0.95)} Coins`}
              </span>
            </>
          )}
        </button>

        {message && (
          <div
            className={`w-full text-xs px-3 py-2 rounded-xl text-center font-medium ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Provably fair proof disclosure */}
        {provablyFair && (
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SHA-256 Hash Verified</span>
          </div>
        )}
      </div>

      {/* Rewarded Ad Gate */}
      <GameAdGateModal
        isOpen={showAdModal}
        gameTitle="Free Coin Flip"
        gameIcon="🪙"
        onAdCompleted={() => {
          setShowAdModal(false);
          handleFlip();
        }}
        onCancel={() => setShowAdModal(false)}
      />
    </div>
  );
}
