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

      // Update global header coins
      window.dispatchEvent(
        new CustomEvent("balance-updated", {
          detail: { newCoins: data.newAvailableCoins },
        })
      );

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
    <div className="flex flex-col gap-6">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => setFilterBrand(b)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterBrand === b
                ? "bg-[#1769D2] text-white shadow-xs"
                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#102A43] hover:bg-gray-50"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredProducts.map((product) => {
          const canAfford = availableCoins >= product.coinsCost;
          const visual = BRAND_VISUALS[product.brand] || FALLBACK_VISUAL;

          return (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#1769D2]/40 hover:shadow-sm transition-all duration-200 overflow-hidden"
            >
              {/* Artwork Banner */}
              <div className="relative w-full aspect-[16/9] -mt-4 -mx-4 mb-3 rounded-t-2xl overflow-hidden bg-gray-100">
                <Image
                  src={visual.imageSrc || product.imageUrl || "/amazon-card.jpg"}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102A43]/80 via-transparent to-transparent" />
                
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#102A43] shadow-xs">
                    {product.brand}
                  </span>
                  <span className="text-[10px] font-semibold text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {product.countryCode === "GLOBAL" ? "Worldwide" : product.countryCode}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <h3 className="text-sm font-bold text-[#102A43] group-hover:text-[#1769D2] transition-colors">
                  {product.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#102A43]">
                    {product.coinsCost.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#64748B] ml-1">Coins</span>
                  <p className="text-[10px] font-semibold text-[#1769D2]">
                    Value: ${product.faceValue.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenModal(product)}
                  disabled={!canAfford}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    canAfford
                      ? "bg-[#1769D2] text-white hover:bg-[#1558b0] active:scale-95 shadow-xs"
                      : "bg-gray-100 text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
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
      <div className="mt-4 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#102A43]">Your Redemption History</h2>
        <div className="rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden shadow-xs">
          {redemptions.length === 0 ? (
            <div className="py-8 text-center text-[#64748B] text-xs">
              You have not submitted any redemption requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FA] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Method</th>
                    <th className="px-3 py-2.5">Address</th>
                    <th className="px-3 py-2.5">Amount</th>
                    <th className="px-3 py-2.5">Coins</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {redemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 text-[#64748B]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-[#102A43]">{r.payoutMethod}</td>
                      <td className="px-3 py-2.5 font-mono text-[#64748B] truncate max-w-[120px]">
                        {r.payoutAddress}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-emerald-600">
                        ${r.rewardValue.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-[#102A43]">
                        {r.coinsSpent.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "REFUNDED" || r.status === "REVERSED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#102A43]">{selectedProduct.title}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Cost: <span className="font-semibold text-[#1769D2]">{selectedProduct.coinsCost.toLocaleString()} Coins</span>
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#102A43] transition-colors flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {message && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium border ${
                  message.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleRedeem} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-[#102A43] block mb-1">
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
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] text-xs text-[#102A43] placeholder-[#94A3B8] focus:outline-none focus:border-[#1769D2] transition-colors"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Digital voucher code or transfer confirmation will be sent here.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1">
                <div className="flex justify-between">
                  <span>Coins to Deduct:</span>
                  <span className="font-bold text-[#102A43]">
                    {selectedProduct.coinsCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Balance After:</span>
                  <span className="font-bold text-emerald-600">
                    {(availableCoins - selectedProduct.coinsCost).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-100 text-[#64748B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1769D2] hover:bg-[#1558b0] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
