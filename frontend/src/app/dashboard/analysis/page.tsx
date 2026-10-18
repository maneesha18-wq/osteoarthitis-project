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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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

    // Header
    doc.setFillColor(22, 50, 79); // Deep Navy
    doc.rect(0, 0, pageWidth, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("KneeAI — Radiographic Analysis Report", 14, 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Kellgren-Lawrence Grading with Grad-CAM Explainability", 14, 21);

    // Metadata section
    doc.setTextColor(22, 50, 79);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Analysis Dossier", 14, 36);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70, 80, 95);
    doc.text(`Analysis ID: ${result.analysis_id}`, 14, 43);
    doc.text(`Timestamp: ${new Date(result.timestamp).toUTCString()}`, 14, 49);
    doc.text(`Model: ${result.model_name} (v${result.model_version})`, 14, 55);
    doc.text(`Inference Latency: ${result.inference_time_ms.toFixed(1)} ms`, 14, 61);

    // Result summary
    doc.setFillColor(244, 247, 248);
    doc.roundedRect(14, 68, pageWidth - 28, 28, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 50, 79);
    doc.text("Predicted Severity Staging:", 20, 78);

    doc.setFontSize(13);
    doc.setTextColor(77, 150, 144);
    doc.text(
      `${result.predicted_grade} — ${result.severity_label} (${(
        result.confidence * 100
      ).toFixed(1)}% Confidence)`,
      20,
      86
    );

    // Probability Table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 50, 79);
    doc.text("5-Class Probability Distribution", 14, 108);

    let yPos = 116;
    result.probabilities.forEach((p) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text(p.label, 14, yPos);
      doc.text(`${(p.probability * 100).toFixed(2)}%`, 140, yPos);

      // Draw progress line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
      yPos += 8;
    });

    // Medical Disclaimer at footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const disclaimer =
      "DISCLAIMER: This report is generated by an experimental research system for academic decision support only. It does NOT constitute a clinical diagnosis or medical evaluation. All decisions must be made by qualified healthcare practitioners.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 28);
    doc.text(splitDisclaimer, 14, 275);

    doc.save(`KneeAI-Analysis-${result.analysis_id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
            Inference & Explainability
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800 mt-1">
            New Knee Radiograph Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
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
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Academic Decision Support:</strong> This system evaluates radiograph features using deep learning for educational research. Predictions and Grad-CAM activations do not replace certified radiological examination.
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
            <Card className="p-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  file
                    ? "border-teal-400 bg-teal-50/20"
                    : "border-slate-300 hover:border-teal-500 hover:bg-slate-50/50 cursor-pointer"
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
                    <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-subtle">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-800">
                        Drag & Drop Knee Radiograph Here
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        or click to browse files from your computer
                      </p>
                    </div>
                    <div className="flex justify-center gap-2 text-[11px] text-slate-400">
                      <span>Supported: PNG, JPEG, TIFF</span>
                      <span>•</span>
                      <span>Max file size: 10 MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previewUrl && (
                      <div className="relative max-w-xs mx-auto aspect-square rounded-lg overflow-hidden border border-slate-200 bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Radiograph Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-navy-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
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
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyClahe}
                    onChange={(e) => setApplyClahe(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-navy-800 block">
                      Apply CLAHE Preprocessing
                    </span>
                    <span className="text-[11px] text-slate-500 block">
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
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Running MobileNetV2 inference & Grad-CAM...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Radiograph Guidance Checklist */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader
                title="Radiograph Checklist"
                subtitle="Ensure optimal accuracy for inference"
              />
              <CardContent className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Weight-bearing Anteroposterior (AP) or Posteroanterior (PA) view.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Tibiofemoral joint space clearly centered without metal occlusion.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Image free from major motion blur or excessive magnification artifacts.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4 bg-slate-50 border-slate-200 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-navy-800 block">KL Scale Reminder</span>
              <p>
                <strong>Grade 0:</strong> Normal • <strong>Grade 1:</strong> Doubtful • <strong>Grade 2:</strong> Mild • <strong>Grade 3:</strong> Moderate • <strong>Grade 4:</strong> Severe
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
          <Card className="p-6 bg-white border-slate-200 shadow-card">
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
                  <span className="text-xs text-slate-400">
                    Analysis ID: <code className="font-mono text-slate-600">{result.analysis_id.substring(0, 12)}...</code>
                  </span>
                </div>

                <h2 className="text-2xl font-black text-navy-800">
                  {KL_GRADE_DETAILS[result.predicted_class]?.label}:{" "}
                  {KL_GRADE_DETAILS[result.predicted_class]?.severity}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {KL_GRADE_DETAILS[result.predicted_class]?.description}
                </p>

                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                  <span><strong>Model:</strong> {result.model_name} (v{result.model_version})</span>
                  <span>•</span>
                  <span><strong>Latency:</strong> {result.inference_time_ms.toFixed(1)} ms</span>
                  <span>•</span>
                  <span><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="md:col-span-4 text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="inline-block text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block">
                    Confidence Score
                  </span>
                  <span className="text-3xl font-black text-teal-600 block mt-1">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Highest Softmax Logit
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Radiograph & Grad-CAM Visualization Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4">
                {/* Visualizer controls */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-navy-800">
                      Explainability Visualization
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setActiveImageView("side-by-side")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeImageView === "side-by-side"
                          ? "bg-white text-navy-800 shadow-sm font-bold"
                          : "text-slate-600 hover:text-navy-800"
                      }`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setActiveImageView("overlay")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeImageView === "overlay"
                          ? "bg-white text-navy-800 shadow-sm font-bold"
                          : "text-slate-600 hover:text-navy-800"
                      }`}
                    >
                      Overlay
                    </button>
                    <button
                      onClick={() => setActiveImageView("heatmap")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeImageView === "heatmap"
                          ? "bg-white text-navy-800 shadow-sm font-bold"
                          : "text-slate-600 hover:text-navy-800"
                      }`}
                    >
                      Heatmap
                    </button>
                    <button
                      onClick={() => setActiveImageView("original")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeImageView === "original"
                          ? "bg-white text-navy-800 shadow-sm font-bold"
                          : "text-slate-600 hover:text-navy-800"
                      }`}
                    >
                      Original
                    </button>
                  </div>
                </div>

                {/* Display Panels */}
                {activeImageView === "side-by-side" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Original Radiograph
                      </span>
                      <div className="aspect-square rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${result.original_image_base64}`}
                          alt="Original Radiograph"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block">
                        Grad-CAM Attention Overlay
                      </span>
                      <div className="aspect-square rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${result.gradcam_overlay_base64}`}
                          alt="Grad-CAM Overlay"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeImageView === "overlay" && (
                  <div className="max-w-md mx-auto aspect-square rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.gradcam_overlay_base64}`}
                      alt="Grad-CAM Overlay"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {activeImageView === "heatmap" && (
                  <div className="max-w-md mx-auto aspect-square rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.gradcam_heatmap_base64}`}
                      alt="Grad-CAM Heatmap"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {activeImageView === "original" && (
                  <div className="max-w-md mx-auto aspect-square rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.original_image_base64}`}
                      alt="Original Radiograph"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Explainability Interpretation Footer */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong className="text-navy-800 block mb-0.5">What this Grad-CAM heatmap shows:</strong>
                  The colored regions indicate areas in the convolutional feature maps that contributed positively toward the predicted <strong>{result.predicted_grade}</strong> class. Warm zones (red/orange) represent the highest activation weights, typically corresponding to joint-space narrowing, marginal osteophytic spurs, or subchondral sclerosis.
                </div>
              </Card>
            </div>

            {/* Right Column: 5-Class Probability Distribution Chart */}
            <div className="lg:col-span-5 space-y-6">
              <Card>
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
                              isWinner ? "text-navy-900 font-bold" : "text-slate-600"
                            }`}
                          >
                            {item.label} ({gradeDetail?.severity})
                          </span>
                          <span
                            className={`font-mono text-xs ${
                              isWinner ? "text-teal-600 font-bold" : "text-slate-500"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isWinner ? "bg-teal-600" : "bg-slate-300"
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
              <Card className="p-4 space-y-3">
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
