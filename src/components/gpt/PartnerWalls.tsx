"use client";

import { useState, useEffect } from "react";
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
  useEffect(() => {
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
  }, []);

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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F5F7FA]">
              <Loader2 className="w-8 h-8 text-[#1769D2] animate-spin" />
              <p className="text-sm text-[#64748B]">Loading surveys...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#F5F7FA] p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <p className="text-sm text-rose-700 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1769D2] hover:bg-[#1558b0] text-white transition-colors cursor-pointer"
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
        <div className="px-5 py-2.5 border-t border-[#E2E8F0] shrink-0 flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Surveys powered by BitLabs · Coins credited automatically on completion</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      </div>
    </div>
  );
}

// ─── CPX Research iframe modal ───────────────────────────────────────────────
function CpxWallModal({ onClose }: { onClose: () => void }) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/offerwall/cpx-url")
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          setIframeUrl(data.url);
        } else {
          setError("Failed to generate CPX Research survey wall. Please try again.");
        }
      })
      .catch(() => setError("Network error loading CPX Research. Please check your connection."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl h-[80vh] rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col bg-zinc-950">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/30 to-orange-500/30 border border-amber-500/30 flex items-center justify-center font-black text-amber-300 text-sm">
              CP
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">CPX Research Survey Router</p>
              <p className="text-[11px] text-zinc-400">High-yield global surveys · Fast crediting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close CPX survey wall"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iframe / Loading / Error states */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F5F7FA]">
              <Loader2 className="w-8 h-8 text-[#1769D2] animate-spin" />
              <p className="text-sm text-[#64748B]">Connecting to CPX Research surveys...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#F5F7FA] p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <p className="text-sm text-rose-700 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1769D2] hover:bg-[#1558b0] text-white transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {iframeUrl && !error && (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title="CPX Research Survey Wall"
              allow="camera; microphone"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError("Failed to load CPX survey router. Your browser may be blocking iframe popups.");
              }}
            />
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 py-2.5 border-t border-[#E2E8F0] shrink-0 flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Surveys powered by CPX Research · Credits verified via secure S2S callbacks</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl flex flex-col gap-3 text-[#102A43]">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#EAF3FF] text-[#1769D2]">
              {partner.type} WALL
            </span>
            <h3 className="text-lg font-bold mt-1 text-[#102A43]">{partner.name}</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Rating: {partner.rating}/5.0 · {partner.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#102A43] transition-colors flex items-center justify-center cursor-pointer text-sm font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed space-y-1.5">
          <p>
            <strong className="text-[#102A43]">Integration Status:</strong> Coming Soon
          </p>
          <p>
            {partner.name} integration is in progress. Once connected, this window will
            securely embed their live offerwall so you can start earning Coins.
          </p>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-[#102A43] transition-colors cursor-pointer"
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
    <div className="w-full flex flex-col gap-6">

      {/* ── SECTION 1: SURVEY PARTNERS ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#102A43] tracking-tight flex items-center gap-2">
              Survey Routers
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2]">
                Verified Payouts
              </span>
            </h3>
            <p className="text-xs text-[#64748B]">
              Top global survey networks tailored to your profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SURVEY_PARTNERS.map((partner) => (
            <div
              key={partner.id}
              className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#1769D2]/40 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] flex items-center justify-center font-bold text-[#1769D2] text-sm">
                    {partner.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#102A43]">
                      {partner.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center text-amber-500 text-xs">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="font-bold ml-1 text-[#102A43] text-xs">{partner.rating}</span>
                      </div>
                      <span className="text-[#CBD5E1]">•</span>
                      <span className="text-xs text-[#64748B]">{partner.category}</span>
                    </div>
                  </div>
                </div>

                {partner.bonusPercent && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Zap className="w-3 h-3 fill-emerald-600" />
                    +{partner.bonusPercent}%
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0] text-xs">
                {partner.isUnlocked ? (
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unlocked & Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[#94A3B8] text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlocks Level 2</span>
                  </div>
                )}

                <button
                  onClick={() => handleOpenWall(partner)}
                  disabled={!partner.isUnlocked}
                  className="px-3 py-1.5 rounded-xl bg-[#1769D2] hover:bg-[#1558b0] text-white font-bold text-xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
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
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#102A43] tracking-tight flex items-center gap-2">
              Offerwall Networks
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2]">
                Instant Multipliers
              </span>
            </h3>
            <p className="text-xs text-[#64748B]">
              Major offerwalls for gaming quests, trials, and quick app installs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OFFER_PARTNERS.map((partner) => (
            <div
              key={partner.id}
              className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#1769D2]/40 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] flex items-center justify-center font-bold text-[#1769D2] text-sm">
                    {partner.name.slice(0, 2)}
                  </div>
                  {partner.bonusPercent && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      +{partner.bonusPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#102A43]">
                    {partner.name}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span className="font-bold text-[#102A43] text-xs">{partner.rating}</span>
                    <span className="text-[#CBD5E1]">•</span>
                    <span className="text-[11px] text-[#64748B]">{partner.tag}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenWall(partner)}
                className="w-full py-2 rounded-xl bg-[#F5F7FA] hover:bg-[#1769D2] text-[#102A43] hover:text-white border border-[#E2E8F0] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch {partner.name}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODALS ── */}
      {selectedPartner?.id === "bitlabs" && (
        <BitLabsWallModal onClose={() => setSelectedPartner(null)} />
      )}

      {selectedPartner?.id === "cpxresearch" && (
        <CpxWallModal onClose={() => setSelectedPartner(null)} />
      )}

      {selectedPartner && selectedPartner.id !== "bitlabs" && selectedPartner.id !== "cpxresearch" && (
        <PlaceholderWallModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </div>
  );
}
