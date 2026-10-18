"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Cpu,
  Layers,
  Eye,
  FileCheck2,
  ArrowRight,
  CheckCircle2,
  Database,
  BarChart3,
  Sparkles,
  Info,
  ChevronRight,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  LogIn,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, KL_GRADE_DETAILS, getGradeBadgeVariant } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, signIn, signUp, signInDemo, signOut } = useAuth();

  const [authTab, setAuthTab] = useState<"login" | "signup" | "preview">("login");
  const [email, setEmail] = useState("researcher@kneeai.edu");
  const [password, setPassword] = useState("ResearchPass2026!");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!email || !password) {
      setAuthError("Please provide both email address and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setAuthError(error.message || "Failed to authenticate.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Failed to sign in. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!email || !password) {
      setAuthError("Please provide both email address and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setAuthError(error.message || "Failed to create account.");
      } else {
        setAuthSuccess("Account ready! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickDemo = async (role: "researcher" | "clinician") => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInDemo(role);
      router.push("/dashboard");
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Failed to activate demo mode.");
    } finally {
      setAuthLoading(false);
    }
  };
  const steps = [
    {
      num: "01",
      title: "Upload X-Ray",
      desc: "Drag and drop high-resolution frontal or anteroposterior knee radiographs in PNG or JPEG format.",
      icon: Upload,
    },
    {
      num: "02",
      title: "Preprocessing",
      desc: "Automatic resizing to 224×224, grayscale standardization, and optional CLAHE contrast normalization.",
      icon: Layers,
    },
    {
      num: "03",
      title: "CNN Classification",
      desc: "Transfer-learned MobileNetV2 extracts deep morphological patterns and joint space features.",
      icon: Cpu,
    },
    {
      num: "04",
      title: "Grad-CAM Explanation",
      desc: "Calculates class-activation gradients on final conv layers to illuminate joint-space narrowing & osteophytes.",
      icon: Eye,
    },
    {
      num: "05",
      title: "Diagnostic Report",
      desc: "Access full 5-class probability distributions, radiological summaries, and exportable PDF case records.",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-offwhite">
      <Navbar />

      <main className="flex-1">
        {/* ============================================================== */}
        {/* HERO SECTION                                                   */}
        {/* ============================================================== */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-surface-offwhite to-surface-offwhite border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Heading, Bio, CTAs */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>College Data Science Major Project • Decision Support</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-navy-800 tracking-tight leading-[1.15]">
                  Explainable Knee Osteoarthritis{" "}
                  <span className="text-medBlue-700">Grade Classification</span>{" "}
                  Using Deep Learning
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  An interpretable artificial intelligence platform classifying knee radiograph severity across five Kellgren–Lawrence (KL) grades, augmented with transparent <strong>Grad-CAM visual heatmaps</strong> to eliminate black-box uncertainty.
                </p>

                {/* Primary Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button variant="primary" size="lg" href="/dashboard">
                    Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                  <Button variant="outline" size="lg" href="#how-it-works">
                    Learn How It Works
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                  <div>
                    <p className="text-2xl font-bold text-navy-800">5 Grades</p>
                    <p className="text-xs text-slate-500 font-medium">Kellgren–Lawrence Scale</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-teal-600">Grad-CAM</p>
                    <p className="text-xs text-slate-500 font-medium">Visual Explainability</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-medBlue-700">MobileNetV2</p>
                    <p className="text-xs text-slate-500 font-medium">Transfer Learning</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Direct Portal Login / Sign Up / Demo Access */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md bg-white rounded-2xl p-5 shadow-elevated border border-slate-200">
                  {user ? (
                    /* ALREADY LOGGED IN STATE */
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-xs font-semibold text-navy-800">Active Researcher Session</span>
                        </div>
                        <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          Connected
                        </span>
                      </div>

                      <div className="py-6 text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-navy-800">
                            {user.user_metadata?.full_name || user.email}
                          </h3>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <p className="text-xs text-slate-600 max-w-xs mx-auto">
                          Your authenticated session is active. You can immediately launch radiograph inference, review historical KL evaluations, or export clinical reports.
                        </p>

                        <div className="pt-3 space-y-2">
                          <Button
                            variant="primary"
                            className="w-full justify-center"
                            onClick={() => router.push("/dashboard/analysis")}
                          >
                            <Upload className="w-4 h-4 mr-1.5" /> Start New Analysis
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-center"
                            onClick={() => router.push("/dashboard")}
                          >
                            Open Researcher Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                          <button
                            type="button"
                            onClick={() => signOut()}
                            className="text-xs text-slate-400 hover:text-rose-600 transition-colors pt-2 block mx-auto"
                          >
                            Sign Out of Account
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DIRECT AUTHENTICATION INTERFACE */
                    <div>
                      {/* Top Header & Tab Switcher */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                          <span className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                            Direct Portal Access
                          </span>
                        </div>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthTab("login");
                              setAuthError(null);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-colors ${
                              authTab === "login"
                                ? "bg-white text-navy-800 shadow-sm font-semibold"
                                : "text-slate-500 hover:text-navy-800"
                            }`}
                          >
                            Sign In
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthTab("signup");
                              setAuthError(null);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-colors ${
                              authTab === "signup"
                                ? "bg-white text-navy-800 shadow-sm font-semibold"
                                : "text-slate-500 hover:text-navy-800"
                            }`}
                          >
                            Sign Up
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthTab("preview")}
                            className={`px-2.5 py-1 rounded-md transition-colors ${
                              authTab === "preview"
                                ? "bg-white text-teal-700 shadow-sm font-semibold"
                                : "text-slate-500 hover:text-teal-700"
                            }`}
                            title="Inspect Sample Radiograph & Grad-CAM Hotspot"
                          >
                            Preview
                          </button>
                        </div>
                      </div>

                      {authError && (
                        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{authError}</span>
                        </div>
                      )}

                      {authSuccess && (
                        <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>{authSuccess}</span>
                        </div>
                      )}

                      {/* TAB 1: SIGN IN */}
                      {authTab === "login" && (
                        <div className="mt-4 space-y-4">
                          <form onSubmit={handleSignIn} className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-navy-800 uppercase tracking-wider mb-1">
                                Researcher Email
                              </label>
                              <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="researcher@kneeai.edu"
                                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-offwhite border border-slate-200 rounded-lg text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[11px] font-semibold text-navy-800 uppercase tracking-wider">
                                  Password
                                </label>
                                <a
                                  href="/forgot-password"
                                  className="text-[11px] text-teal-600 hover:underline"
                                >
                                  Forgot?
                                </a>
                              </div>
                              <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="password"
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-offwhite border border-slate-200 rounded-lg text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                              </div>
                            </div>

                            <Button
                              type="submit"
                              variant="primary"
                              disabled={authLoading}
                              className="w-full justify-center mt-2 shadow-sm"
                            >
                              <LogIn className="w-4 h-4 mr-1.5" />
                              {authLoading ? "Authenticating..." : "Sign In to Dashboard"}
                            </Button>
                          </form>

                          {/* Quick 1-Click Demo Access */}
                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider text-center">
                              — Or 1-Click Instant Demo Access —
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickDemo("researcher")}
                                disabled={authLoading}
                                className="p-2 text-left rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition text-xs group"
                              >
                                <div className="font-semibold text-navy-800 group-hover:text-teal-700 truncate">
                                  Dr. Alex Rivera
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  Lead Researcher
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickDemo("clinician")}
                                disabled={authLoading}
                                className="p-2 text-left rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition text-xs group"
                              >
                                <div className="font-semibold text-navy-800 group-hover:text-teal-700 truncate">
                                  Dr. Sarah Chen
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  Senior Radiologist
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: SIGN UP */}
                      {authTab === "signup" && (
                        <div className="mt-4 space-y-3">
                          <form onSubmit={handleSignUp} className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-navy-800 uppercase tracking-wider mb-1">
                                Full Name & Clinical Title
                              </label>
                              <div className="relative">
                                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  placeholder="Dr. Jordan Hayes, MD"
                                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-offwhite border border-slate-200 rounded-lg text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-navy-800 uppercase tracking-wider mb-1">
                                Institutional Email
                              </label>
                              <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="jordan.hayes@med.edu"
                                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-offwhite border border-slate-200 rounded-lg text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-navy-800 uppercase tracking-wider mb-1">
                                Password
                              </label>
                              <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="password"
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Minimum 8 characters"
                                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-offwhite border border-slate-200 rounded-lg text-navy-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                                />
                              </div>
                            </div>

                            <Button
                              type="submit"
                              variant="primary"
                              disabled={authLoading}
                              className="w-full justify-center mt-2 shadow-sm"
                            >
                              <UserPlus className="w-4 h-4 mr-1.5" />
                              {authLoading ? "Creating Account..." : "Register & Enter Dashboard"}
                            </Button>
                          </form>

                          <p className="text-[11px] text-slate-500 text-center pt-2">
                            For academic research decision support. Not a substitute for primary medical diagnosis.
                          </p>
                        </div>
                      )}

                      {/* TAB 3: SAMPLE INSPECTION PREVIEW (Preserved) */}
                      {authTab === "preview" && (
                        <div className="mt-3 space-y-3">
                          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center border border-slate-800">
                            {/* Simulated Knee Radiograph with anatomical landmarks */}
                            <svg viewBox="0 0 300 300" className="w-full h-full opacity-90">
                              <rect width="300" height="300" fill="#0C1B2A" />
                              <path
                                d="M 100 20 Q 95 80 80 120 Q 110 135 150 130 Q 190 135 220 120 Q 205 80 200 20 Z"
                                fill="#334155"
                                stroke="#64748B"
                                strokeWidth="2"
                              />
                              <path
                                d="M 85 170 Q 110 160 150 162 Q 190 160 215 170 Q 205 240 200 280 L 100 280 Q 95 240 85 170 Z"
                                fill="#334155"
                                stroke="#64748B"
                                strokeWidth="2"
                              />
                              <ellipse cx="150" cy="115" rx="26" ry="18" fill="#475569" opacity="0.6" />
                              <ellipse cx="120" cy="148" rx="28" ry="12" fill="#E2E8F0" opacity="0.15" />
                              <defs>
                                <radialGradient id="gradCamHotspotHero" cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
                                  <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.6" />
                                  <stop offset="70%" stopColor="#10B981" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                                </radialGradient>
                              </defs>
                              <circle cx="122" cy="148" r="46" fill="url(#gradCamHotspotHero)" />
                              <circle cx="178" cy="148" r="32" fill="url(#gradCamHotspotHero)" opacity="0.5" />
                            </svg>
                            <div className="absolute bottom-3 left-3 bg-navy-900/90 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] text-white border border-navy-700">
                              Grad-CAM: Medial Compartment
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-navy-800">Sample Prediction: KL Grade 3</span>
                            <Badge variant="grade3">84.6% Confidence</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5 KELLGREN-LAWRENCE GRADES SECTION                             */}
        {/* ============================================================== */}
        <section id="grades" className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 mb-2">
                Clinical Staging Criteria
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-navy-800">
                Kellgren–Lawrence (KL) Classification Standard
              </p>
              <p className="text-sm text-slate-600 mt-2">
                The global radiographic standard for assessing osteoarthritis severity across five discrete progression phases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {([0, 1, 2, 3, 4] as const).map((grade) => {
                const info = KL_GRADE_DETAILS[grade];
                return (
                  <Card key={grade} hoverEffect className="p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-black text-navy-800">
                          {grade}
                        </span>
                        <Badge variant={getGradeBadgeVariant(grade)}>{info.severity}</Badge>
                      </div>
                      <h3 className="text-sm font-bold text-navy-800 mb-2">
                        {info.label}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Class Index {grade}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }}></span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5-STEP WORKFLOW SECTION                                        */}
        {/* ============================================================== */}
        <section id="how-it-works" className="py-20 bg-surface-offwhite border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 mb-2">
                Processing Pipeline
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-navy-800">
                How KneeAI Performs Inference & Explainability
              </p>
              <p className="text-sm text-slate-600 mt-2">
                From raw radiograph ingestion to transparent gradient-based explainability in five calibrated steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="relative bg-white rounded-xl p-5 border border-slate-200 shadow-subtle flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                          {step.num}
                        </span>
                        <div className="p-2 rounded-lg bg-navy-50 text-navy-800">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-navy-800 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* ABOUT & METHODOLOGY SECTION                                    */}
        {/* ============================================================== */}
        <section id="methodology" className="py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 mb-2">
                  Explainable AI (XAI)
                </h2>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-800 mb-4">
                  Why Explainability Matters in Knee Osteoarthritis
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Manual evaluation of knee radiographs suffers from documented inter-observer discordance, particularly when differentiating subtle Grade 1 doubtful changes from Grade 2 early definite osteophytes.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  While convolutional networks achieve high benchmark accuracy, conventional models act as opaque &ldquo;black boxes.&rdquo; KneeAI integrates <strong>Gradient-weighted Class Activation Mapping (Grad-CAM)</strong> to compute the exact gradients of the target KL class score with respect to the final convolutional feature maps, visually revealing which anatomical compartments influenced the decision.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700">
                      <strong>Targeted Compartment Focus:</strong> Validates whether the network concentrates on the tibiofemoral joint space rather than image noise or radiographic border artifacts.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700">
                      <strong>Calibrated Softmax Distribution:</strong> Outputs all 5 class probabilities to illustrate model certainty versus border-line grade ambiguity.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700">
                      <strong>Audit Trail & Reporting:</strong> Generates timestamped PDF summaries designed for research discussion and multi-reader validation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Methodology Architecture Card */}
              <Card className="p-6 bg-slate-50/70 border-slate-200">
                <h4 className="text-base font-bold text-navy-800 mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-medBlue-700" />
                  Model Architecture & Parameters
                </h4>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-navy-800 block mb-1">Base Architecture:</span>
                    <span>MobileNetV2 (Pre-trained on ImageNet, fine-tuned on knee radiographs)</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-navy-800 block mb-1">Input Dimensions:</span>
                    <span>224 × 224 × 3 normalized tensors (Grayscale to 3-channel broadcast)</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-navy-800 block mb-1">Classification Head:</span>
                    <span>GlobalAveragePooling2D → Dropout(0.3) → Dense(128, ReLU) → Dense(5, Softmax)</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-navy-800 block mb-1">Explainability Layer:</span>
                    <span>Grad-CAM targeted at <code className="text-teal-700 font-mono">out_relu</code> (final convolutional feature map)</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* DATASET SPECIFICATIONS SECTION                                 */}
        {/* ============================================================== */}
        <section id="dataset" className="py-16 bg-surface-offwhite border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 mb-2">
                Dataset Specifications
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-navy-800">
                Benchmark Dataset Inspection
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Trained and evaluated on the curated Kaggle Knee Osteoarthritis radiograph collection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-5 bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-800">Dataset Scope</h4>
                    <p className="text-xs text-slate-500">Kaggle Benchmark</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Contains approximately <strong>9,786 knee X-ray images</strong> curated from clinical cohorts (OAI & MOST), categorized into five severity levels (Grade 0 through 4).
                </p>
              </Card>

              <Card className="p-5 bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-medBlue-50 text-medBlue-700">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-800">Partitioning & Splits</h4>
                    <p className="text-xs text-slate-500">Validation Protocol</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Divided into standardized Train, Validation, and Held-Out Test sets. Stratification ensures balanced proportional evaluation across under-represented severe stages.
                </p>
              </Card>

              <Card className="p-5 bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-navy-50 text-navy-800">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-800">Ethical Data Use</h4>
                    <p className="text-xs text-slate-500">Research Compliance</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All radiographs are strictly de-identified and stripped of protected health information (PHI). Used exclusively for educational decision-support modeling.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CALL TO ACTION                                                 */}
        {/* ============================================================== */}
        <section className="py-16 bg-navy-800 text-white">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Explore Explainable Radiograph Analysis?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Sign up to run new analyses, inspect heatmaps side-by-side, access comprehensive case histories, and generate PDF evaluation summaries.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button variant="primary" size="lg" href="/register">
                Create Account <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/dashboard"
                className="text-white border-white hover:bg-navy-700"
              >
                Access Dashboard
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
