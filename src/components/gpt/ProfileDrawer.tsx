"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Eye,
  EyeOff,
  Bell,
  LogOut,
  Calendar,
  Users,
  Coins,
  Edit2,
  RefreshCw,
  ExternalLink,
  Loader2
} from "lucide-react";
import { UserProfileData } from "@/types/gpt";
import { signOut } from "next-auth/react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileData;
}

export default function ProfileDrawer({ isOpen, onClose, user }: ProfileDrawerProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [promoOffers, setPromoOffers] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [language, setLanguage] = useState("English (US)");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendLink, setResendLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleResendVerification = async () => {
    setResendStatus("sending");
    setResendLink(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.devVerifyUrl) {
        setResendLink(data.devVerifyUrl);
      }
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  };

  const formattedJoinDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(user.createdAt));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-[#0F1117] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto text-white z-10 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Account Profile
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* User Hero Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-emerald-500/20 uppercase ring-2 ring-emerald-500/30">
                {user.name ? user.name.slice(0, 2) : "US"}
              </div>
              {/* Flag Badge */}
              <span
                className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 border border-white/20 shadow"
                title={`Country: ${user.countryCode || "NG"}`}
              >
                {user.countryCode === "NG" ? "🇳🇬" : user.countryCode === "US" ? "🇺🇸" : "🌐"}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold truncate">{user.name}</h3>
                <button
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                  title="Edit alias"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-zinc-400 font-mono">@{user.referralCode}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {user.role}
                </span>
                <span className="text-[11px] text-zinc-500">Tier 1 Member</span>
              </div>
            </div>
          </div>

          {/* Module 2 Information Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3.5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
              Identity & Referral Info
            </span>

            {/* Platform Account ID */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Account ID</span>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 font-mono text-zinc-300 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 transition-colors"
              >
                <span>{user.id.slice(0, 8)}...</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>
            </div>

            {/* Referrer Details */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Referred By</span>
              <span className="font-semibold text-zinc-300">
                {user.referredByCode ? `@${user.referredByCode}` : "Direct Signup"}
              </span>
            </div>

            {/* Cumulative Referral Earnings */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Referral Earnings</span>
              </div>
              <span className="font-bold text-emerald-400">
                {user.referralEarningsCoins.toLocaleString()} Coins
              </span>
            </div>

            {/* Joined Date */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Member Since</span>
              </div>
              <span className="text-zinc-400">{formattedJoinDate}</span>
            </div>
          </div>

          {/* Module 2 Settings Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
              Preferences & Security
            </span>

            {/* Email with Verified Badge */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-zinc-400">Email Address</span>
                  <span className="font-medium text-zinc-200 mt-0.5 truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>
                {user.emailVerified ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    <ShieldAlert className="w-3 h-3" />
                    Unverified
                  </div>
                )}
              </div>

              {/* Verification action banner for unverified users */}
              {!user.emailVerified && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
                  <p className="text-amber-300 text-[11px] leading-relaxed">
                    ⚠️ Verify your email to unlock withdrawals and full platform access.
                  </p>
                  {resendStatus === "sent" ? (
                    <>
                      <p className="text-emerald-400 text-[11px]">
                        ✓ Verification link sent!
                      </p>
                      {resendLink && (
                        <a
                          href={resendLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Click here to verify (sandbox)
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleResendVerification}
                      disabled={resendStatus === "sending"}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/30 transition-colors disabled:opacity-50"
                    >
                      {resendStatus === "sending" ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      {resendStatus === "sending" ? "Sending..." : resendStatus === "error" ? "Failed — Retry" : "Resend Verification Email"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Globe className="w-3.5 h-3.5" />
                <span>Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
                <option value="Spanish">Español</option>
              </select>
            </div>

            {/* Profile Visibility Toggle Switch */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                {isPublic ? (
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span>Profile Visibility</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  isPublic ? "bg-indigo-600 justify-end" : "bg-zinc-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
              </button>
            </div>

            {/* Promotional Offers Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Promotional Offers</span>
              </div>
              <button
                type="button"
                onClick={() => setPromoOffers(!promoOffers)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  promoOffers ? "bg-emerald-600 justify-end" : "bg-zinc-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-white/10 flex flex-col gap-2.5">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-colors"
            >
              <span>⚡ Open Admin Panel</span>
            </Link>
          )}

          <button
            onClick={async () => {
              setIsSigningOut(true);
              await signOut({ callbackUrl: "/login" });
            }}
            disabled={isSigningOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Sign Out of FreeRewards</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
