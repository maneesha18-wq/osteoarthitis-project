"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Upload,
  PlusCircle,
  History,
  Clock,
  ArrowRight,
  Activity,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge, getGradeBadgeVariant } from "@/components/ui/Badge";
import { fetchAnalyses, AnalysisRecord } from "@/lib/supabase";

interface BackendStatus {
  status: "online" | "degraded" | "offline" | "checking";
  modelName: string;
  modelVersion: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    status: "checking",
    modelName: "MobileNetV2",
    modelVersion: "1.0.0",
  });
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check AI model health
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch(`${apiUrl}/ready`).catch(() => null);
        if (!isMounted) return;
        if (res && res.ok) {
          const data = await res.json();
          setBackendStatus({
            status: data.model_ready ? "online" : "degraded",
            modelName: data.model_name || "MobileNetV2",
            modelVersion: data.model_version || "1.0.0",
          });
        } else {
          setBackendStatus({
            status: "offline",
            modelName: "MobileNetV2",
            modelVersion: "1.0.0",
          });
        }
      } catch {
        if (isMounted) {
          setBackendStatus({
            status: "offline",
            modelName: "MobileNetV2",
            modelVersion: "1.0.0",
          });
        }
      }
    }

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  // Load user's analyses
  useEffect(() => {
    let isMounted = true;
    fetchAnalyses(user?.id).then((records) => {
      if (isMounted) {
        setAnalyses(records);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Researcher";

  const latestAnalysis = analyses[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Knee Osteoarthritis Classification & Grad-CAM Decision Support
          </p>
        </div>

        <Button variant="primary" href="/dashboard/analysis">
          <PlusCircle className="w-4 h-4 mr-1.5" /> Start New Analysis
        </Button>
      </div>

      {/* Essential Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Model Status */}
        <Card className="p-4 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Inference Engine</p>
              <p className="text-sm font-bold text-navy-800">
                {backendStatus.modelName} (v{backendStatus.modelVersion})
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              backendStatus.status === "online"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {backendStatus.status}
          </span>
        </Card>

        {/* Total Analyses */}
        <Card className="p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Evaluations</p>
            <p className="text-sm font-bold text-navy-800">
              {loading ? "..." : `${analyses.length} Records`}
            </p>
          </div>
        </Card>

        {/* Latest Evaluation */}
        <Card className="p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-medBlue-50 text-medBlue-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Latest Result</p>
            <p className="text-sm font-bold text-navy-800 truncate">
              {latestAnalysis ? latestAnalysis.predicted_grade_label : "None Yet"}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Action Card */}
      <Card className="p-6 bg-gradient-to-r from-navy-800 to-navy-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-card">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">
            Analyze Knee Radiograph
          </h2>
          <p className="text-xs text-slate-300">
            Upload a frontal knee X-ray to predict Kellgren–Lawrence severity and generate Grad-CAM heatmaps.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="primary" href="/dashboard/analysis" size="md">
            <Upload className="w-4 h-4 mr-1.5" /> Upload & Analyze
          </Button>
          <Button
            variant="outline"
            href="/dashboard/history"
            size="md"
            className="text-white border-slate-600 hover:bg-navy-700"
          >
            <History className="w-4 h-4 mr-1.5" /> History
          </Button>
        </div>
      </Card>

      {/* Recent Analyses List */}
      <Card className="bg-white">
        <CardHeader
          title="Recent Analyses"
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
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Loading recent evaluations...
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-navy-800">No analyses performed yet</p>
              <p className="text-[11px] text-slate-500 mt-1 mb-3">
                Upload your first knee radiograph to view automated grading and Grad-CAM explainability.
              </p>
              <Button variant="primary" size="sm" href="/dashboard/analysis">
                <Upload className="w-3.5 h-3.5 mr-1" /> Start First Analysis
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {analyses.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-800 truncate">
                      {rec.filename}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(rec.created_at).toLocaleDateString()} • {(rec.confidence * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getGradeBadgeVariant(rec.predicted_grade)} size="sm">
                      {rec.predicted_grade_label}
                    </Badge>
                    <Link
                      href="/dashboard/history"
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
