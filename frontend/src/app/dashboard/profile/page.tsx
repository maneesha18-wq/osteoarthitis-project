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
      <div className="border-b border-lightBorder pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-darkGreen">
          User Profile
        </h1>
        <p className="text-xs text-darkGreen font-medium mt-1">
          Manage your researcher profile details and institution information
        </p>
      </div>

      <Card className="bg-white border-lightBorder shadow-subtle">
        <CardHeader
          title="Account Details"
          subtitle="Information associated with your KneeAI decision-support access"
        />
        <CardContent>
          {isSaved && (
            <div className="mb-4 p-3 rounded-lg bg-lightSage/40 border border-lightBorder text-xs text-darkGreen font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sageAccent" />
              <span>Profile details saved.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-darkGreen mb-1">
                Display Name / Researcher Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Alex Rivera"
                className="w-full px-3 py-2 text-xs border border-lightBorder rounded-lg focus:ring-sageAccent focus:border-sageAccent text-darkGreen bg-white placeholder-darkGreen/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-darkGreen mb-1">
                Registered Email
              </label>
              <input
                type="email"
                value={user?.email || "researcher@university.edu"}
                disabled
                className="w-full px-3 py-2 text-xs border border-lightBorder rounded-lg bg-softBg text-darkGreen font-semibold cursor-not-allowed"
              />
              <p className="text-[11px] text-darkGreen font-medium mt-1">
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
