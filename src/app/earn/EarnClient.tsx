"use client";

import { useState } from "react";
import Link from "next/link";

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
  userId,
}: {
  offers: Offer[];
  userId: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMsg, setSimulationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const categories = ["ALL", "GAME", "SURVEY", "APP", "VIDEO"];

  const filteredOffers =
    selectedCategory === "ALL"
      ? offers
      : offers.filter((o) => o.category === selectedCategory);

  const handleSimulateCompletion = async () => {
    if (!selectedOffer) return;
    setIsSimulating(true);
    setSimulationMsg(null);

    try {
      // Calls the verified webhook endpoint to simulate server postback verification
      const res = await fetch("/api/webhooks/mock-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": "mock_secret_test_123",
        },
        body: JSON.stringify({
          userId,
          amount: selectedOffer.rewardCoins,
          provider: selectedOffer.provider,
          externalTxId: `tx-${selectedOffer.id}-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process postback.");
      }

      setSimulationMsg({
        type: "success",
        text: `Success! +${selectedOffer.rewardCoins.toLocaleString()} Coins credited to your ledger.`,
      });
    } catch (err: any) {
      setSimulationMsg({
        type: "error",
        text: err.message || "Simulation failed.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat === "ALL" ? "All Opportunities" : cat}
          </button>
        ))}
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map((offer) => {
          return (
            <div
              key={offer.id}
              className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-all duration-300"
            >
              <div className="flex flex-col gap-4">
                {/* Meta row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {offer.category}
                  </span>
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                    <span>{offer.timeEstimate}</span>
                    <span>•</span>
                    <span className="text-zinc-500">{offer.difficulty}</span>
                  </div>
                </div>

                {/* Offer title & description */}
                <div>
                  <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {offer.description}
                  </p>
                </div>
              </div>

              {/* Reward & Button */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-emerald-400">
                    +{offer.rewardCoins.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1">Coins</span>
                  <p className="text-[11px] text-zinc-400">
                    ≈ ${(offer.rewardCoins / 1000).toFixed(2)} USD
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedOffer(offer);
                    setSimulationMsg(null);
                  }}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
                >
                  Start Task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Offer Details / Test Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-3xl bg-zinc-900 border border-white/15 shadow-2xl flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {selectedOffer.provider}
                </span>
                <h3 className="text-xl font-bold mt-1">{selectedOffer.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Reward: +{selectedOffer.rewardCoins.toLocaleString()} Coins ($
                  {(selectedOffer.rewardCoins / 1000).toFixed(2)} USD)
                </p>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {simulationMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  simulationMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {simulationMsg.text}
              </div>
            )}

            <div className="flex flex-col gap-3 text-xs bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="font-bold text-zinc-200">Completion Instructions:</span>
              <p className="text-zinc-400 whitespace-pre-line leading-relaxed">
                {selectedOffer.instructions || selectedOffer.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="block text-zinc-500 text-[10px]">Estimated Time</span>
                <span className="font-semibold text-white">{selectedOffer.timeEstimate}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="block text-zinc-500 text-[10px]">Supported Devices</span>
                <span className="font-semibold text-white">{selectedOffer.device}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSimulateCompletion}
                disabled={isSimulating}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all disabled:opacity-50"
              >
                {isSimulating ? "Verifying..." : "⚡ Test Webhook Completion"}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOffer(null)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-white/10 text-zinc-400 transition-colors"
                >
                  Close
                </button>
                <Link
                  href={selectedOffer.externalUrl || "#"}
                  target="_blank"
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all text-center"
                >
                  Start External Offer
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
