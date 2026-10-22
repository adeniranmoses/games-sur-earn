import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, Database } from "lucide-react";

export const metadata = {
  title: "Privacy Policy – RewardPlatform",
  description: "Learn how RewardPlatform collects, safeguards, and handles your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#07090E]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Privacy &amp; Data</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-14 flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Updated: January 1, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            At RewardPlatform, we value your privacy and are committed to protecting your personal information. 
            This Privacy Policy explains what data we collect, why we collect it, and how we keep it safe under 
            applicable data protection frameworks, including the Nigeria Data Protection Regulation (NDPR) and GDPR.
          </p>
        </div>

        <div className="flex flex-col gap-8 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">1.</span> Information We Collect
            </h2>
            <p>
              When you use our services, we collect limited personal data strictly necessary to operate:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-400 pl-2">
              <li><strong>Account Credentials:</strong> Name, email address, country code, and securely hashed passwords.</li>
              <li><strong>Payout Information:</strong> Recipient email (for gift cards) or cryptocurrency public address.</li>
              <li><strong>Technical &amp; Device Data:</strong> IP address, browser type, device operating system, and timestamp logs for fraud prevention.</li>
              <li><strong>Transaction Data:</strong> Offer completions, ledger coin balances, streak records, and redemption histories.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">2.</span> How We Use Your Data
            </h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-400 pl-2">
              <li>Maintain and authenticate your account sessions.</li>
              <li>Match eligible earning opportunities, surveys, and game offers based on your geographic location.</li>
              <li>Process and deliver your digital gift cards and cryptocurrency withdrawals.</li>
              <li>Detect and prevent botting, multi-accounting, VPN proxy spoofing, and callback forgery.</li>
              <li>Comply with legitimate legal and regulatory obligations.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">3.</span> Third-Party Offerwall &amp; Survey Networks
            </h2>
            <p>
              When you choose to engage with third-party offerwalls (e.g., BitLabs, CPX Research, Torox), 
              we pass an obfuscated unique user identifier (e.g. your internal user ID) to allow the provider 
              to track completions and post back your reward.
            </p>
            <p>
              Any demographic survey responses you provide inside third-party surveys are governed directly 
              by the respective provider&apos;s privacy policies. We do not sell your personal data to advertisers.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">4.</span> Data Security &amp; Retention
            </h2>
            <p>
              All passwords are encrypted using high-factor bcrypt hashing. Sensitive financial and session tokens 
              are transmitted exclusively over encrypted SSL/TLS connections. 
              We retain account data as long as your account remains active or as needed to resolve disputes and audit ledger transactions.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">5.</span> Your Privacy Rights
            </h2>
            <p>
              Depending on your location, you have rights to access, rectify, or request deletion of your personal data. 
              To submit a data access or deletion request, contact our privacy officer through our support desk.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} RewardPlatform. All rights reserved. | <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
