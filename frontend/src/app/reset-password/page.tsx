"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateErr } = await updatePassword(newPassword);
      if (updateErr) {
        setError(updateErr.message || "Failed to update password.");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch {
      setError("An unexpected error occurred while resetting password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-softBg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 group mb-6">
          <div className="w-10 h-10 rounded-lg bg-softBg border border-lightBorder flex items-center justify-center text-sageAccent shadow-subtle transition-transform duration-200 group-hover:scale-105">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-darkGreen">
            Knee<span className="text-sageAccent">AI</span>
          </span>
        </Link>
        <h2 className="text-center text-2xl font-extrabold text-darkGreen">
          Update Your Password
        </h2>
        <p className="mt-2 text-center text-xs text-darkGreen font-medium">
          Set a secure new password for your researcher account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 shadow-card border-lightBorder bg-white">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-lightSage/50 text-darkGreen rounded-full flex items-center justify-center mx-auto border border-lightBorder">
                <CheckCircle2 className="w-6 h-6 text-sageAccent" />
              </div>
              <h3 className="text-base font-bold text-darkGreen">Password Updated!</h3>
              <p className="text-xs text-darkGreen font-medium">
                Your password has been successfully updated. Redirecting you to sign in...
              </p>
              <div className="pt-2">
                <Button variant="primary" href="/login" className="w-full justify-center">
                  Sign In Now
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-darkGreen mb-1.5">
                  New Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkGreen">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-9 pr-3 py-2.5 text-xs border border-lightBorder rounded-lg focus:ring-sageAccent focus:border-sageAccent bg-white text-darkGreen placeholder-darkGreen/50 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-darkGreen mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-darkGreen">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="block w-full pl-9 pr-3 py-2.5 text-xs border border-lightBorder rounded-lg focus:ring-sageAccent focus:border-sageAccent bg-white text-darkGreen placeholder-darkGreen/50 font-medium"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={isLoading}
              >
                Update Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
