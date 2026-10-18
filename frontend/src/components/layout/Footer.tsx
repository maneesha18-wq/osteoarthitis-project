import React from "react";
import Link from "next/link";
import { Activity, ShieldAlert, Award, FileText, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-900 text-slate-300 pt-16 pb-12 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-navy-800">
          {/* Column 1: Brand & Academic Statement */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Knee<span className="text-teal-500">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explainable Knee Osteoarthritis Grade Classification Using Deep Learning. An academic Data Science major research initiative aimed at providing interpretable radiological decision support.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <Award className="w-4 h-4" />
              <span>Academic Capstone Project</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-teal-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-teal-400 transition-colors">
                  About Project
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-teal-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#methodology" className="hover:text-teal-400 transition-colors">
                  Methodology & Grad-CAM
                </Link>
              </li>
              <li>
                <Link href="/#dataset" className="hover:text-teal-400 transition-colors">
                  Dataset Specifications
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Clinical System Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Grading Reference
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><strong className="text-slate-200">Grade 0:</strong> Normal / No Radiographic OA</li>
              <li><strong className="text-slate-200">Grade 1:</strong> Doubtful Joint Space Narrowing</li>
              <li><strong className="text-slate-200">Grade 2:</strong> Mild Osteoarthritis (Definite Osteophytes)</li>
              <li><strong className="text-slate-200">Grade 3:</strong> Moderate Multi-Osteophytes</li>
              <li><strong className="text-slate-200">Grade 4:</strong> Severe Joint Narrowing & Sclerosis</li>
            </ul>
          </div>

          {/* Column 4: External Resources & Docs */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Resources & Dataset
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.kaggle.com/datasets/shashwatwork/knee-osteoarthritis-dataset-with-severity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-teal-400 transition-colors"
                >
                  Kaggle Knee OA Dataset <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://arxiv.org/abs/1610.02391"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-teal-400 transition-colors"
                >
                  Grad-CAM Paper (Selvaraju et al.) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300">
                  <FileText className="w-3.5 h-3.5" /> Researcher Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Medical Disclaimer Box */}
        <div className="mt-8 p-4 rounded-xl bg-navy-800/80 border border-navy-700/80 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-amber-300 font-semibold">Educational & Research Disclaimer:</strong> KneeAI is designed exclusively for research, educational demonstrations, and comparative decision support. Predictions, probability distributions, and Grad-CAM activations are computed using algorithmic models and do not replace certified radiological examination or medical advice.
          </div>
        </div>

        {/* Copyright and team */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} KneeAI Research Initiative. Built for Data Science Major Project.</p>
          <p>Kellgren-Lawrence Grading • MobileNetV2 • Grad-CAM Visual Explainability</p>
        </div>
      </div>
    </footer>
  );
};
