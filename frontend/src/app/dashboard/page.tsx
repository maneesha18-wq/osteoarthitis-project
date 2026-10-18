"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  PlusCircle,
  History,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  Server,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface BackendStatus {
  status: "checking" | "online" | "degraded" | "offline";
  service: string;
  modelLoaded: boolean;
  modelName?: string;
  modelVersion?: string;
  device?: string;
  message?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    status: "checking",
    service: "FastAPI Backend",
    modelLoaded: false,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check actual FastAPI backend health and readiness
  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const readyRes = await fetch(`${apiUrl}/ready`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }).catch(() => null);

        if (!isMounted) return;

        if (readyRes && readyRes.ok) {
          const readyData = await readyRes.json();
          setBackendStatus({
            status: readyData.model_ready ? "online" : "degraded",
            service: "FastAPI AI Engine",
            modelLoaded: readyData.model_ready,
            modelName: readyData.model_name || "MobileNetV2",
            modelVersion: readyData.model_version || "1.0.0",
            device: readyData.device || "CPU",
            message: readyData.message || (readyData.model_ready ? "Model operational & ready for inference" : "Backend connected; waiting for model initialization"),
          });
        } else {
          // Try /health as fallback
          const healthRes = await fetch(`${apiUrl}/health`).catch(() => null);
          if (healthRes && healthRes.ok) {
            setBackendStatus({
              status: "degraded",
              service: "FastAPI AI Engine",
              modelLoaded: false,
              message: "API online, but model checkpoint is not loaded.",
            });
          } else {
            setBackendStatus({
              status: "offline",
              service: "FastAPI AI Engine",
              modelLoaded: false,
              message: `Cannot reach backend at ${apiUrl}. Run backend server to enable inference.`,
            });
          }
        }
      } catch {
        if (isMounted) {
          setBackendStatus({
            status: "offline",
            service: "FastAPI AI Engine",
            modelLoaded: false,
            message: `Backend service is unreachable at ${apiUrl}.`,
          });
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl]);

  return (
    <div className="space-y-8">
      {/* Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
              Research Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Researcher"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kellgren–Lawrence radiograph classification and Grad-CAM visual decision support workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" href="/dashboard/analysis">
            <PlusCircle className="w-4 h-4 mr-1.5" /> Start New Analysis
          </Button>
        </div>
      </div>

      {/* Actual Live System & Model Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              backendStatus.status === "online"
                ? "bg-emerald-50 text-emerald-600"
                : backendStatus.status === "degraded"
                ? "bg-amber-50 text-amber-600"
                : backendStatus.status === "checking"
                ? "bg-slate-100 text-slate-500"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            <Server className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Inference Engine</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  backendStatus.status === "online"
                    ? "bg-emerald-100 text-emerald-800"
                    : backendStatus.status === "degraded"
                    ? "bg-amber-100 text-amber-800"
                    : backendStatus.status === "checking"
                    ? "bg-slate-200 text-slate-700"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {backendStatus.status}
              </span>
            </div>
            <p className="text-xs font-bold text-navy-800 truncate mt-0.5">
              {backendStatus.modelLoaded
                ? `${backendStatus.modelName} (v${backendStatus.modelVersion})`
                : "FastAPI Backend"}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {backendStatus.message}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-medBlue-50 text-medBlue-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Explainability</span>
            <p className="text-xs font-bold text-navy-800 mt-0.5">
              Grad-CAM (Conv Out)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Localized heatmaps & alpha overlays
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Classification Standard</span>
            <p className="text-xs font-bold text-navy-800 mt-0.5">
              Kellgren–Lawrence Scale
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              5 Classes: Grade 0 (None) to 4 (Severe)
            </p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Quick Analysis Action & First-time instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quick Action Hero Card */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-navy-800 to-navy-900 text-white relative overflow-hidden shadow-elevated border-0">
            <div className="relative z-10 space-y-4">
              <span className="inline-block px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-semibold">
                Core Workflow
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Analyze Knee Radiograph
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                Upload a frontal or anteroposterior radiograph to compute Kellgren–Lawrence grade probabilities, inspect Grad-CAM localized heatmaps, and generate exportable clinical summaries.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button variant="primary" href="/dashboard/analysis" size="md">
                  <Upload className="w-4 h-4 mr-1.5" /> Start Analysis
                </Button>
                <Button
                  variant="outline"
                  href="/dashboard/history"
                  size="md"
                  className="text-white border-slate-500 hover:bg-navy-700"
                >
                  <History className="w-4 h-4 mr-1.5" /> View Past Records
                </Button>
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none p-6">
              <Activity className="w-48 h-48 text-white" />
            </div>
          </Card>

          {/* Recent Analyses (Empty state or actual records) */}
          <Card>
            <CardHeader
              title="Recent Clinical Analyses"
              subtitle="Latest evaluations executed under your authenticated account"
              action={
                <Link
                  href="/dashboard/history"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent>
              {/* Honest empty state when no analysis records are stored yet */}
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-navy-800">
                  No Analyses Performed Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  You have not submitted any knee radiographs for evaluation. Once an analysis is conducted, the results, confidence scores, and Grad-CAM visualizations will appear here.
                </p>
                <Button variant="outline" size="sm" href="/dashboard/analysis">
                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Conduct First Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: First-use instructions & Clinical Reference */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader
              title="First-Use Clinical Guidelines"
              subtitle="Recommended protocol for optimal radiograph analysis"
            />
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-800">Standard AP Projection</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Use standing anteroposterior (AP) or posteroanterior (PA) weight-bearing radiographs of the knee.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-800">Image Validation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supported formats: PNG, JPEG, TIFF (Max 10MB). Image is automatically normalized and mapped to 224×224.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-800">Review Grad-CAM Attention</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validate that high activation zones correlate with the tibiofemoral joint margins or patellar edges.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-800">Export Research Dossier</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate timestamped PDF case records for research team discussions and inter-observer review.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Disclaimer Card */}
          <Card className="bg-amber-50/50 border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-1">Academic Major Project Notice:</span>
                KneeAI is an experimental computer-aided decision-support prototype. Predictions and heatmaps provide research insights and do not represent validated clinical diagnoses.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
