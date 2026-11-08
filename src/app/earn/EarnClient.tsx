"use client";

import { useState } from "react";
import { Coins, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import PartnerWalls from "@/components/gpt/PartnerWalls";
import { LuckySpinWheel } from "@/components/games/LuckySpinWheel";

interface Offer {
  id: string;
  provider: string;
  title: string;
  description: string;
  category: "GAME" | "SURVEY" | "APP" | "VIDEO" | "SIGNUP";
  difficulty: string;
  rewardCoins: number;
  timeEstimate: string;
  device: string;
  countryCode: string;
  iconUrl: string | null;
  instructions: string | null;
  externalUrl: string | null;
}

export default function EarnClient({
  offers,
  _userId,
  isAdmin = false,
}: {
  offers: Offer[];
  _userId?: string;
  isAdmin?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMsg, setSimulationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const categories = ["ALL", "GAME", "SURVEY", "APP", "VIDEO", "SIGNUP"];

  const filteredOffers =
    selectedCategory === "ALL"
      ? offers
      : offers.filter((o) => o.category === selectedCategory);

  const handleSimulateCompletion = async () => {
    if (!selectedOffer) return;
    setIsSimulating(true);
    setSimulationMsg(null);

    try {
      // Secret is kept server-side — client calls a proxy route that adds it
      const res = await fetch("/api/webhooks/simulate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: selectedOffer.id,
          amount: selectedOffer.rewardCoins,
          provider: selectedOffer.provider,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process postback.");

      setSimulationMsg({
        type: "success",
        text: `Success! +${selectedOffer.rewardCoins.toLocaleString()} Coins credited to your ledger.`,
      });

      // Dispatch balance update
      window.dispatchEvent(
        new CustomEvent("balance-updated", {
          detail: { coinsDelta: selectedOffer.rewardCoins },
        })
      );
    } catch (err: any) {
      setSimulationMsg({ type: "error", text: err.message || "Simulation failed." });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── ARCADE & MINI-GAMES SECTION ── */}
      <section>
        <LuckySpinWheel />
      </section>

      {/* ── PARTNER OFFERWALL ROUTERS (BitLabs & CPX Research) ── */}
      <section>
        <PartnerWalls />
      </section>

      {/* ── OFFERS MARKETPLACE ── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF3FF] flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-[#1769D2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#102A43] tracking-tight">Direct Tasks</h2>
              <p className="text-[11px] text-[#64748B]">
                High-paying game milestones, surveys, and app downloads
              </p>
            </div>
          </div>

          {/* Category Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#1769D2] text-white shadow-xs"
                    : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#102A43] hover:bg-gray-50"
                }`}
              >
                {cat === "ALL" ? "All Tasks" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Offer Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredOffers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[#64748B] text-xs bg-white rounded-2xl border border-[#E2E8F0]">
              No tasks currently available in this category. Check back shortly!
            </div>
          ) : (
            filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#1769D2]/40 hover:shadow-sm transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769D2]">
                      {offer.category}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-medium">
                      {offer.timeEstimate}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#102A43] group-hover:text-[#1769D2] transition-colors">
                    {offer.title}
                  </h3>

                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-[#102A43] tracking-tight">
                      ${(offer.rewardCoins / 1000).toFixed(2)}
                    </span>
                    <span className="text-[11px] font-semibold text-[#1769D2] ml-1">
                      +{offer.rewardCoins.toLocaleString()} Coins
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOffer(offer);
                      setSimulationMsg(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1769D2] hover:bg-[#1558b0] text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    Start Task
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Task Details / Completion Modal ── */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl flex flex-col gap-4 text-[#102A43]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#EAF3FF] text-[#1769D2]">
                  {selectedOffer.category}
                </span>
                <h3 className="text-lg font-bold text-[#102A43] mt-1">{selectedOffer.title}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Est. time: {selectedOffer.timeEstimate} · Difficulty: {selectedOffer.difficulty}
                </p>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#102A43] transition-colors flex items-center justify-center cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Payout Banner */}
            <div className="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Reward on Completion:</span>
              <div className="text-right">
                <span className="text-base font-bold text-[#102A43]">
                  ${(selectedOffer.rewardCoins / 1000).toFixed(2)} USD
                </span>
                <span className="text-[11px] font-bold text-[#1769D2] block">
                  +{selectedOffer.rewardCoins.toLocaleString()} Coins
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="flex flex-col gap-1.5 text-xs text-[#64748B] leading-relaxed">
              <strong className="text-[#102A43]">Completion Instructions:</strong>
              <p>
                {selectedOffer.instructions ||
                  "Install the application, open it, and reach the required level or complete the survey to earn your coins."}
              </p>
            </div>

            {/* Simulation feedback message */}
            {simulationMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  simulationMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {simulationMsg.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {selectedOffer.externalUrl ? (
                <a
                  href={selectedOffer.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#1769D2] hover:bg-[#1558b0] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>Start Task</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="flex-1 text-[11px] text-[#64748B] italic text-center py-2">
                  Follow instructions above to complete.
                </div>
              )}

              {/* Admin-only test completion */}
              {isAdmin && (
                <button
                  onClick={handleSimulateCompletion}
                  disabled={isSimulating}
                  className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  title="Admin-only credit simulation"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Admin Credit</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setSelectedOffer(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#102A43] font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
