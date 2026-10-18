"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  PlusCircle,
  FileCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getGradeBadgeVariant } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { fetchAnalyses, AnalysisRecord } from "@/lib/supabase";
import jsPDF from "jspdf";

export default function ReportsPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const data = await fetchAnalyses(user?.id);
      if (isMounted) {
        setAnalyses(data);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const generatePdfForRecord = (record: AnalysisRecord) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header
    doc.setFillColor(41, 69, 54); // Dark Green #294536
    doc.rect(0, 0, pageWidth, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("KneeAI — Radiographic Analysis Report", 14, 13);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Kellgren-Lawrence Grading with Grad-CAM Explainability", 14, 19);

    // Metadata section
    doc.setTextColor(41, 69, 54);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Analysis Dossier", 14, 32);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 100, 90);
    doc.text(`Analysis ID: ${record.id}`, 14, 38);
    doc.text(`File Name: ${record.filename}`, 14, 43);
    doc.text(`Timestamp: ${new Date(record.created_at).toUTCString()}`, 14, 48);
    doc.text(`Model: ${record.model_name} (v${record.model_version}) • Latency: ${record.inference_time_ms.toFixed(1)} ms`, 14, 53);

    // Staging Card
    doc.setFillColor(245, 248, 244);
    doc.roundedRect(14, 58, pageWidth - 28, 22, 2.5, 2.5, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 69, 54);
    doc.text("Predicted Severity Staging:", 20, 67);

    doc.setFontSize(12);
    doc.setTextColor(107, 148, 117); // Sage Green Accent #6B9475
    doc.text(
      `${record.predicted_grade_label} — ${record.severity_label} (${(
        record.confidence * 100
      ).toFixed(1)}% Confidence)`,
      20,
      74
    );

    // Radiograph & Grad-CAM Heatmap Images Section
    let currentY = 86;
    const hasOriginal = !!record.original_image_base64;
    const hasHeatmap = !!(record.gradcam_overlay_base64 || record.gradcam_heatmap_base64);

    if (hasOriginal || hasHeatmap) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(41, 69, 54);
      doc.text("Radiographic Analysis & Grad-CAM Heatmap", 14, currentY);
      currentY += 5;

      const imgWidth = 86;
      const imgHeight = 65;

      if (hasOriginal) {
        try {
          const origSrc = record.original_image_base64!.startsWith("data:")
            ? record.original_image_base64!
            : `data:image/png;base64,${record.original_image_base64}`;
          doc.addImage(origSrc, "PNG", 14, currentY, imgWidth, imgHeight);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(80, 100, 90);
          doc.text("Original Radiograph (AP)", 14, currentY + imgHeight + 4);
        } catch {
          // fallback
        }
      }

      if (hasHeatmap) {
        try {
          const heatmapData = (record.gradcam_overlay_base64 || record.gradcam_heatmap_base64)!;
          const heatmapSrc = heatmapData.startsWith("data:")
            ? heatmapData
            : `data:image/png;base64,${heatmapData}`;
          doc.addImage(heatmapSrc, "PNG", 110, currentY, imgWidth, imgHeight);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(80, 100, 90);
          doc.text("Grad-CAM Attention Heatmap", 110, currentY + imgHeight + 4);
        } catch {
          // fallback
        }
      }

      currentY += imgHeight + 11;
    }

    // Probabilities
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 69, 54);
    doc.text("5-Class Probability Distribution", 14, currentY);
    currentY += 6;

    record.probabilities.forEach((p) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 80, 70);
      doc.text(p.label, 14, currentY);
      doc.text(`${(p.probability * 100).toFixed(2)}%`, 140, currentY);

      doc.setDrawColor(225, 233, 223);
      doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
      currentY += 6.5;
    });

    // Medical Disclaimer at footer (no academic decision support)
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    const disclaimer =
      "DISCLAIMER: This report is generated by an algorithmic deep learning research evaluation system. It does NOT constitute a clinical diagnosis or medical evaluation. All clinical decisions must be made by qualified healthcare practitioners.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 28);
    doc.text(splitDisclaimer, 14, 280);

    doc.save(`KneeAI-Report-${record.id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-lightBorder pb-6">
        <div>
          <span className="text-xs font-semibold text-sageAccent uppercase tracking-wider">
            Clinical Documentation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkGreen mt-1">
            Clinical & Research Reports
          </h1>
          <p className="text-xs text-darkGreen font-medium mt-1">
            Download timestamped PDF evaluation dossiers with 5-class distributions and metadata
          </p>
        </div>
        <Button variant="primary" href="/dashboard/analysis">
          <PlusCircle className="w-4 h-4 mr-1.5" /> New Analysis
        </Button>
      </div>

      <Card className="bg-white border-lightBorder shadow-subtle hover:border-sageAccent/60 transition-all duration-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-darkGreen font-semibold">
              Loading available reports...
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-softBg border border-lightBorder text-sageAccent flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-darkGreen">
                No Reports Generated Yet
              </h4>
              <p className="text-xs text-darkGreen font-medium max-w-sm mx-auto mt-1 mb-4">
                When an X-ray is analyzed on the New Analysis page, you can generate and download a comprehensive clinical PDF summary report.
              </p>
              <Button variant="outline" size="sm" href="/dashboard/analysis">
                Analyze An X-Ray
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-lightBorder">
              {analyses.map((record) => (
                <div
                  key={record.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-lightSage/30 hover:border-l-4 hover:border-l-sageAccent transition-all duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-darkGreen">
                        {record.filename}
                      </span>
                      <Badge variant={getGradeBadgeVariant(record.predicted_grade)}>
                        {record.predicted_grade_label} ({record.severity_label})
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-darkGreen font-semibold">
                      <span>ID: <code className="font-mono text-darkGreen font-bold">{record.id.substring(0, 8)}...</code></span>
                      <span>•</span>
                      <span>Confidence: {(record.confidence * 100).toFixed(1)}%</span>
                      <span>•</span>
                      <span>
                        {new Date(record.created_at).toLocaleDateString()} at{" "}
                        {new Date(record.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePdfForRecord(record)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
                    </Button>
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
