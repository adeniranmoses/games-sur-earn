"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Silk from "@/components/Silk";
import { Mail, KeyRound, Lock, CheckCircle2, ArrowRight, Eye, EyeOff, RefreshCw } from "lucide-react";

type Step = "EMAIL" | "CODE" | "PASSWORD" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request 6-digit code to email
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessNotice("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep("CODE");
        if (data.devOtp) {
          setDevOtp(data.devOtp);
          setSuccessNotice(`We've generated a 6-digit verification code.`);
        } else {
          setSuccessNotice(`We've sent a 6-digit verification code to ${email}`);
        }
        setResendCooldown(30); // 30 second cooldown before resend
      } else {
        setErrorMessage(data.message || "Unable to send verification code. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify the 6-digit code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessNotice("");

    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: cleanCode }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep("PASSWORD");
        setSuccessNotice("Code verified! Now set your new password.");
      } else {
        setErrorMessage(data.message || "Invalid or expired verification code.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: code.trim(),
          newPassword: password,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep("SUCCESS");
        setTimeout(() => {
          router.push("/login");
        }, 3500);
      } else {
        setErrorMessage(data.message || "Failed to reset password. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Silk>
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30 font-sans">
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/80 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col gap-6">

          {/* Step Progress Indicators */}
          {step !== "SUCCESS" && (
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/5">
              {[
                { key: "EMAIL", label: "Email", num: "1" },
                { key: "CODE", label: "Verify Code", num: "2" },
                { key: "PASSWORD", label: "New Password", num: "3" },
              ].map((s, idx) => {
                const isActive = step === s.key;
                const isPassed =
                  (step === "CODE" && idx === 0) ||
                  (step === "PASSWORD" && idx <= 1);

                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                        isActive
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500/30"
                          : isPassed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      {isPassed ? "✓" : s.num}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isActive ? "text-white" : isPassed ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium">
              {errorMessage}
            </div>
          )}

          {successNotice && step !== "SUCCESS" && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              {successNotice}
            </div>
          )}

          {/* ──────────────── STEP 1: ENTER EMAIL ──────────────── */}
          {step === "EMAIL" && (
            <form onSubmit={handleRequestCode} className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/20 text-white">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Forgot Password?</h1>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Enter your registered email address and we'll send you a 6-digit verification code.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-300">Account Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <Link href="/login" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Remembered your password? <span className="text-indigo-400 font-bold">Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* ──────────────── STEP 2: ENTER 6-DIGIT CODE ──────────────── */}
          {step === "CODE" && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-amber-500/20 text-white">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Enter 6-Digit Code</h1>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Check your Gmail inbox for the verification code sent to:
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-zinc-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("EMAIL");
                      setErrorMessage("");
                      setSuccessNotice("");
                    }}
                    className="text-[11px] text-indigo-400 hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 items-center">
                <label className="text-xs font-bold text-zinc-300 self-start">Verification Code</label>
                
                {devOtp && (
                  <div className="w-full mb-1 p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      Sandbox Code: <strong className="text-white font-mono tracking-wider text-sm">{devOtp}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCode(devOtp)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] transition-colors shadow-sm"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(val);
                  }}
                  className="w-full text-center tracking-[12px] font-mono text-2xl font-black py-3 rounded-xl bg-zinc-950/80 border border-white/10 text-indigo-300 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <span className="text-[11px] text-zinc-500 mt-1">
                  Code expires in 15 minutes
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={() => handleRequestCode()}
                  className="text-zinc-400 hover:text-indigo-400 disabled:text-zinc-600 transition-colors font-medium"
                >
                  {resendCooldown > 0 ? (
                    `Resend code in ${resendCooldown}s`
                  ) : (
                    "Didn't get code? Resend"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setErrorMessage("");
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          {/* ──────────────── STEP 3: NEW PASSWORD ──────────────── */}
          {step === "PASSWORD" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-500/20 text-white">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Create a strong new password for your account.
                </p>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-300">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-950/80 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-300">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-950/80 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ──────────────── SUCCESS STATE ──────────────── */}
          {step === "SUCCESS" && (
            <div className="flex flex-col items-center text-center gap-4 py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-white">Password Updated!</h2>
                <p className="text-xs text-zinc-300">
                  Your password has been securely reset. Redirecting you to login...
                </p>
              </div>

              <Link
                href="/login"
                className="mt-2 w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all text-center"
              >
                Sign In Now →
              </Link>
            </div>
          )}

        </div>
      </div>
    </Silk>
  );
}
