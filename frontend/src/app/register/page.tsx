"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  const { signUp, isConfigured } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your full name and clinical title.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid institutional email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirmation password do not match.");
      return;
    }

    if (!termsAccepted) {
      setError("Please acknowledge the research decision-support terms to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: authError, user: newUser } = await signUp(
        trimmedEmail,
        password,
        trimmedName
      );

      if (authError) {
        setError(authError.message || "Failed to create account. Please try again.");
      } else {
        setSuccessMessage(
          newUser?.email_confirmed_at
            ? "Account created successfully! You may now sign in."
            : "Registration submitted successfully! A confirmation link has been sent to your email. Please verify your email before logging in."
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during registration. Please try again."
      );
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
          <Link
            href="/"
            className="flex-1 py-2 text-center rounded-lg text-darkBrown-muted hover:text-darkBrown transition"
          >
            Login
          </Link>
          <div className="flex-1 py-2 text-center rounded-lg bg-white text-darkBrown border border-lightBorder/60 shadow-subtle transition">
            Create Account
          </div>
        </div>

        {/* Main Register Card */}
        <Card className="p-8 shadow-subtle border-lightBorder bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-darkBrown">Create Your Account</h2>
            <p className="text-xs text-darkBrown-muted mt-1">
              Join the explainable knee radiograph decision support platform.
            </p>
          </div>

          {/* Development Notice if Supabase is unconfigured */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Supabase Setup Required</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Real registration connects to Supabase. Define{" "}
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

          {/* Success / Verification Pending Message */}
          {successMessage ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold text-emerald-950">Verification Email Dispatched</p>
                  <p className="mt-1">{successMessage}</p>
                </div>
              </div>
              <Button
                variant="primary"
                href="/"
                className="w-full justify-center shadow-sm font-semibold"
              >
                Proceed to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-xs font-semibold text-darkBrown mb-1.5"
                >
                  Full Name & Clinical Title
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkBrown-muted/70">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jordan Hayes, MD"
                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-lightBorder rounded-lg focus:ring-2 focus:ring-beigeAccent focus:border-beigeAccent bg-white placeholder-darkBrown-muted/50 text-darkBrown transition"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold text-darkBrown mb-1.5"
                >
                  Institutional Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkBrown-muted/70">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="register-email"
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

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold text-darkBrown mb-1.5"
                >
                  Password (min. 8 characters)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkBrown-muted/70">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold text-darkBrown mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkBrown-muted/70">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-10 py-2.5 text-sm border border-lightBorder rounded-lg focus:ring-2 focus:ring-beigeAccent focus:border-beigeAccent bg-white placeholder-darkBrown-muted/50 text-darkBrown transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-darkBrown-muted hover:text-darkBrown focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms & Privacy Acknowledgment */}
              <div className="flex items-start pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-lightBorder text-beigeAccent focus:ring-beigeAccent cursor-pointer"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-xs text-darkBrown-muted cursor-pointer select-none leading-relaxed"
                >
                  I acknowledge that KneeAI is an academic decision-support research tool and predictions are not a substitute for certified medical diagnosis.
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Footer Switch to Sign In */}
          <div className="mt-6 pt-5 border-t border-lightBorder text-center text-xs text-darkBrown-muted">
            Already have an account?{" "}
            <Link
              href="/"
              className="font-semibold text-beigeAccent hover:text-beigeAccent-hover hover:underline"
            >
              Sign In
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
