import React from "react";
import Link from "next/link";
import { Activity, ShieldAlert, Award, FileText, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-darkBrown-muted pt-16 pb-12 border-t border-lightBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-lightBorder">
          {/* Column 1: Brand & Academic Statement */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warmWhite border border-lightBorder flex items-center justify-center text-beigeAccent">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-xl text-darkBrown tracking-tight">
                Knee<span className="text-beigeAccent">AI</span>
              </span>
            </div>
            <p className="text-xs text-darkBrown-muted leading-relaxed">
              Explainable Knee Osteoarthritis Grade Classification Using Deep Learning. An academic Data Science major research initiative aimed at providing interpretable radiological decision support.
            </p>
            <div className="flex items-center gap-2 text-xs text-beigeAccent font-medium">
              <Award className="w-4 h-4" />
              <span>Academic Capstone Project</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-darkBrown uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-darkBrown transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-darkBrown transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-darkBrown transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-darkBrown transition-colors">
                  Researcher Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Clinical System Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-darkBrown uppercase tracking-wider">
              Grading Reference
            </h4>
            <ul className="space-y-1.5 text-xs text-darkBrown-muted">
              <li><strong className="text-darkBrown">Grade 0:</strong> Normal / No Radiographic OA</li>
              <li><strong className="text-darkBrown">Grade 1:</strong> Doubtful Joint Space Narrowing</li>
              <li><strong className="text-darkBrown">Grade 2:</strong> Mild Osteoarthritis (Definite Osteophytes)</li>
              <li><strong className="text-darkBrown">Grade 3:</strong> Moderate Multi-Osteophytes</li>
              <li><strong className="text-darkBrown">Grade 4:</strong> Severe Joint Narrowing & Sclerosis</li>
            </ul>
          </div>

          {/* Column 4: External Resources & Docs */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-darkBrown uppercase tracking-wider">
              Resources & Dataset
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.kaggle.com/datasets/shashwatwork/knee-osteoarthritis-dataset-with-severity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-darkBrown transition-colors"
                >
                  Kaggle Knee OA Dataset <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://arxiv.org/abs/1610.02391"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-darkBrown transition-colors"
                >
                  Grad-CAM Paper (Selvaraju et al.) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-beigeAccent hover:text-beigeAccent-hover">
                  <FileText className="w-3.5 h-3.5" /> Researcher Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Medical Disclaimer Box */}
        <div className="mt-8 p-4 rounded-xl bg-warmWhite border border-lightBorder flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-softBeige text-darkBrown shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs text-darkBrown-muted leading-relaxed">
            <strong className="text-darkBrown font-semibold">Educational & Research Disclaimer:</strong> KneeAI is designed exclusively for research, educational demonstrations, and comparative decision support. Predictions, probability distributions, and Grad-CAM activations are computed using algorithmic models and do not replace certified radiological examination or medical advice.
          </div>
        </div>

        {/* Copyright and team */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-darkBrown-muted gap-4">
          <p>© {new Date().getFullYear()} KneeAI Research Initiative. Built for Data Science Major Project.</p>
          <p>Kellgren-Lawrence Grading • MobileNetV2 • Grad-CAM Visual Explainability</p>
        </div>
      </div>
    </footer>
  );
};
