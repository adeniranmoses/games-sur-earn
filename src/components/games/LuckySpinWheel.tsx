"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Trophy, RotateCw } from "lucide-react";
import { WHEEL_SEGMENTS, MAX_SPINS_PER_DAY } from "@/lib/games";

interface SpinResponse {
  success: boolean;
  selectedIdx: number;
  label: string;
  rewardType: "COINS" | "TICKETS";
  amount: number;
  remainingSpins: number;
  newCoins: number;
  newTickets: number;
  message: string;
}

// Colors for each wheel segment position (index-matched to WHEEL_SEGMENTS)
const SEGMENT_COLORS = [
  "#3B82F6", // +25 Coins
  "#6366F1", // +30 Tickets
  "#10B981", // +50 Coins
  "#06B6D4", // +15 Coins
  "#8B5CF6", // +50 Tickets
  "#F59E0B", // +100 Coins
  "#EC4899", // +75 Coins
  "#EF4444", // JACKPOT 250
];

const SEGMENTS = WHEEL_SEGMENTS.map((seg, i) => ({
  label: seg.label,
  sub: seg.rewardType === "COINS" ? "Coins" : "Tickets",
  color: SEGMENT_COLORS[i] ?? "#6366F1",
  text: "#FFFFFF",
}));

export function LuckySpinWheel() {
  const [remainingSpins, setRemainingSpins] = useState<number>(MAX_SPINS_PER_DAY);
  const [maxSpins, setMaxSpins] = useState<number>(MAX_SPINS_PER_DAY);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationDegree, setRotationDegree] = useState<number>(0);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentRotationRef = useRef<number>(0);

  // Fetch initial daily spins status
  useEffect(() => {
    fetch("/api/games/spin")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.remainingSpins === "number") {
          setRemainingSpins(data.remainingSpins);
          setMaxSpins(data.maxSpins || 3);
        }
      })
      .catch(() => {});
  }, []);

  const handleSpin = async () => {
    if (isSpinning || remainingSpins <= 0) return;

    setIsSpinning(true);
    setWinMessage(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/games/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data: SpinResponse = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to spin. Please try again.");
        setIsSpinning(false);
        return;
      }

      // Calculate target angle
      // 8 slices => each slice is 360 / 8 = 45 degrees
      // Segment 0 is at top/center, rotating clockwise
      const sliceDeg = 360 / SEGMENTS.length;
      const targetSegment = data.selectedIdx;
      
      // Calculate rotation: add 5-7 full spins (1800 - 2520 deg) + offset to land on selected segment
      // The pointer is at the top (0 deg). Segment i center is at i * 45 + 22.5 deg.
      // To bring segment i under top pointer, wheel must rotate: 360 - (i * 45 + 22.5)
      const targetDeg = 360 - (targetSegment * sliceDeg + sliceDeg / 2);
      const extraSpins = 360 * 5; // 5 full revolutions
      const nextTotalRotation = currentRotationRef.current + extraSpins + ((targetDeg - (currentRotationRef.current % 360) + 360) % 360);

      currentRotationRef.current = nextTotalRotation;
      setRotationDegree(nextTotalRotation);

      // Wait for 4.2s spin animation to finish
      setTimeout(() => {
        setIsSpinning(false);
        setRemainingSpins(data.remainingSpins);
        setWinMessage(data.message);

        // Dispatch real-time balance update to header
        window.dispatchEvent(
          new CustomEvent("balance-updated", {
            detail: {
              newCoins: data.newCoins,
              newTickets: data.newTickets,
            },
          })
        );
      }, 4200);
    } catch {
      setErrorMsg("Connection error while spinning. Please try again.");
      setIsSpinning(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col items-center gap-5 text-center relative overflow-hidden">
      {/* Header Badge */}
      <div className="w-full flex items-center justify-between border-b border-[#E2E8F0] pb-3 text-left">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102A43] flex items-center gap-1.5">
              <span>Lucky Spin Wheel</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Play &amp; Win
              </span>
            </h3>
            <p className="text-[11px] text-[#64748B]">Spin daily for free bonus coins &amp; tickets</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-[#102A43] block">
            {remainingSpins} / {maxSpins} Free Spins
          </span>
          <span className="text-[10px] text-[#64748B]">Resets 00:00 UTC</span>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {winMessage && (
        <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in zoom-in duration-200">
          {winMessage}
        </div>
      )}

      {/* ── Wheel Container ── */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
        {/* Top Pointer Arrow */}
        <div className="absolute -top-3 z-20 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-md" />
        </div>

        {/* Outer Wheel Ring */}
        <div
          className="w-full h-full rounded-full border-8 border-[#102A43] shadow-2xl overflow-hidden relative"
          style={{
            transform: `rotate(${rotationDegree}deg)`,
            transition: isSpinning ? "transform 4200ms cubic-bezier(0.15, 0.9, 0.2, 1)" : "none",
          }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            style={{ display: "block" }}
          >
            {SEGMENTS.map((seg, idx) => {
              const total = SEGMENTS.length;
              const anglePerSlice = (2 * Math.PI) / total;
              const startAngle = idx * anglePerSlice - Math.PI / 2; // start from top
              const endAngle = startAngle + anglePerSlice;
              const cx = 100;
              const cy = 100;
              const r = 100;
              const rText = 68; // radius for text placement

              const x1 = cx + r * Math.cos(startAngle);
              const y1 = cy + r * Math.sin(startAngle);
              const x2 = cx + r * Math.cos(endAngle);
              const y2 = cy + r * Math.sin(endAngle);

              const midAngle = startAngle + anglePerSlice / 2;
              const tx = cx + rText * Math.cos(midAngle);
              const ty = cy + rText * Math.sin(midAngle);
              const textRotation = (midAngle * 180) / Math.PI + 90;

              return (
                <g key={idx}>
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                    fill={seg.color}
                    stroke="#102A43"
                    strokeWidth="1"
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FFFFFF"
                    fontSize="8"
                    fontWeight="bold"
                    transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Center Hub Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || remainingSpins <= 0}
          className="absolute z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#102A43] border-4 border-amber-400 text-white font-black text-xs flex flex-col items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSpinning ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          ) : remainingSpins <= 0 ? (
            <span className="text-[10px] text-gray-300">DONE</span>
          ) : (
            <>
              <span className="text-amber-400 leading-none">SPIN</span>
              <span className="text-[9px] text-gray-300 leading-none mt-0.5">FREE</span>
            </>
          )}
        </button>
      </div>

      {/* Action / Trigger Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || remainingSpins <= 0}
        className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
          isSpinning
            ? "bg-amber-100 text-amber-800 cursor-not-allowed border border-amber-200"
            : remainingSpins <= 0
            ? "bg-gray-100 text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
            : "bg-[#1769D2] hover:bg-[#1558b0] text-white active:scale-98"
        }`}
      >
        {isSpinning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Spinning the prize wheel…</span>
          </>
        ) : remainingSpins <= 0 ? (
          <span>Daily Spins Completed (Resets Midnight UTC)</span>
        ) : (
          <>
            <RotateCw className="w-4 h-4" />
            <span>Spin Free Prize Wheel ({remainingSpins} Left Today)</span>
          </>
        )}
      </button>
    </div>
  );
}
