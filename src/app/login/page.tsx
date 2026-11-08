"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(() =>
    searchParams?.get("registered") === "true" ? "Account created! Please sign in." : ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    const cleanEmail = email.trim();

    const res = await signIn("credentials", {
      redirect: false,
      email: cleanEmail,
      password: password,
    });

    console.log("[LOGIN] signIn result:", res);

    if (res?.error) {
      setIsLoading(false);
      // NextAuth wraps the error string — check for our sentinels
      if (res.error.includes("EMAIL_NOT_VERIFIED")) {
        // Redirect to verify-email page so user can resend the link
        router.push(`/verify-email?email=${encodeURIComponent(cleanEmail)}&unverified=true`);
        return;
      }
      if (res.error.includes("banned")) {
        setError("Your account has been banned.");
        return;
      }
      if (res.error.includes("suspended")) {
        setError("Your account is temporarily suspended. Please contact support.");
        return;
      }
      setError("Invalid email or password. Please try again.");
      setShowPassword(true); // Show password so user can check what they typed
    } else {
      const callbackUrl = searchParams?.get("callbackUrl") || "/";
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm">
      {/* Logo & Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#1769D2] flex items-center justify-center font-bold text-xl text-white shadow-xs">
          R
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">Welcome Back</h1>
        <p className="text-[#64748B] text-sm text-center">Sign in to your GamesSurEarn account</p>
      </div>

      {/* Success Message (after registration) */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm text-center font-medium">
          ✅ {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#102A43]">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2] text-[#102A43] outline-none transition-all placeholder:text-[#94A3B8]"
            required
          />
        </div>

        {/* Password with show/hide toggle */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#102A43]">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-[#1769D2] hover:underline transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-[#E2E8F0] focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2] text-[#102A43] outline-none transition-all placeholder:text-[#94A3B8]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#102A43] transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full py-3.5 rounded-xl bg-[#1769D2] text-white font-bold hover:bg-[#1558b0] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#64748B]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#1769D2] font-bold hover:underline transition-colors">
          Create one
        </Link>
      </p>

      <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-4 text-xs text-[#64748B]">
        <Link href="/terms" className="hover:text-[#102A43] transition-colors">Terms of Service</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-[#102A43] transition-colors">Privacy Policy</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] text-[#102A43] font-sans selection:bg-[#EAF3FF] selection:text-[#1769D2] p-4">
      <Suspense fallback={<div className="text-[#64748B]">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
