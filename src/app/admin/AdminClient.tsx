"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  Clock,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowUpRight,
  UserCheck,
  UserX,
  PlusCircle,
  MinusCircle,
  Eye,
  Check,
  X
} from "lucide-react";

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  countryCode: string;
  accountStatus: string;
  riskScore: number;
  referralCode: string;
  createdAt: string;
  wallet: {
    availableCoins: number;
    pendingCoins: number;
    reservedCoins: number;
    lifetimeEarnedCoins: number;
  } | null;
  redemptionsCount: number;
  referralsCount: number;
}

interface RedemptionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCountry: string;
  userRiskScore: number;
  coinsSpent: number;
  displayCurrency: string;
  rewardValue: number;
  payoutMethod: string;
  payoutAddress: string;
  status: string;
  adminNotes: string | null;
  providerTxId: string | null;
  productTitle: string | null;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  adminEmail: string | null;
  details: string | null;
  createdAt: string;
}

interface AdminClientProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    totalAvailableCoins: number;
    totalReservedCoins: number;
    pendingRedemptionsCount: number;
    pendingRedemptionsCoins: number;
  };
  initialRedemptions: RedemptionItem[];
  initialUsers: UserSummary[];
  initialAuditLogs: AuditLogItem[];
}

export default function AdminClient({
  stats,
  initialRedemptions,
  initialUsers,
  initialAuditLogs,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "REDEMPTIONS" | "USERS" | "AUDIT">("OVERVIEW");
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>(initialRedemptions);
  const [users, setUsers] = useState<UserSummary[]>(initialUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);

  // Redemptions tab state
  const [redemptionFilter, setRedemptionFilter] = useState<string>("ALL");
  const [redemptionSearch, setRedemptionSearch] = useState("");
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionItem | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [providerTxId, setProviderTxId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Users tab state
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState("");
  const [balanceAdjustReason, setBalanceAdjustReason] = useState("");

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Payout Action (Approve / Reject) ──
  const handleRedemptionAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedRedemption) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/admin/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redemptionId: selectedRedemption.id,
          action,
          adminNotes: actionNotes,
          providerTxId: providerTxId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process request.");

      // Update local state
      setRedemptions((prev) =>
        prev.map((r) =>
          r.id === selectedRedemption.id
            ? {
                ...r,
                status: action === "APPROVE" ? "COMPLETED" : "REFUNDED",
                adminNotes: actionNotes || r.adminNotes,
                providerTxId: providerTxId || r.providerTxId,
              }
            : r
        )
      );

      showFeedback(
        "success",
        `Order ${action === "APPROVE" ? "APPROVED and fulfilled" : "REJECTED and coins refunded to user"}!`
      );
      setSelectedRedemption(null);
      setActionNotes("");
      setProviderTxId("");
    } catch (err: any) {
      showFeedback("error", err.message || "Action failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── User Status Action (Ban / Suspend / Activate) ──
  const handleUserStatusChange = async (targetUserId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          action: "SET_STATUS",
          value: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user status.");

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, accountStatus: newStatus } : u))
      );

      showFeedback("success", `User status changed to ${newStatus}.`);
    } catch (err: any) {
      showFeedback("error", err.message || "Status change failed.");
    }
  };

  // ── User Balance Adjustment (Credit / Debit) ──
  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceAdjustAmount) return;
    const amount = Number(balanceAdjustAmount);
    if (isNaN(amount) || amount === 0) {
      showFeedback("error", "Enter a valid non-zero coin amount.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          action: "ADJUST_BALANCE",
          value: amount,
          reason: balanceAdjustReason || "Manual administrative adjustment",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to adjust balance.");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id && u.wallet
            ? {
                ...u,
                wallet: {
                  ...u.wallet,
                  availableCoins: data.newBalance,
                },
              }
            : u
        )
      );

      showFeedback("success", `Adjusted balance by ${amount > 0 ? "+" : ""}${amount} coins!`);
      setSelectedUser(null);
      setBalanceAdjustAmount("");
      setBalanceAdjustReason("");
    } catch (err: any) {
      showFeedback("error", err.message || "Balance adjustment failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRedemptions = redemptions
    .filter((r) => redemptionFilter === "ALL" || r.status === redemptionFilter)
    .filter((r) => {
      if (!redemptionSearch.trim()) return true;
      const q = redemptionSearch.toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.payoutAddress.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.referralCode.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0A0C10] text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* ── Top Admin Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-[#0F1117]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-white tracking-tight">Admin Operations Suite</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Staff Only
              </span>
            </div>
            <p className="text-xs text-zinc-400">Ledger audit, payout approvals, and fraud surveillance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>User Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Notification Feedback Toast ── */}
      {feedback && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top-4 ${
            feedback.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-300 border-rose-500/40"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          {[
            { id: "OVERVIEW", label: "Overview & Stats", icon: Wallet },
            { id: "REDEMPTIONS", label: "Redemptions Queue", icon: Clock, badge: stats.pendingRedemptionsCount },
            { id: "USERS", label: "User Directory", icon: Users },
            { id: "AUDIT", label: "Security Audit Logs", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* ═══════════════════════════════════════════════
            TAB 1: OVERVIEW & STATS
           ═══════════════════════════════════════════════ */}
        {activeTab === "OVERVIEW" && (
          <div className="flex flex-col gap-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Users */}
              <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Registered Users</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white">{stats.totalUsers}</span>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span className="text-emerald-400 font-bold">{stats.activeUsers} active</span>
                    <span>•</span>
                    <span className="text-rose-400 font-bold">{stats.bannedUsers} banned</span>
                  </div>
                </div>
              </div>

              {/* Coins in Circulation */}
              <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Available Circulation</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-emerald-400">
                    {stats.totalAvailableCoins.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400 block mt-1">
                    ≈ ${(stats.totalAvailableCoins / 1000).toFixed(2)} USD in user hands
                  </span>
                </div>
              </div>

              {/* Reserved Coins Hold */}
              <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">Pending Reserve Holds</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-amber-400">
                    {stats.totalReservedCoins.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400 block mt-1">
                    ≈ ${(stats.totalReservedCoins / 1000).toFixed(2)} USD locked in pending payouts
                  </span>
                </div>
              </div>

              {/* Pending Cashouts Queue */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase">Pending Cashout Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-white">
                    {stats.pendingRedemptionsCount}
                  </span>
                  <button
                    onClick={() => setActiveTab("REDEMPTIONS")}
                    className="text-xs text-indigo-300 hover:text-white font-bold mt-1 flex items-center gap-1 transition-colors"
                  >
                    <span>Process orders now</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Quick Action & System Health Card */}
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-white">System Integrity & Accounting Rule</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Every coin movement is protected by an atomic PostgreSQL transaction. 1,000 Coins are pegged to $1.00 USD. Rejecting a withdrawal immediately refunds the locked reserved coins back to the user’s available balance without manual math.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveTab("REDEMPTIONS")}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20"
                >
                  Review Pending Queue ({stats.pendingRedemptionsCount})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB 2: REDEMPTIONS QUEUE
           ═══════════════════════════════════════════════ */}
        {activeTab === "REDEMPTIONS" && (
          <div className="flex flex-col gap-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {["ALL", "PENDING", "COMPLETED", "REFUNDED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setRedemptionFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      redemptionFilter === st
                        ? "bg-white text-zinc-950 shadow"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user, email, or address..."
                  value={redemptionSearch}
                  onChange={(e) => setRedemptionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Redemptions Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-zinc-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Reward / Method</th>
                    <th className="py-3.5 px-4">Coins / Value</th>
                    <th className="py-3.5 px-4">Payout Destination</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {filteredRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No redemptions match current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRedemptions.map((r) => {
                      const isPending = r.status === "PENDING";
                      const isCompleted = r.status === "COMPLETED";
                      const isRefunded = r.status === "REFUNDED";

                      return (
                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{r.userName}</div>
                            <div className="text-[11px] text-zinc-500">{r.userEmail}</div>
                            <div className="text-[10px] text-zinc-400">Risk: {r.userRiskScore}/100 · {r.userCountry}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-white">{r.productTitle || r.payoutMethod}</span>
                            <span className="block text-[11px] text-zinc-500">{r.payoutMethod}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-black text-emerald-400">
                              {r.coinsSpent.toLocaleString()} Coins
                            </span>
                            <span className="block text-[11px] text-zinc-400">
                              ${r.rewardValue.toFixed(2)} {r.displayCurrency}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className="font-mono text-[11px] text-zinc-200 block truncate" title={r.payoutAddress}>
                              {r.payoutAddress}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isCompleted
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : isRefunded
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <button
                                onClick={() => {
                                  setSelectedRedemption(r);
                                  setActionNotes("");
                                  setProviderTxId("");
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-sm"
                              >
                                Review
                              </button>
                            ) : (
                              <span className="text-[11px] text-zinc-500">Archived</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Payout Review Modal */}
            {selectedRedemption && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="relative w-full max-w-lg p-6 rounded-3xl bg-[#12151D] border border-white/15 shadow-2xl flex flex-col gap-5 text-white">
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Payout Order #{selectedRedemption.id.slice(-6)}
                      </span>
                      <h3 className="text-lg font-bold mt-1">Review Redemption Request</h3>
                    </div>
                    <button
                      onClick={() => setSelectedRedemption(null)}
                      className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Recipient User:</span>
                      <strong className="text-white">{selectedRedemption.userName} ({selectedRedemption.userEmail})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Payout Face Value:</span>
                      <strong className="text-emerald-400">${selectedRedemption.rewardValue.toFixed(2)} {selectedRedemption.displayCurrency} ({selectedRedemption.coinsSpent.toLocaleString()} Coins)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Method:</span>
                      <strong className="text-white">{selectedRedemption.payoutMethod}</strong>
                    </div>
                    <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                      <span className="text-zinc-400">Destination Address / Email:</span>
                      <div className="p-2 rounded-xl bg-black/50 font-mono text-[11px] text-amber-300 break-all select-all">
                        {selectedRedemption.payoutAddress}
                      </div>
                    </div>
                  </div>

                  {/* Optional Transaction ID / Notes Inputs */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-zinc-300">
                        Provider Order ID / Crypto Tx Hash (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0xabc... or Tremendous Order ID"
                        value={providerTxId}
                        onChange={(e) => setProviderTxId(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-zinc-300">
                        Internal Notes / Rejection Reason
                      </label>
                      <input
                        type="text"
                        placeholder="Notes or reason sent to ledger"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleRedemptionAction("REJECT")}
                      className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white font-bold text-xs transition-all disabled:opacity-50"
                    >
                      Reject &amp; Refund Coins
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRedemption(null)}
                        className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={() => handleRedemptionAction("APPROVE")}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                      >
                        {isProcessing ? "Processing..." : "Approve & Mark Paid"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB 3: USER DIRECTORY & MODERATION
           ═══════════════════════════════════════════════ */}
        {activeTab === "USERS" && (
          <div className="flex flex-col gap-6">
            {/* Search */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user name, email, or referral code..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-zinc-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Available Coins</th>
                    <th className="py-3.5 px-4">Reserved Coins</th>
                    <th className="py-3.5 px-4">Referrals</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Risk</th>
                    <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No users match query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isBanned = u.accountStatus === "BANNED";
                      const isSuspended = u.accountStatus === "SUSPENDED";

                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.role === "ADMIN" && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500">{u.email}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">@{u.referralCode} · {u.countryCode}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-black text-emerald-400">
                              {u.wallet?.availableCoins.toLocaleString() ?? 0}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              ≈ ${((u.wallet?.availableCoins ?? 0) / 1000).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-amber-400">
                              {u.wallet?.reservedCoins.toLocaleString() ?? 0}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400">
                            {u.referralsCount} users
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isBanned
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : isSuspended
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-bold ${
                                u.riskScore > 60
                                  ? "text-rose-400"
                                  : u.riskScore > 30
                                  ? "text-amber-400"
                                  : "text-zinc-400"
                              }`}
                            >
                              {u.riskScore}/100
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Adjust balance modal trigger */}
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                                title="Adjust coin balance"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>

                              {/* Ban / Unban quick buttons */}
                              {isBanned ? (
                                <button
                                  onClick={() => handleUserStatusChange(u.id, "ACTIVE")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white font-bold text-[11px] transition-colors"
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserStatusChange(u.id, "BANNED")}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white font-bold text-[11px] transition-colors"
                                >
                                  Ban
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Adjust User Balance Modal */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#12151D] border border-white/15 shadow-2xl flex flex-col gap-5 text-white">
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-base font-bold">Adjust Coins Ledger</h3>
                      <p className="text-xs text-zinc-400">Target: {selectedUser.name} ({selectedUser.email})</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs flex justify-between">
                    <span className="text-zinc-400">Current Balance:</span>
                    <strong className="text-emerald-400">{selectedUser.wallet?.availableCoins.toLocaleString()} Coins</strong>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-zinc-300">
                        Coins Amount (+ to credit, - to debit)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5000 or -1000"
                        value={balanceAdjustAmount}
                        onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-zinc-300">
                        Audit Log Reason
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Promotional loyalty bonus or dispute correction"
                        value={balanceAdjustReason}
                        onChange={(e) => setBalanceAdjustReason(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={handleAdjustBalance}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50"
                    >
                      {isProcessing ? "Updating..." : "Confirm Ledger Adjustment"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB 4: SECURITY & AUDIT LOGS
           ═══════════════════════════════════════════════ */}
        {activeTab === "AUDIT" && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-base text-white">System Security &amp; Audit Trail</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Immutable records of administrative balance updates, payout fulfillments, and user moderation actions.
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-zinc-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Admin Actor</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {log.adminEmail || "System Automation"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 max-w-md truncate" title={log.details || ""}>
                          {log.details || "—"}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-500 text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
