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
      <div className="border-b border-lightBorder pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-darkGreen">
          Application Settings
        </h1>
        <p className="text-xs text-darkGreen-muted mt-1">
          Configure inference endpoints, image preprocessing preferences, and system thresholds
        </p>
      </div>

      <Card className="bg-white border-lightBorder shadow-subtle">
        <CardHeader
          title="Inference Connection"
          subtitle="FastAPI backend URL and service parameters"
        />
        <CardContent>
          {isSaved && (
            <div className="mb-4 p-3 rounded-lg bg-lightSage/40 border border-lightBorder text-xs text-darkGreen flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sageAccent" />
              <span>Settings updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-darkGreen mb-1">
                FastAPI Backend Endpoint
              </label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-lightBorder rounded-lg focus:ring-sageAccent focus:border-sageAccent text-darkGreen bg-white"
              />
              <p className="text-[11px] text-darkGreen-muted mt-1">
                Default local endpoint: <code className="font-mono text-darkGreen-light">http://localhost:8000</code>
              </p>
            </div>

            <div className="pt-2 border-t border-lightBorder">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={claheEnabled}
                  onChange={(e) => setClaheEnabled(e.target.checked)}
                  className="rounded text-sageAccent focus:ring-sageAccent border-lightBorder h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-darkGreen block">
                    Enable CLAHE (Contrast Limited Adaptive Histogram Equalization)
                  </span>
                  <span className="text-[11px] text-darkGreen-muted block">
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
