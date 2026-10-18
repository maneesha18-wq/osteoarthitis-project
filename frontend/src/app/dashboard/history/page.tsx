"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, getGradeBadgeVariant } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { fetchAnalyses, AnalysisRecord } from "@/lib/supabase";

export default function HistoryPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

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

  // Filter logic
  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade =
      selectedGrade === "all" || item.predicted_grade.toString() === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-lightBorder pb-6">
        <div>
          <span className="text-xs font-semibold text-sageAccent uppercase tracking-wider">
            Case Audit Trail
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkGreen mt-1">
            Analysis History
          </h1>
          <p className="text-xs text-darkGreen font-medium mt-1">
            Search, filter, and inspect past radiograph evaluations belonging to your account
          </p>
        </div>
        <Button variant="primary" href="/dashboard/analysis">
          <PlusCircle className="w-4 h-4 mr-1.5" /> New Analysis
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-lightBorder shadow-subtle">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-darkGreen" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or image name..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-lightBorder rounded-lg focus:ring-sageAccent focus:border-sageAccent text-darkGreen bg-white placeholder-darkGreen/50 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-darkGreen" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-lightBorder rounded-lg focus:ring-sageAccent focus:border-sageAccent text-darkGreen bg-white font-medium"
            >
              <option value="all">All Grades (0 to 4)</option>
              <option value="0">Grade 0 (None / Normal)</option>
              <option value="1">Grade 1 (Doubtful)</option>
              <option value="2">Grade 2 (Mild)</option>
              <option value="3">Grade 3 (Moderate)</option>
              <option value="4">Grade 4 (Severe)</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end px-2 text-xs text-darkGreen font-medium">
            <span>
              Showing <strong className="font-bold">{filteredAnalyses.length}</strong> of <strong className="font-bold">{analyses.length}</strong> cases
            </span>
          </div>
        </div>
      </Card>

      {/* Table / Records Area */}
      <Card className="bg-white border-lightBorder shadow-subtle">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-darkGreen font-medium">
              Loading past analyses...
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-softBg border border-lightBorder text-sageAccent flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-darkGreen">
                {analyses.length === 0
                  ? "No Historical Records Found"
                  : "No Cases Match Selected Filters"}
              </h4>
              <p className="text-xs text-darkGreen font-medium max-w-sm mx-auto mt-1 mb-4">
                {analyses.length === 0
                  ? "Analyses submitted through the platform are saved here with their timestamps, confidence scores, and Grad-CAM records."
                  : "Try resetting your search query or grade filter to view other evaluated cases."}
              </p>
              {analyses.length === 0 ? (
                <Button variant="outline" size="sm" href="/dashboard/analysis">
                  Run First Analysis
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedGrade("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-softBg text-darkGreen font-bold border-b border-lightBorder uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Analysis ID / File</th>
                    <th className="px-6 py-3.5">Predicted KL Grade</th>
                    <th className="px-6 py-3.5">Confidence</th>
                    <th className="px-6 py-3.5">Model</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightBorder">
                  {filteredAnalyses.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-lightSage/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-darkGreen truncate max-w-xs">
                          {record.filename}
                        </div>
                        <div className="text-[11px] font-mono text-darkGreen font-medium">
                          {record.id.substring(0, 16)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getGradeBadgeVariant(record.predicted_grade)}>
                          {record.predicted_grade_label} ({record.severity_label})
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-sageAccent">
                          {(record.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-darkGreen font-medium">
                        {record.model_name} (v{record.model_version})
                      </td>
                      <td className="px-6 py-4 text-darkGreen font-medium">
                        {new Date(record.created_at).toLocaleDateString()} at{" "}
                        {new Date(record.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-darkGreen bg-lightSage/40 px-2.5 py-0.5 rounded-full border border-lightBorder">
                          <CheckCircle2 className="w-3 h-3 text-sageAccent" /> Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
