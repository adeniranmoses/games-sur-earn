"use client";

import { useState } from "react";
import { User, Bell, Ticket, ChevronDown } from "lucide-react";
import ProfileDrawer from "./ProfileDrawer";
import { UserProfileData } from "@/types/gpt";

interface PersistentHeaderProps {
  user: UserProfileData;
}

export default function PersistentHeader({ user }: PersistentHeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const cashUsd = (user.availableCoins / 1000).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0F1117]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-500/20 text-lg">
              F
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                FREEREWARDS
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE
                </span>
              </span>
              <span className="text-[11px] text-zinc-400 font-medium -mt-1">
                Global Earning Platform
              </span>
            </div>
          </div>

          {/* Persistent Dual-Currency & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            
            {/* Primary Cash Balance Badge (High-contrast green) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col text-right">
                <span className="text-xs sm:text-sm font-extrabold tracking-tight text-emerald-300">
                  {cashUsd}
                </span>
              </div>
            </div>

            {/* Secondary Token/Ticket Balance Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 shadow-sm shadow-amber-950">
              <Ticket className="w-3.5 h-3.5 text-amber-400 rotate-12" />
              <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                {user.tickets || 0}{" "}
                <span className="hidden md:inline font-semibold text-[11px] text-amber-400/80">
                  Tickets
                </span>
              </span>
            </div>

            {/* Notification Bell with indicator */}
            <button
              onClick={() => setHasUnread(false)}
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0F1117] animate-pulse" />
              )}
            </button>

            {/* User Avatar Button -> Opens Module 2 Drawer */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="group flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-emerald-500/40"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase ring-2 ring-white/10 group-hover:ring-emerald-400 transition-all">
                {user.name ? user.name.slice(0, 2) : "U"}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors max-w-[90px] truncate">
                {user.name?.split(" ")[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
            </button>

          </div>

        </div>
      </header>

      {/* Module 2: Drawer Component */}
      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
      />
    </>
  );
}
