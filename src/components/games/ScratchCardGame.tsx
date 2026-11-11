"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Sparkles, RefreshCw, Trophy, Gift } from "lucide-react";
import { GameAdGateModal } from "./GameAdGateModal";
import { AD_CONFIG } from "@/lib/ads-config";

interface ScratchPrize {
  label: string;
  rewardType: "COINS" | "TICKETS";
  amount: number;
  symbol: string;
}

export function ScratchCardGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [remainingScratches, setRemainingScratches] = useState<number>(3);
  const [isScratching, setIsScratching] = useState<boolean>(false);
  const [scratchedPercent, setScratchedPercent] = useState<number>(0);
  const [prize, setPrize] = useState<ScratchPrize | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);

  const isDrawing = useRef(false);

  // Initialize canvas with sparkling golden foil
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";

    // Golden metallic gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#D97706");
    grad.addColorStop(0.25, "#FDE68A");
    grad.addColorStop(0.5, "#B45309");
    grad.addColorStop(0.75, "#FCD34D");
    grad.addColorStop(1, "#92400E");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative pattern and text
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < width; i += 24) {
      ctx.fillRect(i, 0, 1.5, height);
    }

    ctx.fillStyle = "#451A03";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ SCRATCH HERE ✨", width / 2, height / 2 - 12);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#78350F";
    ctx.fillText("Rub foil to reveal your prize", width / 2, height / 2 + 12);
  }, []);

  // Fetch remaining count on mount
  useEffect(() => {
    fetch("/api/games/scratch")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.remainingScratches === "number") {
          setRemainingScratches(data.remainingScratches);
        }
      })
      .catch(() => {});
  }, []);

  const onNewCardClick = () => {
    if (isGenerating || remainingScratches <= 0) return;
    if (AD_CONFIG.enabledForGames) {
      setShowAdModal(true);
    } else {
      startNewCard();
    }
  };

  // Request new scratch card from server
  const startNewCard = async () => {
    if (isGenerating || remainingScratches <= 0) return;
    setIsGenerating(true);
    setPrize(null);
    setSessionToken(null);
    setScratchedPercent(0);
    setClaimed(false);
    setStatusMessage(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/games/scratch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to issue scratch card.");
        return;
      }

      setPrize(data.prize);
      setSessionToken(data.sessionToken);
      setRemainingScratches(data.remainingScratches);

      // Re-init canvas after state updates
      setTimeout(() => initCanvas(), 50);
    } catch {
      setErrorMsg("Network error. Could not connect to scratch game.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Scratch action handler
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !prize || claimed || isClaiming) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    calculateScratchedPercentage();
  };

  const calculateScratchedPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    // Downsample check for speed
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    let transparent = 0;
    const total = pixels.length / 4;

    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) {
        transparent += 4;
      }
    }

    const pct = Math.min(100, Math.round((transparent / total) * 100));
    setScratchedPercent(pct);

    if (pct >= 50 && !claimed && !isClaiming && sessionToken) {
      handleClaim(sessionToken, pct);
    }
  };

  const handleClaim = async (token: string, pct: number) => {
    setIsClaiming(true);
    try {
      const res = await fetch("/api/games/scratch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          sessionToken: token,
          scratchedRatio: pct / 100,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to claim reward.");
        return;
      }

      setClaimed(true);
      setStatusMessage(data.message);
      setRemainingScratches(data.remainingScratches);

      // Dispatch global coin balance event
      if (data.prize.rewardType === "COINS") {
        window.dispatchEvent(
          new CustomEvent("balance-updated", {
            detail: { coinsDelta: data.prize.amount },
          })
        );
      }
    } catch {
      setErrorMsg("Error claiming reward.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#102A43] text-sm sm:text-base">
              Lucky Scratch &amp; Win
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Rub the golden card to reveal instant Coins &amp; Tickets!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F5F7FA] border border-[#E2E8F0] px-3 py-1 rounded-full text-xs font-semibold text-[#102A43]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{remainingScratches} left today</span>
        </div>
      </div>

      {/* Card Arena */}
      <div className="relative w-full max-w-[340px] h-[190px] rounded-2xl overflow-hidden shadow-md border-2 border-amber-300 bg-linear-to-br from-amber-500 via-orange-400 to-amber-600 flex flex-col items-center justify-center text-white select-none">
        {/* Background Revealed Prize Layer */}
        {prize ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-linear-to-b from-indigo-900 via-slate-900 to-black z-0">
            <span className="text-4xl animate-bounce mb-1">{prize.symbol}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              You Revealed
            </span>
            <span className="text-2xl font-black text-white mt-0.5">
              +{prize.amount.toLocaleString()}{" "}
              {prize.rewardType === "COINS" ? "Coins" : "Tickets"}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1">
              {claimed ? "✅ Credited to Ledger" : `Scratched: ${scratchedPercent}%`}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-0">
            <Trophy className="w-10 h-10 text-amber-100 mb-2 opacity-80" />
            <p className="font-bold text-sm text-white drop-shadow-sm">
              Press &quot;Get New Card&quot; to Scratch
            </p>
            <p className="text-[11px] text-amber-100/90 mt-0.5">
              Win up to 1,000 Coins or 50 Raffle Tickets
            </p>
          </div>
        )}

        {/* Foreground Scratchable Canvas */}
        {prize && (
          <canvas
            ref={canvasRef}
            width={340}
            height={190}
            className={`absolute inset-0 w-full h-full z-10 cursor-pointer touch-none transition-opacity duration-300 ${
              claimed ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            onMouseDown={(e) => {
              isDrawing.current = true;
              scratch(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              if (isDrawing.current) scratch(e.clientX, e.clientY);
            }}
            onMouseUp={() => {
              isDrawing.current = false;
            }}
            onMouseLeave={() => {
              isDrawing.current = false;
            }}
            onTouchStart={(e) => {
              isDrawing.current = true;
              const touch = e.touches[0];
              scratch(touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              if (isDrawing.current) {
                const touch = e.touches[0];
                scratch(touch.clientX, touch.clientY);
              }
            }}
            onTouchEnd={() => {
              isDrawing.current = false;
            }}
          />
        )}
      </div>

      {/* Control Actions & Status */}
      <div className="w-full max-w-[340px] mt-4 flex flex-col gap-2">
        {statusMessage && (
          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-xl text-center font-medium">
            {statusMessage}
          </div>
        )}

        {errorMsg && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl text-center font-medium">
            {errorMsg}
          </div>
        )}

        {(!prize || claimed) && (
          <button
            onClick={onNewCardClick}
            disabled={isGenerating || remainingScratches <= 0}
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Card...</span>
              </>
            ) : remainingScratches <= 0 ? (
              <span>Daily Limit Reached (3/3)</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Get New Scratch Card</span>
              </>
            )}
          </button>
        )}

        {prize && !claimed && (
          <div className="flex items-center justify-between text-xs text-[#64748B] px-1 font-medium">
            <span>Foil Removed: {scratchedPercent}%</span>
            <span>Scratch &gt; 50% to claim</span>
          </div>
        )}
      </div>

      {/* Rewarded Ad Gate */}
      <GameAdGateModal
        isOpen={showAdModal}
        gameTitle="Scratch & Win"
        gameIcon="🎟️"
        onAdCompleted={() => {
          setShowAdModal(false);
          startNewCard();
        }}
        onCancel={() => setShowAdModal(false)}
      />
    </div>
  );
}
