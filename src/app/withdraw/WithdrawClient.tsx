"use client";

import { useState } from "react";
import Image from "next/image";

// ── Brand visual registry ────────────────────────────────────────────────────
// Each brand maps to its artwork image + bottom-panel gradient.
// Brands without a generated image fall back to a CSS gradient hero instead.
const BRAND_VISUALS: Record<
  string,
  { imageSrc?: string; heroBg?: string; overlayColor: string; badgeColor: string }
> = {
  Amazon: {
    imageSrc: "/amazon-card.jpg",
    overlayColor: "from-amber-950/70 via-amber-950/85 to-[#0F1117]",
    badgeColor: "bg-amber-500 text-zinc-950",
  },
  Apple: {
    imageSrc: "/apple-card.jpg",
    overlayColor: "from-purple-950/70 via-purple-950/85 to-[#0F1117]",
    badgeColor: "bg-purple-400 text-zinc-950",
  },
  Crypto: {
    imageSrc: "/litecoin-card.jpg",
    overlayColor: "from-blue-950/70 via-blue-950/85 to-[#0F1117]",
    badgeColor: "bg-blue-400 text-zinc-950",
  },
  "Google Play": {
    imageSrc: "/google-play-card.jpg",
    overlayColor: "from-green-950/70 via-green-950/85 to-[#0F1117]",
    badgeColor: "bg-green-400 text-zinc-950",
  },
  Tether: {
    imageSrc: "/tether-card.jpg",
    overlayColor: "from-emerald-950/70 via-emerald-950/85 to-[#0F1117]",
    badgeColor: "bg-emerald-400 text-zinc-950",
  },
};

// Fallback for any brand not in the registry
const FALLBACK_VISUAL = {
  heroBg: "from-indigo-700 via-indigo-600 to-purple-700",
  overlayColor: "from-indigo-950/70 via-indigo-950/85 to-[#0F1117]",
  badgeColor: "bg-indigo-400 text-zinc-950",
};

interface Product {
  id: string;
  title: string;
  brand: string;
  description: string | null;
  countryCode: string;
  currency: string;
  faceValue: number;
  coinsCost: number;
  imageUrl: string | null;
}

interface Redemption {
  id: string;
  coinsSpent: number;
  displayCurrency: string;
  rewardValue: number;
  payoutMethod: string;
  payoutAddress: string;
  status: string;
  createdAt: string;
}

export default function WithdrawClient({
  initialAvailableCoins,
  products,
  redemptions: initialRedemptions,
}: {
  initialAvailableCoins: number;
  products: Product[];
  redemptions: Redemption[];
}) {
  const [availableCoins, setAvailableCoins] = useState(initialAvailableCoins);
  const [redemptions, setRedemptions] = useState<Redemption[]>(initialRedemptions);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [payoutAddress, setPayoutAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterBrand, setFilterBrand] = useState("ALL");

  const brands = ["ALL", ...Array.from(new Set(products.map((p) => p.brand)))];

  const filteredProducts =
    filterBrand === "ALL"
      ? products
      : products.filter((p) => p.brand === filterBrand);

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setPayoutAddress("");
    setMessage(null);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedProduct(null);
    setMessage(null);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !payoutAddress.trim()) return;

    if (availableCoins < selectedProduct.coinsCost) {
      setMessage({ type: "error", text: "Insufficient coins for this reward." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const payoutMethod =
        selectedProduct.brand === "Crypto" || selectedProduct.brand === "Tether"
          ? "CRYPTO"
          : "GIFT_CARD";

      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          payoutMethod,
          payoutAddress: payoutAddress.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Redemption failed.");
      }

      setAvailableCoins(data.newAvailableCoins);
      setMessage({
        type: "success",
        text: "Redemption submitted! Your coins have been reserved while the order is verified.",
      });

      // Add new record to local list
      const newEntry: Redemption = {
        id: data.redemptionId,
        coinsSpent: selectedProduct.coinsCost,
        displayCurrency: selectedProduct.currency,
        rewardValue: selectedProduct.faceValue,
        payoutMethod,
        payoutAddress: payoutAddress.trim(),
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      setRedemptions([newEntry, ...redemptions]);

      setTimeout(() => {
        handleCloseModal();
      }, 2500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => setFilterBrand(b)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              filterBrand === b
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const canAfford = availableCoins >= product.coinsCost;

          return (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-all duration-300"
            >
              <div className="flex flex-col gap-4">
                {/* Header tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-indigo-300">
                    {product.brand}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    {product.countryCode === "GLOBAL" ? "Worldwide" : product.countryCode}
                  </span>
                </div>

                {/* Card Title & Desc */}
                <div>
                  <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-white">
                    {product.coinsCost.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1">Coins</span>
                  <p className="text-[11px] text-zinc-400">
                    Face value: ${product.faceValue.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenModal(product)}
                  disabled={!canAfford}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    canAfford
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 active:scale-95"
                      : "bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5"
                  }`}
                >
                  {canAfford ? "Redeem" : "Locked"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Redemption History Table */}
      <div className="mt-8 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Your Redemption Requests</h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          {redemptions.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              You have not submitted any redemption requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-zinc-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Recipient Address</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Coins Reserved</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {redemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5 text-zinc-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">{r.payoutMethod}</td>
                      <td className="px-4 py-3.5 font-mono text-zinc-300 truncate max-w-[180px]">
                        {r.payoutAddress}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">
                        ${r.rewardValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-300">
                        {r.coinsSpent.toLocaleString()} Coins
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === "COMPLETED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : r.status === "REJECTED" || r.status === "REFUNDED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Redemption Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-white/15 shadow-2xl flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{selectedProduct.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cost: {selectedProduct.coinsCost.toLocaleString()} Coins
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  message.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleRedeem} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  {selectedProduct.brand === "Crypto" || selectedProduct.brand === "Tether"
                    ? "Your Wallet Address"
                    : "Recipient Email Address"}
                </label>
                <input
                  type={
                    selectedProduct.brand === "Crypto" || selectedProduct.brand === "Tether"
                      ? "text"
                      : "email"
                  }
                  required
                  placeholder={
                    selectedProduct.brand === "Crypto" || selectedProduct.brand === "Tether"
                      ? "e.g. 0x... or LTC address"
                      : "e.g. your-email@example.com"
                  }
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Digital gift card codes or crypto transactions are dispatched to this address.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span>Coins to Deduct:</span>
                  <span className="font-bold text-white">
                    {selectedProduct.coinsCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Balance After:</span>
                  <span className="font-bold text-emerald-400">
                    {(availableCoins - selectedProduct.coinsCost).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-full text-xs font-semibold hover:bg-white/10 text-zinc-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Confirm Redemption"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
