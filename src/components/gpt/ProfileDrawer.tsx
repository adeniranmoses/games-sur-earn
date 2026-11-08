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
  LogOut,
  Calendar,
  Users,
  RefreshCw,
  ExternalLink,
  Loader2,
  Sparkles,
  Ticket
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
  const [copiedRef, setCopiedRef] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [language, setLanguage] = useState("English (US)");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendLink, setResendLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyRef = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://gamessurearn.com";
    navigator.clipboard?.writeText(`${origin}/r/${user.referralCode}`);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
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
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col justify-between overflow-y-auto text-[#102A43] z-10 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF3FF] flex items-center justify-center text-[#1769D2]">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[#102A43]">
              Account Profile
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#64748B] hover:text-[#102A43] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 flex flex-col gap-5 flex-1">
          
          {/* User Hero Section */}
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#F5F7FA] border border-[#E2E8F0]">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-[#1769D2] flex items-center justify-center text-lg font-black text-white shadow-xs uppercase">
                {user.name ? user.name.slice(0, 2) : "US"}
              </div>
              {/* Flag Badge */}
              <span
                className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-white border border-[#E2E8F0] shadow-xs"
                title={`Country: ${user.countryCode || "NG"}`}
              >
                {user.countryCode === "NG" ? "🇳🇬" : user.countryCode === "US" ? "🇺🇸" : "🌐"}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-[#102A43] truncate">{user.name}</h3>
                <ShieldCheck className="w-4 h-4 text-[#1769D2] shrink-0" />
              </div>
              <span className="text-xs text-[#64748B] font-mono truncate">{user.email}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3FF] text-[#1769D2] border border-[#BFDBFE]">
                  {user.role}
                </span>
                <span className="text-[11px] font-medium text-[#64748B]">
                  Streak: 🔥 {user.currentStreak || 0}d
                </span>
              </div>
            </div>
          </div>

          {/* Balance & Tickets Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Available Coins</span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-950">
                  🪙
                </div>
                <span className="text-base font-bold text-[#102A43]">
                  {(user.availableCoins || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#1769D2] block mt-0.5">
                ≈ ${((user.availableCoins || 0) / 1000).toFixed(2)} USD
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] text-[#64748B] font-medium block">Raffle Tickets</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Ticket className="w-4 h-4 text-[#1769D2]" />
                <span className="text-base font-bold text-[#102A43]">
                  {(user.tickets || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                Active for Raffles
              </span>
            </div>
          </div>

          {/* Module 2: Identity & Referral Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
              Identity & Referral Info
            </span>

            {/* Platform Account ID */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Account ID</span>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 font-mono text-[#102A43] hover:text-[#1769D2] bg-[#F5F7FA] px-2.5 py-1 rounded-lg border border-[#E2E8F0] transition-colors cursor-pointer"
              >
                <span>{user.id ? user.id.slice(0, 10) : "..."}...</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                )}
              </button>
            </div>

            {/* Referral Link & Code */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Your Referral Code</span>
              <button
                onClick={handleCopyRef}
                className="flex items-center gap-1.5 font-mono font-bold text-[#1769D2] hover:text-[#1558b0] bg-[#EAF3FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] transition-colors cursor-pointer"
              >
                <span>{user.referralCode}</span>
                {copiedRef ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#1769D2]" />
                )}
              </button>
            </div>

            {/* Referrer Details */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Referred By</span>
              <span className="font-semibold text-[#102A43]">
                {user.referredByCode ? `@${user.referredByCode}` : "Direct Signup"}
              </span>
            </div>

            {/* Referral Earnings */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#64748B]">
                <Users className="w-3.5 h-3.5 text-[#1769D2]" />
                <span>Referral Network</span>
              </div>
              <span className="font-bold text-emerald-600">
                {user.referralCount || 0} friends · {(user.referralEarningsCoins || 0).toLocaleString()} Coins
              </span>
            </div>

            {/* Joined Date */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-[#64748B]">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Member Since</span>
              </div>
              <span className="text-[#64748B]">{formattedJoinDate}</span>
            </div>
          </div>

          {/* Module 3: Preferences & Security Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col gap-3.5">
            <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
              Preferences & Security
            </span>

            {/* Email with Verified Badge */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[#64748B]">Email Address</span>
                  <span className="font-semibold text-[#102A43] mt-0.5 truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>
                {user.emailVerified ? (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                    <ShieldAlert className="w-3 h-3" />
                    Unverified
                  </div>
                )}
              </div>

              {/* Verification action banner for unverified users */}
              {!user.emailVerified && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-2">
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    ⚠️ Verify your email to unlock withdrawals and full platform access.
                  </p>
                  {resendStatus === "sent" ? (
                    <>
                      <p className="text-emerald-700 text-[11px] font-medium">
                        ✓ Verification link sent to your inbox!
                      </p>
                      {resendLink && (
                        <a
                          href={resendLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[#1769D2] hover:underline text-[11px] font-bold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Click here to verify (sandbox link)
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleResendVerification}
                      disabled={resendStatus === "sending"}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {resendStatus === "sending" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {resendStatus === "sending" ? "Sending..." : resendStatus === "error" ? "Failed — Retry" : "Resend Verification Email"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#64748B]">
                <Globe className="w-3.5 h-3.5" />
                <span>Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#F5F7FA] border border-[#E2E8F0] text-[#102A43] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#1769D2] cursor-pointer"
              >
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
                <option value="Spanish">Español</option>
              </select>
            </div>

            {/* Profile Visibility Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#64748B]">
                {isPublic ? (
                  <Eye className="w-3.5 h-3.5 text-[#1769D2]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-[#64748B]" />
                )}
                <span>Leaderboard Visibility</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  isPublic ? "bg-[#1769D2] justify-end" : "bg-gray-300 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-5 border-t border-[#E2E8F0] flex flex-col gap-2.5 bg-[#F5F7FA]">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#EAF3FF] hover:bg-[#d9eaff] text-[#1769D2] border border-[#BFDBFE] font-bold text-xs transition-colors"
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
