"use client";

import { useState } from "react";
import { Star, Zap, Lock, ExternalLink, ShieldCheck, X, Loader2 } from "lucide-react";
import { PartnerCardData } from "@/types/gpt";

const SURVEY_PARTNERS: PartnerCardData[] = [
  {
    id: "bitlabs",
    name: "BitLabs",
    type: "SURVEY",
    rating: 4.8,
    tag: "High Inventory",
    bonusPercent: 50,
    category: "Surveys & Polls",
    isUnlocked: true,
  },
  {
    id: "cpxresearch",
    name: "CPX Research",
    type: "SURVEY",
    rating: 4.9,
    tag: "Instant Payout",
    category: "Worldwide Surveys",
    isUnlocked: true,
  },
  {
    id: "inbrain",
    name: "InBrain.ai",
    type: "SURVEY",
    rating: 4.6,
    tag: "Mobile Optimized",
    category: "Short Studies",
    isUnlocked: false,
  },
];

const OFFER_PARTNERS: PartnerCardData[] = [
  {
    id: "torox",
    name: "Torox",
    type: "OFFER",
    rating: 4.9,
    bonusPercent: 30,
    tag: "Mobile Games",
    category: "App Milestones",
    isUnlocked: true,
  },
  {
    id: "adgate",
    name: "AdGate Media",
    type: "OFFER",
    rating: 4.7,
    tag: "Fast Crediting",
    bonusPercent: 50,
    category: "Free Trials & Quizzes",
    isUnlocked: true,
  },
  {
    id: "ayetstudios",
    name: "Ayet Studios",
    type: "OFFER",
    rating: 4.6,
    tag: "High Payouts",
    category: "Gaming & Apps",
    isUnlocked: true,
  },
  {
    id: "lootably",
    name: "Lootably",
    type: "OFFER",
    rating: 4.8,
    tag: "Videos & Tasks",
    category: "Multi-Reward Offers",
    isUnlocked: true,
  },
];

// ─── BitLabs iframe modal ─────────────────────────────────────────────────────
function BitLabsWallModal({ onClose }: { onClose: () => void }) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the signed URL from our server (keeps App Token secret)
  useState(() => {
    fetch("/api/offerwall/bitlabs-url")
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          setIframeUrl(data.url);
        } else {
          setError("Failed to load survey wall. Please try again.");
        }
      })
      .catch(() => setError("Connection error. Please try again."))
      .finally(() => setIsLoading(false));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl h-[80vh] rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col bg-zinc-950">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300 text-sm">
              Bi
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">BitLabs Survey Wall</p>
              <p className="text-[11px] text-zinc-400">Complete surveys to earn Coins instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close survey wall"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iframe / Loading / Error states */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-zinc-400">Loading surveys...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <p className="text-sm text-red-300 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {iframeUrl && !error && (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title="BitLabs Survey Wall"
              allow="camera; microphone"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError("Failed to load the survey wall. Your browser may be blocking iframes.");
              }}
            />
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 py-2.5 border-t border-white/5 shrink-0 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Surveys powered by BitLabs · Coins credited automatically on completion</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        </div>
      </div>
    </div>
  );
}

// ─── Coming Soon modal for unconnected partners ───────────────────────────────
function PlaceholderWallModal({
  partner,
  onClose,
}: {
  partner: PartnerCardData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-white/15 shadow-2xl flex flex-col gap-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              {partner.type} WALL
            </span>
            <h3 className="text-xl font-bold mt-1">{partner.name}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Rating: {partner.rating}/5.0 · {partner.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300 leading-relaxed space-y-2">
          <p>
            <strong>Integration Status:</strong> Coming Soon
          </p>
          <p className="text-zinc-400">
            {partner.name} integration is in progress. Once connected, this window will
            securely embed their live offerwall so you can start earning Coins.
          </p>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PartnerWalls() {
  const [selectedPartner, setSelectedPartner] = useState<PartnerCardData | null>(null);

  const handleOpenWall = (partner: PartnerCardData) => {
    if (!partner.isUnlocked) return;
    setSelectedPartner(partner);
  };

  return (
    <div className="w-full flex flex-col gap-10">

      {/* ── SECTION 1: SURVEY PARTNERS ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Survey Partners
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Guaranteed Credit
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified global survey routers matching surveys directly to your demographic profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SURVEY_PARTNERS.map((partner) => (
            <div
              key={partner.id}
              className="group relative p-5 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300 text-lg">
                    {partner.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white group-hover:text-indigo-400 transition-colors">
                      {partner.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center text-amber-400 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold ml-1 text-white text-xs">{partner.rating}</span>
                      </div>
                      <span className="text-zinc-600">•</span>
                      <span className="text-xs text-zinc-400">{partner.category}</span>
                    </div>
                  </div>
                </div>

                {partner.bonusPercent && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    +{partner.bonusPercent}%
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                {partner.isUnlocked ? (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unlocked & Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlocks at Level 2</span>
                  </div>
                )}

                <button
                  onClick={() => handleOpenWall(partner)}
                  disabled={!partner.isUnlocked}
                  className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500 text-zinc-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Open Wall</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: OFFER PARTNERS ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Offerwall Partners
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Top Earn Rates
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Major rewarded ad networks offering mobile games, app installs, and trial bonuses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OFFER_PARTNERS.map((partner) => (
            <div
              key={partner.id}
              className="group relative p-5 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-300 text-base">
                    {partner.name.slice(0, 2)}
                  </div>
                  {partner.bonusPercent && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                      +{partner.bonusPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors">
                    {partner.name}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-white text-xs">{partner.rating}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[11px] text-zinc-500">{partner.tag}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenWall(partner)}
                className="w-full py-2 rounded-xl bg-white/5 group-hover:bg-emerald-500 text-zinc-300 group-hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Launch {partner.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODALS ── */}
      {selectedPartner?.id === "bitlabs" && (
        <BitLabsWallModal onClose={() => setSelectedPartner(null)} />
      )}

      {selectedPartner && selectedPartner.id !== "bitlabs" && (
        <PlaceholderWallModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </div>
  );
}
