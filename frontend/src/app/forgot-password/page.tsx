"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Mail,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address format.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: resetErr } = await resetPassword(trimmedEmail);
      if (resetErr) {
        setError(resetErr.message || "Failed to send password reset link. Please try again.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmWhite flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
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

        {/* Card */}
        <Card className="p-8 shadow-subtle border-lightBorder bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-darkBrown">Reset Your Password</h2>
            <p className="text-xs text-darkBrown-muted mt-1 leading-relaxed">
              Enter your institutional email address to receive password recovery instructions.
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Supabase Setup Required</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Password recovery connects to Supabase. Configure{" "}
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

          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-darkBrown">Check Your Inbox</h3>
              <p className="text-xs text-darkBrown-muted leading-relaxed">
                A password reset link has been dispatched to <strong>{email}</strong>. Please check your email to create a new password.
              </p>
              <div className="pt-3">
                <Button variant="primary" href="/" className="w-full justify-center font-semibold">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-darkBrown mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkBrown-muted/70">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institution.edu"
                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-lightBorder rounded-lg focus:ring-2 focus:ring-beigeAccent focus:border-beigeAccent bg-white placeholder-darkBrown-muted/50 text-darkBrown transition"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full justify-center shadow-sm font-semibold mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-xs text-darkBrown-muted hover:text-darkBrown font-medium transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-[11px] text-darkBrown-muted max-w-sm mx-auto leading-relaxed">
          KneeAI Academic Decision Support Platform • Experimental Deep Learning Research Use Only
        </p>
      </div>
    </div>
  );
}
