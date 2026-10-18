"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function InitialAuthPage() {
  const router = useRouter();
  const { user, signIn, isLoading: authLoading, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect directly to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address format.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: authError } = await signIn(trimmedEmail, password);

      if (authError) {
        setError(authError.message || "Failed to authenticate. Please check your credentials.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmWhite flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Centered Auth Card Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-xl bg-warmWhite border border-lightBorder flex items-center justify-center text-beigeAccent shadow-subtle">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-3xl tracking-tight text-darkBrown">
              Knee<span className="text-beigeAccent">AI</span>
            </span>
          </div>
          <p className="text-xs uppercase tracking-wider font-semibold text-darkBrown-muted">
            Deep Learning Decision Support
          </p>
        </div>

        {/* Minimal Mode Switcher: Login | Create Account */}
        <div className="flex bg-softBeige/40 border border-lightBorder p-1 rounded-xl mb-6 shadow-inner text-xs font-semibold">
          <div className="flex-1 py-2 text-center rounded-lg bg-white text-darkBrown border border-lightBorder/60 shadow-subtle transition">
            Login
          </div>
          <Link
            href="/register"
            className="flex-1 py-2 text-center rounded-lg text-darkBrown-muted hover:text-darkBrown transition"
          >
            Create Account
          </Link>
        </div>

        {/* Main Login Card */}
        <Card className="p-8 shadow-subtle border-lightBorder bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-darkBrown">Welcome Back</h2>
            <p className="text-xs text-darkBrown-muted mt-1">
              Sign in to continue to your account.
            </p>
          </div>

          {/* Development Notice if Supabase is unconfigured */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Supabase Setup Required</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Real authentication connects to Supabase. Define{" "}
                  <code className="font-mono text-amber-950 font-bold bg-amber-100/60 px-1 py-0.5 rounded">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{" "}
                  and{" "}
                  <code className="font-mono text-amber-950 font-bold bg-amber-100/60 px-1 py-0.5 rounded">
                    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                  </code>{" "}
                  in <code className="font-mono text-amber-950 font-bold">frontend/.env.local</code>.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-darkBrown mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkBrown-muted/70">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-lightBorder rounded-lg focus:ring-2 focus:ring-beigeAccent focus:border-beigeAccent bg-white placeholder-darkBrown-muted/50 text-darkBrown transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-darkBrown"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-beigeAccent hover:text-beigeAccent-hover hover:underline transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkBrown-muted/70">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm border border-lightBorder rounded-lg focus:ring-2 focus:ring-beigeAccent focus:border-beigeAccent bg-white placeholder-darkBrown-muted/50 text-darkBrown transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-darkBrown-muted hover:text-darkBrown focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-lightBorder text-beigeAccent focus:ring-beigeAccent cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-xs text-darkBrown-muted cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full justify-center mt-2 shadow-sm font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Switch to Register */}
          <div className="mt-6 pt-5 border-t border-lightBorder text-center text-xs text-darkBrown-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-beigeAccent hover:text-beigeAccent-hover hover:underline"
            >
              Create one
            </Link>
          </div>
        </Card>

        {/* Academic Medical Disclaimer */}
        <p className="mt-6 text-center text-[11px] text-darkBrown-muted max-w-sm mx-auto leading-relaxed">
          KneeAI Academic Decision Support Platform • Experimental Deep Learning Research Use Only
        </p>
      </div>
    </div>
  );
}
