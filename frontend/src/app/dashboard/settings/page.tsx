"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [apiEndpoint, setApiEndpoint] = useState(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  );
  const [claheEnabled, setClaheEnabled] = useState(true);
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
          Application Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure inference endpoints, image preprocessing preferences, and system thresholds
        </p>
      </div>

      <Card>
        <CardHeader
          title="Inference Connection"
          subtitle="FastAPI backend URL and service parameters"
        />
        <CardContent>
          {isSaved && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-navy-800 mb-1">
                FastAPI Backend Endpoint
              </label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-navy-900 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default local endpoint: <code className="font-mono">http://localhost:8000</code>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={claheEnabled}
                  onChange={(e) => setClaheEnabled(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-navy-800 block">
                    Enable CLAHE (Contrast Limited Adaptive Histogram Equalization)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Applies adaptive local contrast enhancement prior to model inference to boost trabecular bone visibility.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm">
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
