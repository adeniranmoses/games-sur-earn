"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Eye icons for show/hide password
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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "NG",
    referralCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear password mismatch error when user starts typing again
    if (e.target.name === "confirmPassword" || e.target.name === "password") {
      setError("");
    }
  };

  // Check if passwords match in real time
  const passwordMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      // Auto-show both passwords so the user can see what they typed
      setShowPassword(true);
      setShowConfirmPassword(true);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setShowPassword(true);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          country: formData.country,
          referralCode: formData.referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // If a devVerifyUrl was returned (sandbox/dev mode), redirect straight there
      if (data.devVerifyUrl) {
        router.push(data.devVerifyUrl);
      } else {
        // Production: direct user to check their inbox
        router.push(`/verify-email?unverified=true&email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans selection:bg-indigo-500/30 py-12 px-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">

        {/* Logo & Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-zinc-400 text-sm text-center">
            Join RewardPlatform and start earning today
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">

          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Moses Adeyemi"
              autoComplete="name"
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
              required
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="off"
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
              required
            />
          </div>

          {/* Country */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-white"
            >
              <option value="NG">🇳🇬 Nigeria</option>
              <option value="GH">🇬🇭 Ghana</option>
              <option value="KE">🇰🇪 Kenya</option>
              <option value="ZA">🇿🇦 South Africa</option>
              <option value="US">🇺🇸 United States</option>
              <option value="GB">🇬🇧 United Kingdom</option>
            </select>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border outline-none transition-all placeholder:text-zinc-600 ${
                  passwordMismatch
                    ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {/* Real-time mismatch warning */}
            {passwordMismatch && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Referral Code (optional) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">
              Referral Code <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="text"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="e.g. MOSES123"
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600 uppercase"
            />
          </div>

          {/* Terms notice */}
          <p className="text-xs text-zinc-500 text-center">
            By registering, you agree to our{" "}
            <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
            Rewards are subject to verification and are not guaranteed income.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || passwordMismatch}
            className="mt-2 w-full py-3.5 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-500/25"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
