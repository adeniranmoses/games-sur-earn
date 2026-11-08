"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Flame, PlayCircle, Wallet, User } from "lucide-react";
import ProfileDrawer from "@/components/gpt/ProfileDrawer";
import { UserProfileData } from "@/types/gpt";

export type NavTab = "quests" | "earn" | "ads" | "withdraw" | "profile";

interface BottomNavProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  hasClaimableQuest?: boolean;
}

export function BottomNav({
  activeTab: controlledActiveTab,
  onTabChange,
  hasClaimableQuest = true,
}: BottomNavProps) {
  const pathname = usePathname();

  // Profile drawer state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Derive active tab from current route if not explicitly passed
  const activeTab: NavTab =
    controlledActiveTab ||
    (pathname === "/quests"
      ? "quests"
      : pathname === "/earn"
      ? "earn"
      : pathname === "/ads"
      ? "ads"
      : pathname === "/withdraw"
      ? "withdraw"
      : pathname === "/profile"
      ? "profile"
      : "quests");

  // Tab Order: 1. Quests, 2. Earn, 3. Watch Ads, 4. Withdraw, 5. Profile
  const tabs = [
    {
      id: "quests" as NavTab,
      label: "Quests",
      icon: CheckCircle2,
      badge: hasClaimableQuest,
      href: "/quests",
    },
    {
      id: "earn" as NavTab,
      label: "Earn",
      icon: Flame,
      href: "/earn",
    },
    {
      id: "ads" as NavTab,
      label: "Watch Ads",
      icon: PlayCircle,
      href: "/ads",
    },
    {
      id: "withdraw" as NavTab,
      label: "Withdraw",
      icon: Wallet,
      href: "/withdraw",
    },
    {
      id: "profile" as NavTab,
      label: "Profile",
      icon: User,
      href: "/profile",
    },
  ];

  const handleTabClick = async (tab: (typeof tabs)[0], e: React.MouseEvent) => {
    if (onTabChange) {
      onTabChange(tab.id);
    }

    // Open profile drawer instead of navigating when profile tab is tapped
    if (tab.id === "profile") {
      e.preventDefault();
      if (!profileData && !isLoadingProfile) {
        setIsLoadingProfile(true);
        try {
          const res = await fetch("/api/user/profile");
          const data = await res.json();
          if (data.user) setProfileData(data.user);
        } catch {
          // Silently fall back — user will navigate to /profile normally
          return;
        } finally {
          setIsLoadingProfile(false);
        }
      }
      setIsProfileOpen(true);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-lg">
        <div className="max-w-xl mx-auto px-2 h-16 flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={(e) => handleTabClick(tab, e)}
                className={`relative flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                  isTabActive
                    ? "text-[#1769D2]"
                    : "text-[#64748B] hover:text-[#102A43]"
                }`}
                style={{ minHeight: "48px" }}
              >
                {/* Active soft-blue pill indicator background */}
                {isTabActive && (
                  <span className="absolute inset-0 bg-[#EAF3FF] rounded-xl -z-10" />
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      isTabActive ? "stroke-[2.5px] scale-105" : "stroke-[1.8px]"
                    }`}
                  />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-[#1769D2] ring-2 ring-white rounded-full animate-pulse" />
                  )}
                </div>

                <span
                  className={`text-[11px] mt-1 tracking-tight leading-none ${
                    isTabActive ? "font-bold text-[#1769D2]" : "font-medium text-[#64748B]"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile Drawer (opened when profile tab is tapped) */}
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
