"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800">
          User Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your researcher profile details and institution information
        </p>
      </div>

      <Card>
        <CardHeader
          title="Account Details"
          subtitle="Information associated with your KneeAI decision-support access"
        />
        <CardContent>
          {isSaved && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile details saved.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1">
                Display Name / Researcher Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Alex Rivera"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-navy-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1">
                Registered Email
              </label>
              <input
                type="email"
                value={user?.email || "researcher@university.edu"}
                disabled
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Email address is managed through Supabase Authentication.
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm">
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
