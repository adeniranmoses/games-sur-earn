"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Silk from "@/components/Silk";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Reset token is missing from the URL. Please use the link sent to your email.");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Password updated successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/80 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-2xl font-black">
          ✕
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Invalid Reset Link</h1>
        <p className="text-xs text-zinc-400">
          No password reset token was detected in your link. Please request a new link from the forgot password page.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 py-2.5 px-6 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs transition-colors"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/80 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/20 text-white">
          🔑
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Create New Password</h1>
        <p className="text-xs text-zinc-400">
          Set a strong, new password for your RewardPlatform account.
        </p>
      </div>

      {status === "success" ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
            ✓
          </div>
          <span className="text-emerald-400 text-sm font-semibold">{message}</span>
          <p className="text-xs text-zinc-400">Redirecting you to the sign-in page in a few seconds...</p>
          <Link
            href="/login"
            className="mt-2 py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            Sign In Now →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {status === "error" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-300">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-300">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Silk>
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30 font-sans">
        <Suspense fallback={<div className="text-zinc-500 text-sm">Loading reset form...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </Silk>
  );
}
