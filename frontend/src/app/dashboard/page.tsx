"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Upload,
  PlusCircle,
  History,
  Clock,
  ArrowRight,
  FileText,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge, getGradeBadgeVariant, KL_GRADE_DETAILS } from "@/components/ui/Badge";
import { fetchAnalyses, AnalysisRecord } from "@/lib/supabase";

export default function DashboardPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Grade Distribution Calculations
  const totalScans = analyses.length;
  const gradeDistribution = [0, 1, 2, 3, 4].map((g) => {
    const count = analyses.filter((a) => a.predicted_grade === g).length;
    const percentage = totalScans > 0 ? (count / totalScans) * 100 : 0;
    return {
      grade: g,
      label: KL_GRADE_DETAILS[g]?.label || `Grade ${g}`,
      severity: KL_GRADE_DETAILS[g]?.severity || "",
      count,
      percentage,
      barColor:
        g === 0
          ? "bg-emerald-500"
          : g === 1
          ? "bg-teal-500"
          : g === 2
          ? "bg-amber-500"
          : g === 3
          ? "bg-orange-500"
          : "bg-rose-500",
      textColor:
        g === 0
          ? "text-emerald-600 dark:text-emerald-400"
          : g === 1
          ? "text-teal-600 dark:text-teal-400"
          : g === 2
          ? "text-amber-600 dark:text-amber-400"
          : g === 3
          ? "text-orange-600 dark:text-orange-400"
          : "text-rose-600 dark:text-rose-400",
      bgColor:
        g === 0
          ? "bg-emerald-50 dark:bg-emerald-950/40"
          : g === 1
          ? "bg-teal-50 dark:bg-teal-950/40"
          : g === 2
          ? "bg-amber-50 dark:bg-amber-950/40"
          : g === 3
          ? "bg-orange-50 dark:bg-orange-950/40"
          : "bg-rose-50 dark:bg-rose-950/40",
    };
  });

  // Clinical Summary Metrics
  const avgConfidence =
    totalScans > 0
      ? (analyses.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / totalScans) * 100
      : 0;

  const normalScans = analyses.filter((a) => a.predicted_grade === 0).length;
  const oaScans = totalScans - normalScans;
  const oaPercentage = totalScans > 0 ? (oaScans / totalScans) * 100 : 0;
  const normalPercentage = totalScans > 0 ? (normalScans / totalScans) * 100 : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-lightBorder">
        <div>
          <h1 className="text-2xl font-bold text-darkGreen">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs text-darkGreen font-medium mt-0.5">
            Knee Osteoarthritis Classification & Grad-CAM Explainability
          </p>
        </div>

        <Button variant="primary" href="/dashboard/analysis">
          <PlusCircle className="w-4 h-4 mr-1.5" /> Start New Analysis
        </Button>
      </div>

      {/* Essential Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Analyses */}
        <Card className="p-4 bg-white border-lightBorder shadow-subtle flex items-center gap-3 hover:border-sageAccent hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-lg bg-softBg border border-lightBorder text-sageAccent flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-darkGreen">Total Evaluations</p>
            <p className="text-sm font-bold text-darkGreen">
              {loading ? "..." : `${totalScans} Radiographs`}
            </p>
          </div>
        </Card>

        {/* Latest Evaluation */}
        <Card className="p-4 bg-white border-lightBorder shadow-subtle flex items-center gap-3 hover:border-sageAccent hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-lg bg-softBg border border-lightBorder text-sageAccent flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-darkGreen">Latest Result</p>
            <p className="text-sm font-bold text-darkGreen truncate">
              {latestAnalysis ? latestAnalysis.predicted_grade_label : "None Yet"}
            </p>
          </div>
        </Card>

        {/* Average Confidence */}
        <Card className="p-4 bg-white border-lightBorder shadow-subtle flex items-center gap-3 hover:border-sageAccent hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-lg bg-softBg border border-lightBorder text-sageAccent flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-darkGreen">Mean Confidence</p>
            <p className="text-sm font-bold text-darkGreen">
              {loading ? "..." : totalScans > 0 ? `${avgConfidence.toFixed(1)}%` : "N/A"}
            </p>
          </div>
        </Card>
      </div>

      {/* Summary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KL Grade Severity Distribution Bar Chart */}
        <div className="lg:col-span-7">
          <Card className="h-full bg-white border-lightBorder shadow-subtle hover:border-sageAccent/60 transition-all duration-200">
            <CardHeader
              title="Kellgren-Lawrence Severity Distribution"
              subtitle="Breakdown of radiograph evaluations by KL classification stage"
              action={
                <div className="flex items-center gap-1.5 text-xs font-bold text-sageAccent">
                  <BarChart3 className="w-4 h-4" />
                  <span>{totalScans} Total</span>
                </div>
              }
            />
            <CardContent className="space-y-4">
              {totalScans === 0 && !loading ? (
                <div className="p-4 rounded-xl bg-softBg border border-lightBorder text-center">
                  <p className="text-xs font-bold text-darkGreen mb-1">
                    No evaluations recorded yet
                  </p>
                  <p className="text-xs text-darkGreen-muted font-medium mb-3">
                    Analyze knee radiographs to generate automated severity distribution graphs.
                  </p>
                  <Button variant="primary" size="sm" href="/dashboard/analysis">
                    <Upload className="w-3.5 h-3.5 mr-1" /> Run First Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {gradeDistribution.map((item) => (
                    <div key={item.grade} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${item.barColor}`}
                          />
                          <span className="font-bold text-darkGreen">
                            {item.label}:
                          </span>
                          <span className="text-darkGreen-muted font-medium">
                            {item.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-darkGreen">
                            {item.count} scan{item.count !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs font-semibold text-darkGreen-muted w-12 text-right">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Bar Fill */}
                      <div className="h-3 w-full bg-softBg rounded-full overflow-hidden border border-lightBorder/60">
                        <div
                          className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                          style={{
                            width: `${Math.max(item.percentage, item.count > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clinical Ratio & Insights Chart Card */}
        <div className="lg:col-span-5">
          <Card className="h-full bg-white border-lightBorder shadow-subtle hover:border-sageAccent/60 transition-all duration-200">
            <CardHeader
              title="Clinical Diagnostic Ratios"
              subtitle="Pathology detection rate and confidence overview"
              action={<PieChart className="w-4 h-4 text-sageAccent" />}
            />
            <CardContent className="space-y-4">
              {/* Normal vs Osteoarthritis Proportion Bar */}
              <div className="p-4 rounded-xl bg-softBg border border-lightBorder space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-darkGreen">
                  <span>Normal vs Osteoarthritis</span>
                  <span>{totalScans > 0 ? `${oaPercentage.toFixed(0)}% Positive OA` : "0%"}</span>
                </div>

                <div className="h-4 w-full bg-emerald-500 rounded-full overflow-hidden flex border border-lightBorder">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${totalScans > 0 ? normalPercentage : 100}%` }}
                    title={`Normal: ${normalPercentage.toFixed(1)}%`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${totalScans > 0 ? oaPercentage : 0}%` }}
                    title={`Osteoarthritis: ${oaPercentage.toFixed(1)}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-darkGreen-muted pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Grade 0 (Normal): {normalScans}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Grades 1–4 (OA): {oaScans}</span>
                  </div>
                </div>
              </div>

              {/* Statistical Highlights Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-softBg border border-lightBorder">
                  <span className="text-[11px] font-semibold text-darkGreen-muted block">
                    Confidence Index
                  </span>
                  <span className="text-xl font-extrabold text-sageAccent block mt-0.5">
                    {totalScans > 0 ? `${avgConfidence.toFixed(1)}%` : "—"}
                  </span>
                  <span className="text-[10px] text-darkGreen-muted font-medium">
                    Softmax mean
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-softBg border border-lightBorder">
                  <span className="text-[11px] font-semibold text-darkGreen-muted block">
                    Evaluation Health
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Optimal
                  </span>
                  <span className="text-[10px] text-darkGreen-muted font-medium">
                    MobileNetV2 engine
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Card (No Gradients) */}
      <Card className="p-6 bg-white border border-lightBorder text-darkGreen flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-subtle hover:border-sageAccent hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-darkGreen">
            Analyze Knee Radiograph
          </h2>
          <p className="text-xs text-darkGreen font-medium">
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
          >
            <History className="w-4 h-4 mr-1.5" /> History
          </Button>
        </div>
      </Card>

      {/* Recent Analyses List */}
      <Card className="bg-white border-lightBorder shadow-subtle hover:border-sageAccent/60 transition-all duration-200">
        <CardHeader
          title="Recent Analyses"
          action={
            <Link
              href="/dashboard/history"
              className="text-xs font-bold text-sageAccent hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-xs text-darkGreen font-medium">
              Loading recent evaluations...
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-full bg-softBg border border-lightBorder text-sageAccent flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-darkGreen">No analyses performed yet</p>
              <p className="text-xs text-darkGreen font-medium mt-1 mb-3">
                Upload your first knee radiograph to view automated grading and Grad-CAM explainability.
              </p>
              <Button variant="primary" size="sm" href="/dashboard/analysis">
                <Upload className="w-3.5 h-3.5 mr-1" /> Start First Analysis
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-lightBorder">
              {analyses.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-lightSage/20 px-2 rounded-lg transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-darkGreen truncate">
                      {rec.filename}
                    </p>
                    <p className="text-xs text-darkGreen font-medium mt-0.5">
                      {new Date(rec.created_at).toLocaleDateString()} • {(rec.confidence * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getGradeBadgeVariant(rec.predicted_grade)} size="sm">
                      {rec.predicted_grade_label}
                    </Badge>
                    <Link
                      href="/dashboard/history"
                      className="text-xs text-sageAccent hover:underline font-bold"
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
