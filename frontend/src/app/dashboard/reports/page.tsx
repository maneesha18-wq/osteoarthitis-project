"use client";

import React from "react";
import { PlusCircle, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800">
            Clinical & Research Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generated case reports including 5-class distributions and Grad-CAM visualizations
          </p>
        </div>
        <Button variant="primary" href="/dashboard/analysis">
          <PlusCircle className="w-4 h-4 mr-1.5" /> New Analysis
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-navy-800">
              No Reports Generated Yet
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              When an X-ray is analyzed on the New Analysis page, you can generate and download a comprehensive clinical PDF summary report.
            </p>
            <Button variant="outline" size="sm" href="/dashboard/analysis">
              Analyze An X-Ray
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
