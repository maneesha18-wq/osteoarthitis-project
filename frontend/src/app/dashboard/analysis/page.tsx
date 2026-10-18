"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Eye,
  RotateCcw,
  Sparkles,
  Info,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getGradeBadgeVariant, KL_GRADE_DETAILS } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { saveAnalysis } from "@/lib/supabase";
import jsPDF from "jspdf";

interface PredictionResponse {
  analysis_id: string;
  predicted_class: number;
  predicted_grade: string;
  severity_label: string;
  confidence: number;
  probabilities: {
    grade: number;
    label: string;
    probability: number;
  }[];
  model_name: string;
  model_version: string;
  timestamp: string;
  preprocessing_applied: {
    resized_to: number[];
    clahe_enabled: boolean;
    normalized: boolean;
  };
  inference_time_ms: number;
  original_image_base64: string;
  gradcam_heatmap_base64: string;
  gradcam_overlay_base64: string;
  interpretation_notes?: string;
}

export default function AnalysisPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [applyClahe, setApplyClahe] = useState(true);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [activeImageView, setActiveImageView] = useState<
    "side-by-side" | "overlay" | "heatmap" | "original"
  >("side-by-side");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleZoomIn = () =>
    setZoomLevel((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.5));
  const handleZoomOut = () =>
    setZoomLevel((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"];

  const handleFileSelect = (selectedFile: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError(
        `Unsupported file type (${selectedFile.type}). Please select a standard JPEG, PNG, or TIFF knee radiograph.`
      );
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        `File size (${(selectedFile.size / (1024 * 1024)).toFixed(
          2
        )} MB) exceeds the 10 MB limit.`
      );
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const runAnalysis = async () => {
    if (!file) {
      setError("Please select an X-ray image before running analysis.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(25);

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const apiUrl = rawApiUrl.replace(/\/+$/, "");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clahe", applyClahe ? "true" : "false");

    try {
      setUploadProgress(60);
      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);

      if (!response.ok) {
        let errMessage = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || errMessage;
        } catch {
          // fallback
        }
        throw new Error(errMessage);
      }

      const data: PredictionResponse = await response.json();
      setResult(data);
      setUploadProgress(100);

      // Persist analysis record to Supabase with user RLS isolation
      await saveAnalysis(
        {
          id: data.analysis_id,
          user_id: user?.id,
          filename: file.name,
          file_size_bytes: file.size,
          predicted_grade: data.predicted_class,
          predicted_grade_label: data.predicted_grade,
          severity_label: data.severity_label,
          confidence: data.confidence,
          probabilities: data.probabilities,
          model_name: data.model_name,
          model_version: data.model_version,
          inference_time_ms: data.inference_time_ms,
          clahe_applied: applyClahe,
          has_gradcam: true,
          notes: data.interpretation_notes,
          created_at: data.timestamp,
          original_image_base64: data.original_image_base64,
          gradcam_heatmap_base64: data.gradcam_heatmap_base64,
          gradcam_overlay_base64: data.gradcam_overlay_base64,
        },
        user?.id
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to communicate with prediction service. Ensure the FastAPI backend is running.";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadPdfReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner
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
    doc.text(`Analysis ID: ${result.analysis_id}`, 14, 38);
    doc.text(`Timestamp: ${new Date(result.timestamp).toUTCString()}`, 14, 43);
    doc.text(`Model: ${result.model_name} (v${result.model_version}) • Latency: ${result.inference_time_ms.toFixed(1)} ms`, 14, 48);

    // Staging Card
    doc.setFillColor(245, 248, 244);
    doc.roundedRect(14, 53, pageWidth - 28, 22, 2.5, 2.5, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 69, 54);
    doc.text("Predicted Severity Staging:", 20, 62);

    doc.setFontSize(12);
    doc.setTextColor(107, 148, 117); // Sage Green Accent #6B9475
    doc.text(
      `${result.predicted_grade} — ${result.severity_label} (${(
        result.confidence * 100
      ).toFixed(1)}% Confidence)`,
      20,
      69
    );

    // Radiograph & Grad-CAM Heatmap Images Section
    let currentY = 82;
    const hasOriginal = !!result.original_image_base64;
    const hasHeatmap = !!(result.gradcam_overlay_base64 || result.gradcam_heatmap_base64);

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
          const origSrc = result.original_image_base64.startsWith("data:")
            ? result.original_image_base64
            : `data:image/png;base64,${result.original_image_base64}`;
          doc.addImage(origSrc, "PNG", 14, currentY, imgWidth, imgHeight);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(80, 100, 90);
          doc.text("Original Radiograph (AP)", 14, currentY + imgHeight + 4);
        } catch {
          // fallback if format issue
        }
      }

      if (hasHeatmap) {
        try {
          const heatmapData = result.gradcam_overlay_base64 || result.gradcam_heatmap_base64;
          const heatmapSrc = heatmapData.startsWith("data:")
            ? heatmapData
            : `data:image/png;base64,${heatmapData}`;
          doc.addImage(heatmapSrc, "PNG", 110, currentY, imgWidth, imgHeight);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(80, 100, 90);
          doc.text("Articular Cartilage & Joint Map", 110, currentY + imgHeight + 4);
        } catch {
          // fallback if format issue
        }
      }

      currentY += imgHeight + 11;
    }

    // Probability Distribution Section
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 69, 54);
    doc.text("5-Class Probability Distribution", 14, currentY);
    currentY += 6;

    result.probabilities.forEach((p) => {
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

    doc.save(`KneeAI-Analysis-${result.analysis_id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-lightBorder pb-6">
        <div>
          <span className="text-xs font-semibold text-sageAccent uppercase tracking-wider">
            Inference & Explainability
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkGreen mt-1">
            New Knee Radiograph Analysis
          </h1>
          <p className="text-xs text-darkGreen font-medium mt-1">
            Upload an anteroposterior radiograph to compute KL grade and Grad-CAM attention heatmaps
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" /> Analyze Another
            </Button>
            <Button variant="primary" size="sm" onClick={downloadPdfReport}>
              <Download className="w-4 h-4 mr-1.5" /> Export PDF Report
            </Button>
          </div>
        )}
      </div>

      {/* Medical research advisory notice */}
      <div className="p-3.5 rounded-xl bg-softBg border border-lightBorder flex items-start gap-3">
        <Info className="w-4 h-4 text-sageAccent shrink-0 mt-0.5" />
        <p className="text-xs text-darkGreen leading-relaxed font-medium">
          <strong className="text-darkGreen font-bold">Research Notice:</strong> This system evaluates radiograph features using deep learning for evaluation. Predictions and Grad-CAM activations do not replace certified radiological examination.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Inference Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Flow: Upload Zone or Results Display */}
      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Drop Zone */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6 bg-white border-lightBorder shadow-subtle hover:border-sageAccent/60 transition-all duration-200">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  file
                    ? "border-sageAccent bg-lightSage/20"
                    : "border-lightBorder hover:border-sageAccent hover:bg-lightSage/10 cursor-pointer"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) =>
                    e.target.files &&
                    e.target.files[0] &&
                    handleFileSelect(e.target.files[0])
                  }
                  accept="image/jpeg,image/png,image/webp,image/tiff"
                  className="hidden"
                />

                {!file ? (
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-full bg-softBg border border-lightBorder text-sageAccent flex items-center justify-center mx-auto shadow-subtle">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-darkGreen">
                        Drag & Drop Knee Radiograph Here
                      </p>
                      <p className="text-xs text-darkGreen font-medium mt-1">
                        or click to browse files from your computer
                      </p>
                    </div>
                    <div className="flex justify-center gap-2 text-xs text-darkGreen font-medium">
                      <span>Supported: PNG, JPEG, TIFF</span>
                      <span>•</span>
                      <span>Max file size: 10 MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previewUrl && (
                      <div className="relative max-w-xs mx-auto aspect-square rounded-lg overflow-hidden border border-lightBorder bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Radiograph Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-darkGreen truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-darkGreen font-medium">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                      >
                        Remove Image
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Preprocessing Options */}
              <div className="mt-6 pt-5 border-t border-lightBorder flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyClahe}
                    onChange={(e) => setApplyClahe(e.target.checked)}
                    className="rounded text-sageAccent focus:ring-sageAccent border-lightBorder h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-darkGreen block">
                      Apply CLAHE Preprocessing
                    </span>
                    <span className="text-xs text-darkGreen font-medium block">
                      Enhances trabecular bone & subchondral contrast
                    </span>
                  </div>
                </label>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={runAnalysis}
                  disabled={!file || isUploading}
                  isLoading={isUploading}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" /> Analyze X-Ray
                </Button>
              </div>

              {/* Progress bar during analysis */}
              {isUploading && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-darkGreen font-medium">
                    <span>Running MobileNetV2 inference & Grad-CAM...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-lightSage/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sageAccent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Radiograph Guidance Checklist */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-white border-lightBorder shadow-subtle hover:border-sageAccent/60 transition-all duration-200">
              <CardHeader
                title="Radiograph Checklist"
                subtitle="Ensure optimal accuracy for inference"
              />
              <CardContent className="space-y-3 text-xs text-darkGreen font-medium">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sageAccent shrink-0 mt-0.5" />
                  <span>Weight-bearing Anteroposterior (AP) or Posteroanterior (PA) view.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sageAccent shrink-0 mt-0.5" />
                  <span>Tibiofemoral joint space clearly centered without metal occlusion.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sageAccent shrink-0 mt-0.5" />
                  <span>Image free from major motion blur or excessive magnification artifacts.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4 bg-softBg border border-lightBorder text-xs text-darkGreen font-medium space-y-2 hover:border-sageAccent/60 transition-all duration-200">
              <span className="font-bold text-darkGreen block">KL Scale Reminder</span>
              <p>
                <strong className="text-darkGreen">Grade 0:</strong> Normal • <strong className="text-darkGreen">Grade 1:</strong> Doubtful • <strong className="text-darkGreen">Grade 2:</strong> Mild • <strong className="text-darkGreen">Grade 3:</strong> Moderate • <strong className="text-darkGreen">Grade 4:</strong> Severe
              </p>
            </Card>
          </div>
        </div>
      ) : (
        /* ================================================================ */
        /* RESULTS VIEW                                                    */
        /* ================================================================ */
        <div className="space-y-8">
          {/* Main Grade Summary Banner */}
          <Card className="p-6 bg-white border border-lightBorder shadow-subtle hover:border-sageAccent/60 transition-all duration-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={getGradeBadgeVariant(result.predicted_class)}
                    size="md"
                    className="text-sm px-3 py-1 font-bold"
                  >
                    {result.predicted_grade} — {result.severity_label}
                  </Badge>
                  <span className="text-xs text-darkGreen font-medium">
                    Analysis ID: <code className="font-mono text-darkGreen font-bold">{result.analysis_id.substring(0, 12)}...</code>
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-darkGreen">
                  {KL_GRADE_DETAILS[result.predicted_class]?.label}:{" "}
                  {KL_GRADE_DETAILS[result.predicted_class]?.severity}
                </h2>

                <p className="text-xs sm:text-sm text-darkGreen leading-relaxed font-medium">
                  {KL_GRADE_DETAILS[result.predicted_class]?.description}
                </p>

                <div className="flex flex-wrap gap-4 pt-2 text-xs text-darkGreen font-medium">
                  <span><strong className="text-darkGreen font-bold">Model:</strong> {result.model_name} (v{result.model_version})</span>
                  <span>•</span>
                  <span><strong className="text-darkGreen font-bold">Latency:</strong> {result.inference_time_ms.toFixed(1)} ms</span>
                  <span>•</span>
                  <span><strong className="text-darkGreen font-bold">Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="md:col-span-4 text-center md:text-right border-t md:border-t-0 md:border-l border-lightBorder pt-4 md:pt-0 md:pl-6">
                <div className="inline-block text-center p-4 rounded-xl bg-softBg border border-lightBorder">
                  <span className="text-xs font-bold text-darkGreen block">
                    Confidence Score
                  </span>
                  <span className="text-3xl font-black text-sageAccent block mt-1">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-darkGreen font-semibold block mt-1">
                    Highest Softmax Logit
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Radiograph & Grad-CAM Visualization Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4 bg-white border border-lightBorder shadow-subtle">
                {/* Visualizer controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-lightBorder mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-sageAccent" />
                    <span className="text-xs font-bold text-darkGreen">
                      Explainability Visualization
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex items-center gap-1 bg-lightSage/30 border border-lightBorder p-1 rounded-lg text-xs font-medium">
                      <button
                        onClick={() => setActiveImageView("side-by-side")}
                        className={`px-2 py-1 rounded-md transition-all ${
                          activeImageView === "side-by-side"
                            ? "bg-white text-darkGreen shadow-subtle border border-lightBorder/60 font-semibold"
                            : "text-darkGreen-muted hover:text-darkGreen"
                        }`}
                      >
                        Side by Side
                      </button>
                      <button
                        onClick={() => setActiveImageView("overlay")}
                        className={`px-2 py-1 rounded-md transition-all ${
                          activeImageView === "overlay"
                            ? "bg-white text-darkGreen shadow-subtle border border-lightBorder/60 font-semibold"
                            : "text-darkGreen-muted hover:text-darkGreen"
                        }`}
                      >
                        Cartilage Map (ROI)
                      </button>
                      <button
                        onClick={() => setActiveImageView("heatmap")}
                        className={`px-2 py-1 rounded-md transition-all ${
                          activeImageView === "heatmap"
                            ? "bg-white text-darkGreen shadow-subtle border border-lightBorder/60 font-semibold"
                            : "text-darkGreen-muted hover:text-darkGreen"
                        }`}
                      >
                        Heatmap
                      </button>
                      <button
                        onClick={() => setActiveImageView("original")}
                        className={`px-2 py-1 rounded-md transition-all ${
                          activeImageView === "original"
                            ? "bg-white text-darkGreen shadow-subtle border border-lightBorder/60 font-semibold"
                            : "text-darkGreen-muted hover:text-darkGreen"
                        }`}
                      >
                        Original
                      </button>
                    </div>

                    {/* Interactive Zoom Controls */}
                    <div className="flex items-center gap-1 bg-lightSage/30 border border-lightBorder px-2 py-1 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 0.5}
                        className="p-1 rounded text-darkGreen hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleResetZoom}
                        className="px-1.5 py-0.5 text-[11px] font-bold text-darkGreen hover:bg-white rounded transition cursor-pointer"
                        title="Reset Zoom"
                      >
                        {Math.round(zoomLevel * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 3.5}
                        className="p-1 rounded text-darkGreen hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(true)}
                        className="p-1 ml-0.5 rounded text-darkGreen hover:bg-white border-l border-lightBorder pl-1.5 transition cursor-pointer"
                        title="Open Fullscreen Lightbox"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Panels */}
                {activeImageView === "side-by-side" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-darkGreen-muted uppercase tracking-wider block">
                        Original Radiograph
                      </span>
                      <div className="aspect-square rounded-lg overflow-hidden border border-lightBorder bg-black flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${result.original_image_base64}`}
                          alt="Original Radiograph"
                          className="w-full h-full object-contain transition-transform duration-150 ease-out"
                          style={{ transform: `scale(${zoomLevel})` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-sageAccent uppercase tracking-wider block">
                        Articular Cartilage & Joint Map
                      </span>
                      <div className="aspect-square rounded-lg overflow-hidden border border-lightBorder bg-black flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${result.gradcam_overlay_base64}`}
                          alt="Articular Cartilage Map"
                          className="w-full h-full object-contain transition-transform duration-150 ease-out"
                          style={{ transform: `scale(${zoomLevel})` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeImageView === "overlay" && (
                  <div className="max-w-md mx-auto aspect-square rounded-lg overflow-hidden border border-lightBorder bg-black flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.gradcam_overlay_base64}`}
                      alt="Grad-CAM Overlay"
                      className="w-full h-full object-contain transition-transform duration-150 ease-out"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  </div>
                )}

                {activeImageView === "heatmap" && (
                  <div className="max-w-md mx-auto aspect-square rounded-lg overflow-hidden border border-lightBorder bg-black flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.gradcam_heatmap_base64}`}
                      alt="Grad-CAM Heatmap"
                      className="w-full h-full object-contain transition-transform duration-150 ease-out"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  </div>
                )}

                {activeImageView === "original" && (
                  <div className="max-w-md mx-auto aspect-square rounded-lg overflow-hidden border border-lightBorder bg-black flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.original_image_base64}`}
                      alt="Original Radiograph"
                      className="w-full h-full object-contain transition-transform duration-150 ease-out"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  </div>
                )}

                {/* Explainability Interpretation Footer */}
                <div className="mt-4 p-3 bg-softBg rounded-lg border border-lightBorder text-xs text-darkGreen leading-relaxed font-medium">
                  <strong className="text-darkGreen font-bold block mb-0.5">Articular Cartilage & Joint-Space Mapping (Clinical Color Scale):</strong>
                  High-contrast pseudocolor mapping highlights articular cartilage thickness, joint-space narrowing (JSN), and subchondral bone changes. The calibrated colorbar on the left indicates relative attention intensity (0.0 to 1.0, blue to red), with ROI 1 and ROI 2 identifying the medial and lateral joint space compartments.
                </div>
              </Card>

              {/* Fullscreen Lightbox Modal */}
              {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        High-Resolution Radiograph Inspector
                      </span>
                      <span className="text-xs text-[#A0B9A7]">
                        ({result.predicted_grade} — {result.severity_label})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2 py-1 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={handleZoomOut}
                          disabled={zoomLevel <= 0.5}
                          className="p-1 rounded text-white hover:bg-white/20 disabled:opacity-30 transition cursor-pointer"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleResetZoom}
                          className="px-2 py-0.5 text-xs font-bold text-white hover:bg-white/20 rounded transition cursor-pointer"
                          title="Reset Zoom"
                        >
                          {Math.round(zoomLevel * 100)}%
                        </button>
                        <button
                          type="button"
                          onClick={handleZoomIn}
                          disabled={zoomLevel >= 3.5}
                          className="p-1 rounded text-white hover:bg-white/20 disabled:opacity-30 transition cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                        title="Close Inspector"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-full">
                      <div className="space-y-2 text-center">
                        <span className="text-xs font-semibold text-white/70">
                          Original Radiograph
                        </span>
                        <div className="overflow-auto max-h-[75vh] max-w-[45vw] p-2 bg-black rounded-xl border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${result.original_image_base64}`}
                            alt="Original Radiograph Fullscreen"
                            className="radiograph-crisp max-h-[70vh] object-contain select-none transition-transform duration-100 ease-out"
                            style={{ transform: `scale(${zoomLevel})` }}
                            draggable={false}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-center">
                        <span className="text-xs font-semibold text-[#82C798]">
                          Grad-CAM Attention Overlay
                        </span>
                        <div className="overflow-auto max-h-[75vh] max-w-[45vw] p-2 bg-black rounded-xl border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${result.gradcam_overlay_base64}`}
                            alt="Grad-CAM Overlay Fullscreen"
                            className="radiograph-crisp max-h-[70vh] object-contain select-none transition-transform duration-100 ease-out"
                            style={{ transform: `scale(${zoomLevel})` }}
                            draggable={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: 5-Class Probability Distribution Chart */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-white border-lightBorder shadow-subtle">
                <CardHeader
                  title="5-Class Probability Distribution"
                  subtitle="Softmax output across all Kellgren-Lawrence grades"
                />
                <CardContent className="space-y-4">
                  {result.probabilities.map((item) => {
                    const isWinner = item.grade === result.predicted_class;
                    const pct = (item.probability * 100).toFixed(1);
                    const gradeDetail = KL_GRADE_DETAILS[item.grade];

                    return (
                      <div key={item.grade} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-semibold ${
                              isWinner ? "text-darkGreen font-bold" : "text-darkGreen font-medium"
                            }`}
                          >
                            {item.label} ({gradeDetail?.severity})
                          </span>
                          <span
                            className={`font-mono text-xs ${
                              isWinner ? "text-sageAccent font-bold" : "text-darkGreen font-semibold"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>

                        <div className="w-full bg-lightSage/40 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isWinner ? "bg-sageAccent" : "bg-lightSage"
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Action Buttons Card */}
              <Card className="p-4 bg-white border border-lightBorder shadow-subtle space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={downloadPdfReport}
                >
                  <Download className="w-4 h-4 mr-1.5" /> Download Case PDF
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Start Another Analysis
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  href="/dashboard"
                  className="w-full justify-center"
                >
                  Return to Dashboard
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
