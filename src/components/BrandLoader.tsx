"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface BrandLoaderProps {
  message?: string;
  submessage?: string;
  fullPage?: boolean;
}

export default function BrandLoader({
  message = "Loading RewardPlatform...",
  submessage = "Preparing your offers and rewards",
  fullPage = true,
}: BrandLoaderProps) {
  const content = (
    <div className="relative flex flex-col items-center justify-center gap-6 p-8 max-w-sm w-full mx-auto text-center select-none">
      {/* Ambient background glow */}
      <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-emerald-500/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* Main Animated Loader Ring Container */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer Counter-Rotating Gradient Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin"
          style={{ animationDuration: "1.6s", animationDirection: "reverse" }}
        />

        {/* Inner Fast-Rotating Gradient Ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-emerald-400 border-l-indigo-400 animate-spin"
          style={{ animationDuration: "1.1s" }}
        />

        {/* Central Logo Box with Glow and Floating Sparkle */}
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 flex items-center justify-center font-extrabold text-xl text-white shadow-xl shadow-indigo-500/40 border border-white/20">
          <span>R</span>
          {/* Subtle micro sparkle icon badge */}
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-zinc-950 flex items-center justify-center animate-bounce shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>

      {/* Text block */}
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
          <span>{message}</span>
        </h3>
        {submessage && (
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            {submessage}
          </p>
        )}
      </div>

      {/* Sleek Neon Shimmer Progress Bar */}
      <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden relative">
        <div
          className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full"
          style={{
            animation: "shimmerSlide 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shimmerSlide {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
      `}</style>
    </div>
  );

  if (!fullPage) {
    return content;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-md"
    >
      {content}
    </div>
  );
}
