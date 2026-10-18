"use client";

import React, { useState } from "react";
import { History, Search, Filter, Calendar, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800">
            Analysis History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and inspect past radiograph evaluations and Grad-CAM explanations
          </p>
        </div>
        <Button variant="primary" href="/dashboard/analysis">
          <PlusCircle className="w-4 h-4 mr-1.5" /> New Analysis
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Analysis ID or filename..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-navy-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-navy-900 bg-white"
            >
              <option value="all">All Grades (0 to 4)</option>
              <option value="0">Grade 0 (None / Normal)</option>
              <option value="1">Grade 1 (Doubtful)</option>
              <option value="2">Grade 2 (Mild)</option>
              <option value="3">Grade 3 (Moderate)</option>
              <option value="4">Grade 4 (Severe)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-navy-900 bg-white">
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table / Records Area */}
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-navy-800">
              No Historical Records Found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Analyses submitted through the platform are logged with their class probabilities, timestamps, and Grad-CAM records once saved.
            </p>
            <Button variant="outline" size="sm" href="/dashboard/analysis">
              Run New Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
