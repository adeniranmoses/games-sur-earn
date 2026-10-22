import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, AlertTriangle, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service – RewardPlatform",
  description: "Terms and conditions for earning and redeeming rewards on RewardPlatform.",
};

export default function TermsPage() {
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
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Legal Document</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-14 flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold w-fit">
            <Scale className="w-3.5 h-3.5" />
            <span>Effective Date: January 1, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Please read these Terms of Service carefully before creating an account or using RewardPlatform.
            By registering, accessing, or earning rewards on the platform, you agree to be bound by these terms.
          </p>
        </div>

        <div className="flex flex-col gap-8 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono">1.</span> Eligibility &amp; Account Creation
            </h2>
            <p>
              You must be at least 13 years of age (or 16 years of age in the European Economic Area) to register. 
              By creating an account, you represent that all information you submit is accurate, truthful, and up-to-date.
            </p>
            <p>
              <strong>Strict Limit: Exactly One (1) Account Per Individual.</strong> Creating multiple accounts, 
              farming accounts, or managing multiple accounts on behalf of others is strictly forbidden. 
              Duplicate accounts will be permanently banned, and accrued balances will be forfeited.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono">2.</span> Anti-Fraud, VPN, &amp; Proxy Prohibitions
            </h2>
            <p>
              To protect our advertisers and survey research partners, the following activities are strictly prohibited:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-400 pl-2">
              <li>Connecting via VPNs, Tor, residential proxies, datacenter proxies, or IP obfuscation tools.</li>
              <li>Automated bots, scripts, clickers, or emulators pretending to be physical devices.</li>
              <li>Providing false demographic information to qualify for market research surveys.</li>
              <li>Tampering with client-side code, cookies, or attempting to spoof postback callbacks.</li>
            </ul>
            <p className="text-amber-300 font-semibold text-xs pt-1">
              ⚠️ Violations trigger automated security flags, risk score escalation, and account suspension without prior notice.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono">3.</span> Reward Accounting &amp; Coin Value
            </h2>
            <p>
              RewardPlatform operates an internal accounting coin system where:
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono font-bold text-emerald-400 text-center text-sm">
              1,000 Coins = $1.00 USD
            </div>
            <p>
              Coins do not constitute legal tender or property outside the platform. Coins hold no cash value until an 
              eligible user successfully submits and completes a verified redemption request according to these terms.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono">4.</span> Offer Completions &amp; Provider Reversals
            </h2>
            <p>
              Offers, surveys, and app trials are supplied by independent third-party networks (e.g. BitLabs, CPX Research, Torox). 
              Crediting occurs only upon receipt of an authenticated postback signature from the network.
            </p>
            <p>
              <strong>Chargebacks &amp; Reversals:</strong> If an offer provider invalidates a completion due to 
              uninstallation, fraud, or chargeback, RewardPlatform reserves the right to deduct the corresponding coin value 
              from the user&apos;s ledger.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono">5.</span> Redemptions &amp; Payout Terms
            </h2>
            <p>
              Users may redeem eligible available coins for digital gift cards or cryptocurrency. 
              Each redemption is subjected to automated risk scoring and administrative fraud audit.
            </p>
            <p>
              You are solely responsible for providing an accurate destination email or crypto wallet address. 
              Transactions dispatched to incorrect recipient addresses provided by the user cannot be cancelled or refunded.
            </p>
          </section>

          {/* Section 6 */}
          <section className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono">6.</span> Governing Law
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, 
              without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} RewardPlatform. All rights reserved. | <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
