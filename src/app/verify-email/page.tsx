"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Silk from "@/components/Silk";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");
  const emailParam = searchParams?.get("email");
  const isUnverifiedRedirect = searchParams?.get("unverified") === "true";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "resend_mode">("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(emailParam || "");
  const [resendStatus, setResendStatus] = useState<"idle" | "submitting" | "sent" | "failed">("idle");
  const [resendMsg, setResendMsg] = useState("");
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  useEffect(() => {
    // User was redirected from login because their email is not verified
    if (isUnverifiedRedirect && !token) {
      setStatus("resend_mode");
      setMessage("You need to verify your email before signing in. Enter your email below to receive a new verification link.");
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided. Please check the link in your email.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "This verification link is invalid or has expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Connection error. Please try again.");
      }
    };

    verify();
  }, [token, isUnverifiedRedirect]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendStatus("submitting");
    setDevVerifyUrl(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendStatus("sent");
      setResendMsg(data.message || "Verification email sent! Check your inbox.");
      if (data.devVerifyUrl) {
        setDevVerifyUrl(data.devVerifyUrl);
      }
    } catch {
      setResendStatus("failed");
      setResendMsg("Failed to send verification email. Please try again.");
    }
  };


  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/80 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center py-6 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <h2 className="text-xl font-bold text-white tracking-tight">Verifying your email...</h2>
          <p className="text-xs text-zinc-400">Securing your account and activating rewards access.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center py-4 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl text-emerald-400 shadow-lg shadow-emerald-500/20">
            ✓
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Email Verified!</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
          <div className="w-full pt-4">
            <Link
              href="/login"
              className="w-full inline-block py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
            >
              Sign In to Your Account →
            </Link>
          </div>
        </div>
      )}

      {/* Shown when user tries to log in without verifying */}
      {status === "resend_mode" && (
        <div className="flex flex-col items-center py-4 gap-4 w-full">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400">
            ✉️
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{message}</p>

          <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-left flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-200">Send a new verification link:</p>
            {resendStatus !== "sent" ? (
              <form onSubmit={handleResend} className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Enter your account email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950/70 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={resendStatus === "submitting"}
                  className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                >
                  {resendStatus === "submitting" ? "Sending..." : "Send Verification Link"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-emerald-400 text-xs">✓ {resendMsg}</p>
                {devVerifyUrl && (
                  <a
                    href={devVerifyUrl}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition-colors"
                  >
                    🔗 Click here to verify your email (sandbox)
                  </a>
                )}
              </div>
            )}
          </div>
          <Link href="/login" className="text-xs text-zinc-400 hover:text-white transition-colors mt-1">
            ← Back to Sign In
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center py-4 gap-4 w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-2xl text-rose-400">
            ✕
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Verification Failed</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{message}</p>

          {/* Resend box */}
          <div className="w-full mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left flex flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-200">Need a fresh verification link?</p>
            {resendStatus !== "sent" ? (
              <form onSubmit={handleResend} className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Enter your account email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950/70 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={resendStatus === "submitting"}
                  className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                >
                  {resendStatus === "submitting" ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <p className={`text-[11px] ${resendStatus === "sent" ? "text-emerald-400" : "text-rose-400"}`}>
                  {resendMsg}
                </p>
                {devVerifyUrl && (
                  <a
                    href={devVerifyUrl}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition-colors"
                  >
                    🔗 Click here to verify your email (sandbox)
                  </a>
                )}
              </div>
            )}
          </div>

          <Link href="/login" className="text-xs text-zinc-400 hover:text-white transition-colors mt-2">
            Back to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Silk>
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30 font-sans">
        <Suspense fallback={<div className="text-zinc-500 text-sm">Loading verification...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </Silk>
  );
}
