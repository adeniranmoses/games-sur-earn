"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Gamepad2, 
  ClipboardCheck, 
  Gift, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Coins, 
  CheckCircle2, 
  Smartphone,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import Silk from "@/components/Silk";

const STATS = [
  { label: "Active Earners", value: "142,000+", icon: Users, change: "+12% this week" },
  { label: "Average Daily Cashout", value: "$18.40", icon: TrendingUp, change: "Per active user" },
  { label: "Total Rewards Paid", value: "$1,850,000+", icon: Coins, change: "100% verified" },
  { label: "Avg. Cashout Time", value: "< 5 Mins", icon: Zap, change: "Crypto & Gift Cards" },
];

const EARN_CHANNELS = [
  {
    icon: Gamepad2,
    title: "Mobile & PC Games",
    badge: "Highest Earnings",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Install selected mobile games, complete level milestones, and earn up to $75+ per game.",
    payoutExample: "Earn up to $120.00 / offer",
    imageSrc: "/earn-games.jpg",
    borderColor: "group-hover:border-emerald-500/40",
    glowColor: "group-hover:shadow-emerald-500/10",
  },
  {
    icon: ClipboardCheck,
    title: "Demographic Surveys",
    badge: "Fast & Daily",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    description: "Answer short 5–15 minute surveys matched directly to your age, interests, and region.",
    payoutExample: "$0.50 – $4.00 per survey",
    imageSrc: "/earn-surveys.jpg",
    borderColor: "group-hover:border-indigo-500/40",
    glowColor: "group-hover:shadow-indigo-500/10",
  },
  {
    icon: Smartphone,
    title: "App Testing & Trials",
    badge: "Quick Credit",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "Test innovative new fintech, entertainment, and utility apps on Android, iOS, or Desktop.",
    payoutExample: "$1.00 – $15.00 per app",
    imageSrc: "/earn-apps.jpg",
    borderColor: "group-hover:border-amber-500/40",
    glowColor: "group-hover:shadow-amber-500/10",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Pick an Opportunity",
    description: "Browse hundreds of offers: casual mobile games, rapid surveys, or testing new mobile apps. Choose what fits your time.",
    imageSrc: "/step-1-pick.jpg",
    numberBg: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
    glowColor: "hover:shadow-indigo-500/20",
    borderColor: "border-white/10 hover:border-indigo-500/50",
    tag: "Step 01",
    tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    step: 2,
    title: "Complete & Earn Coins",
    description: "Follow the clear task requirements. Once completed, our partner networks verify and instantly credit coins to your wallet.",
    imageSrc: "/step-2-earn.jpg",
    numberBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    glowColor: "hover:shadow-emerald-500/20",
    borderColor: "border-white/10 hover:border-emerald-500/50",
    tag: "Step 02",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    step: 3,
    title: "Cashout Instantly",
    description: "Exchange your coins for digital gift cards (Amazon, Apple, Google Play) or direct cryptocurrency withdrawals starting at just $1.00.",
    imageSrc: "/step-3-cashout.jpg",
    numberBg: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    glowColor: "hover:shadow-purple-500/20",
    borderColor: "border-white/10 hover:border-purple-500/50",
    tag: "Step 03",
    tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
];

const PAYOUT_METHODS = [
  {
    name: "Amazon Gift Card",
    logo: "Amazon",
    min: "$5.00",
    tag: "Digital Code",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    imageSrc: "/amazon-card.jpg",
  },
  {
    name: "Apple Gift Card",
    logo: "Apple",
    min: "$5.00",
    tag: "Instant Email",
    tagColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    imageSrc: "/apple-card.jpg",
  },
  {
    name: "Google Play",
    logo: "Google Play",
    min: "$10.00",
    tag: "Store Credit",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    imageSrc: "/google-play-card.jpg",
  },
  {
    name: "Litecoin (LTC)",
    logo: "Litecoin",
    min: "$1.00",
    tag: "Ultra Low Fee",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    imageSrc: "/litecoin-card.jpg",
  },
  {
    name: "Tether (USDT)",
    logo: "Tether",
    min: "$5.00",
    tag: "TRC-20 / Web3",
    tagColor: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    imageSrc: "/tether-card.jpg",
  },
];

const FAQS = [
  {
    q: "Is joining and earning completely free?",
    a: "Yes, 100% free. You will never be asked to pay any membership fees to join or withdraw your earnings. You earn real money by completing tasks provided by our verified global partners.",
  },
  {
    q: "How does the coin system work?",
    a: "Our accounting system uses integer coins for total transparency: 1,000 Coins = $1.00 USD. For example, a task paying 5,000 Coins equals a $5.00 USD reward.",
  },
  {
    q: "How fast do I get paid?",
    a: "Once you submit a redemption request, verified gift cards and cryptocurrency payouts are processed rapidly—most completed within 5 to 60 minutes after quick automated security review.",
  },
  {
    q: "Can I use a VPN or multiple accounts?",
    a: "No. To maintain fairness with our offerwall partners and prevent fraud, VPNs, proxies, and multiple accounts per individual are strictly prohibited and will result in automated account restriction.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen bg-[#07090E] text-white overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Silk />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-white/5 bg-[#07090E]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center">
                <Coins className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                RewardPlatform
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase font-bold">
                  Global
                </span>
              </span>
              <span className="text-[11px] text-zinc-400">Earn. Play. Cashout.</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#ways-to-earn" className="hover:text-white transition-colors">Ways to Earn</a>
            <a href="#payouts" className="hover:text-white transition-colors">Rewards &amp; Payouts</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col">
        {/* ── HERO SECTION ── */}
        <section className="pt-20 pb-24 px-6 text-center max-w-5xl mx-auto flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Over $1,850,000 paid out</span>
            <span className="text-zinc-600">•</span>
            <span className="text-indigo-400 font-bold">1,000 Coins = $1.00 USD</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            Get Paid Real Cash For <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Gaming &amp; Sharing Opinions
            </span>
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
            Join thousands of active users worldwide completing mobile game milestones, surveys, and app trials.
            Withdraw instantly to Amazon Gift Cards, Apple, or Cryptocurrency.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5"
            >
              <span>Create Free Account &amp; Earn</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-sm transition-all"
            >
              Sign In to Your Dashboard
            </Link>
          </div>

          {/* Trust Guarantee Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Membership Fees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Low $1.00 Minimum Cashout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Worldwide Supported</span>
            </div>
          </div>
        </section>

        {/* ── STATS SECTION ── */}
        <section className="px-6 pb-20 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-zinc-900/40 border border-white/10 backdrop-blur-md flex flex-col gap-2 relative overflow-hidden group hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400">{stat.label}</span>
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{stat.value}</div>
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span>{stat.change}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Simple 3-Step Process</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">How RewardPlatform Works</h2>
            <p className="text-sm text-zinc-400">Start earning within 2 minutes of registration. No complicated requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className={`group rounded-3xl bg-zinc-900/40 border ${item.borderColor} overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${item.glowColor}`}
              >
                {/* Visual Artwork Banner */}
                <div className="relative w-full aspect-[16/10] bg-black/60 overflow-hidden">
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                  {/* Top badging on image */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl border backdrop-blur-md flex items-center justify-center font-black text-sm shadow-lg ${item.numberBg}`}>
                      {item.step}
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border backdrop-blur-md uppercase tracking-wider ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WAYS TO EARN ── */}
        <section id="ways-to-earn" className="py-20 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Multiple Revenue Streams</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Ways to Earn on the Platform</h2>
            <p className="text-sm text-zinc-400">Legitimate monetization supported by leading market research and gaming networks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EARN_CHANNELS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`group rounded-3xl bg-zinc-900/40 border border-white/10 ${item.borderColor} overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${item.glowColor}`}
                >
                  {/* Visual Artwork Banner */}
                  <div className="relative w-full aspect-[16/10] bg-black/60 overflow-hidden">
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    
                    {/* Top badging on image */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border backdrop-blur-md ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col justify-between flex-1 gap-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Typical Reward:</span>
                      <span className="font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {item.payoutExample}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── PAYOUTS / REWARDS SECTION ── */}
        <section id="payouts" className="py-20 px-6 max-w-7xl mx-auto w-full">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-zinc-900/80 to-zinc-950 border border-white/10 relative overflow-hidden flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-xl">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Global Redemptions</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white">Cash Out Your Balance Easily</h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  We maintain strict liquidity and reserves so you never have to wait weeks for your payout. 
                  Low minimum thresholds ensure you can test your first cashout quickly.
                </p>
              </div>
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 transition-colors shrink-0"
              >
                Browse All Payout Options
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {PAYOUT_METHODS.map((p, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-white/25 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  {/* Card Art Banner */}
                  <div className="relative w-full aspect-[16/10] bg-black/60 overflow-hidden">
                    <Image
                      src={p.imageSrc}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    <span
                      className={`absolute top-2.5 left-2.5 text-[9px] font-black px-2 py-0.5 rounded-full border backdrop-blur-md uppercase tracking-wider ${p.tagColor}`}
                    >
                      {p.tag}
                    </span>
                  </div>

                  {/* Card Details */}
                  <div className="p-4 flex flex-col justify-between flex-1 gap-3 bg-zinc-900/40">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm text-white group-hover:text-indigo-300 transition-colors">
                        {p.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/5">
                      <span className="text-zinc-500 font-medium">Starts at</span>
                      <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {p.min}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section id="faq" className="py-20 px-6 max-w-4xl mx-auto w-full flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Transparency First</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Frequently Asked Questions</h2>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-zinc-900/40 border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-indigo-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-indigo-400" : "text-zinc-500"}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-16 px-6 max-w-7xl mx-auto w-full">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-emerald-900/40 border border-indigo-500/30 text-center flex flex-col items-center gap-6 relative overflow-hidden">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Start Earning Today?
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Create your account in less than 60 seconds and complete your first survey or mobile game milestone now.
            </p>
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm shadow-2xl transition-all flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#05060A] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white">RewardPlatform</span>
            <span className="text-zinc-600">|</span>
            <span>Global Rewards &amp; GPT Infrastructure</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>

          <div className="text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} RewardPlatform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
