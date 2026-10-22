"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, CheckCircle, Wallet, Gift } from "lucide-react";

export default function FloatingNavigation() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    {
      label: "Earn",
      href: "/earn",
      icon: Flame,
      badge: "HOT",
    },
    {
      label: "My Offers",
      href: "/#my-offers",
      icon: CheckCircle,
    },
    {
      label: "Cashout",
      href: "/withdraw",
      icon: Wallet,
    },
    {
      label: "Rewards",
      href: "/#quests",
      icon: Gift,
      badge: "FREE",
    },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 px-3 py-2 rounded-2xl bg-[#0F1117]/95 border border-white/15 backdrop-blur-xl shadow-2xl shadow-black/80 max-w-md w-full justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-emerald-400 bg-emerald-500/10 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              {item.badge && (
                <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black tracking-tight bg-gradient-to-r from-emerald-500 to-indigo-500 text-white shadow-sm">
                  {item.badge}
                </span>
              )}
              <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : ""}`} />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
