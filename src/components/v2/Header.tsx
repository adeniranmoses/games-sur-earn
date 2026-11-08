"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, Ticket, Sparkles, LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import ProfileDrawer from "@/components/gpt/ProfileDrawer";
import { UserProfileData } from "@/types/gpt";

export interface HeaderUser {
  name?: string | null;
  email?: string | null;
  availableCoins: number;
  tickets?: number;
  avatarUrl?: string | null;
}

interface HeaderProps {
  user: HeaderUser;
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export function Header({ user }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [coins, setCoins] = useState<number>(user.availableCoins || 0);
  const [tickets, setTickets] = useState<number>(user.tickets ?? 0);
  const [prevProps, setPrevProps] = useState({ coins: user.availableCoins, tickets: user.tickets });
  const [isCoinPulsing, setIsCoinPulsing] = useState(false);
  const [isTicketPulsing, setIsTicketPulsing] = useState(false);

  // Sync state with props during render to avoid cascading effect renders
  if (prevProps.coins !== user.availableCoins || prevProps.tickets !== user.tickets) {
    setPrevProps({ coins: user.availableCoins, tickets: user.tickets });
    setCoins(user.availableCoins || 0);
    setTickets(user.tickets ?? 0);
  }

  // Listen for real-time balance updates dispatched across modules
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        newCoins?: number;
        coinsDelta?: number;
        newTickets?: number;
        ticketsDelta?: number;
      }>;
      if (customEvent?.detail) {
        if (typeof customEvent.detail.newCoins === "number") {
          setCoins(customEvent.detail.newCoins);
          setIsCoinPulsing(true);
          setTimeout(() => setIsCoinPulsing(false), 1500);
        } else if (typeof customEvent.detail.coinsDelta === "number") {
          setCoins((prev) => prev + (customEvent.detail.coinsDelta ?? 0));
          setIsCoinPulsing(true);
          setTimeout(() => setIsCoinPulsing(false), 1500);
        }

        if (typeof customEvent.detail.newTickets === "number") {
          setTickets(customEvent.detail.newTickets);
          setIsTicketPulsing(true);
          setTimeout(() => setIsTicketPulsing(false), 1500);
        } else if (typeof customEvent.detail.ticketsDelta === "number") {
          setTickets((prev) => prev + (customEvent.detail.ticketsDelta ?? 0));
          setIsTicketPulsing(true);
          setTimeout(() => setIsTicketPulsing(false), 1500);
        }
      }
    };

    window.addEventListener("balance-updated", handleUpdate);
    return () => window.removeEventListener("balance-updated", handleUpdate);
  }, []);

  const usdValue = ((coins || 0) / 1000).toFixed(2);

  const handleOpenProfile = async () => {
    setIsProfileOpen(true);
    if (!profileData && !isLoadingProfile) {
      setIsLoadingProfile(true);
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.user) {
          setProfileData(data.user);
        }
      } catch (err) {
        console.error("Failed to load profile in header:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          {/* Brand / Logo (Always goes to Dashboard) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1769D2] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#102A43] block leading-tight">
                GamesSurEarn
              </span>
              <span className="text-[11px] font-semibold text-[#1769D2] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Rewards Live
              </span>
            </div>
          </Link>

          {/* Currency & Balance Pills */}
          <div className="flex items-center gap-2">
            {/* Coins / USD Pill */}
            <Link
              href="/withdraw"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                isCoinPulsing
                  ? "bg-amber-100 border-2 border-amber-500 scale-105 shadow-md shadow-amber-500/20"
                  : "bg-[#EAF3FF] hover:bg-[#d9eaff] border border-[#BFDBFE]"
              }`}
              title="Click to withdraw"
            >
              <div className={`w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-xs transition-transform ${isCoinPulsing ? "animate-bounce" : ""}`}>
                <Coins className="w-3.5 h-3.5 text-amber-950" />
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-xs font-bold leading-none transition-colors ${isCoinPulsing ? "text-amber-900" : "text-[#102A43]"}`}>
                  {(coins || 0).toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-[#1769D2] leading-none mt-0.5">
                  ${usdValue}
                </span>
              </div>
            </Link>

            {/* Tickets Pill */}
            <Link
              href="/quests"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                isTicketPulsing
                  ? "bg-indigo-100 border-2 border-indigo-500 scale-105 shadow-md shadow-indigo-500/20"
                  : "bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0]"
              }`}
              title="View Quests & Raffles"
            >
              <Ticket className={`w-3.5 h-3.5 transition-colors ${isTicketPulsing ? "text-indigo-600 animate-pulse" : "text-[#1769D2]"}`} />
              <span className={`text-xs font-bold ${isTicketPulsing ? "text-indigo-900" : "text-[#102A43]"}`}>
                {tickets}
              </span>
            </Link>

            {/* Profile Avatar / Trigger */}
            <button
              onClick={handleOpenProfile}
              className="w-9 h-9 rounded-full bg-[#1769D2] hover:bg-[#1558b0] text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Account Profile"
            >
              {user.name ? user.name.slice(0, 1).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-9 h-9 rounded-full border border-[#E2E8F0] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-[#64748B] transition-all flex items-center justify-center cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Account Profile Drawer */}
      {profileData && (
        <ProfileDrawer
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={profileData}
        />
      )}
    </>
  );
}
