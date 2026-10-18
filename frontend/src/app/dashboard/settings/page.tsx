"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Laptop, Sun, Moon, Sparkles } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ThemeMode = "system" | "light" | "dark";

export default function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>("system");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kneeai_theme") as ThemeMode | null;
      if (saved) {
        setSelectedTheme(saved);
      }
    }
  }, []);

  const handleSelectTheme = (theme: ThemeMode) => {
    setSelectedTheme(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("kneeai_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("kneeai_theme", selectedTheme);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const themeOptions: {
    id: ThemeMode;
    title: string;
    description: string;
    icon: typeof Sun;
  }[] = [
    {
      id: "system",
      title: "System Preference",
      description: "Automatically matches your operating system appearance",
      icon: Laptop,
    },
    {
      id: "light",
      title: "Light Theme",
      description: "Crisp Sage Green & White clinical interface with optimal daytime contrast",
      icon: Sun,
    },
    {
      id: "dark",
      title: "Dark Theme",
      description: "Deep medical dark green palette designed to reduce eye strain in low-light environments",
      icon: Moon,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-lightBorder pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-darkGreen">
          Application Settings
        </h1>
        <p className="text-xs text-darkGreen font-medium mt-1">
          Customize visual theme, display preferences, and workstation experience
        </p>
      </div>

      <Card className="bg-white border-lightBorder shadow-subtle hover:border-sageAccent transition-all duration-200">
        <CardHeader
          title="Appearance & Theme"
          subtitle="Select your preferred interface display mode across sessions"
        />
        <CardContent>
          {isSaved && (
            <div className="mb-5 p-3 rounded-lg bg-lightSage/40 border border-lightBorder text-xs text-darkGreen font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sageAccent" />
              <span>Theme preference saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedTheme === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectTheme(opt.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-lightSage/30 border-sageAccent ring-2 ring-sageAccent/30 shadow-subtle"
                        : "bg-softBg/60 border-lightBorder hover:border-sageAccent/50 hover:bg-white hover:shadow-card hover:-translate-y-0.5"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-sageAccent text-white"
                              : "bg-white border border-lightBorder text-darkGreen"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-sageAccent text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-darkGreen mb-1">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-darkGreen font-medium leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-lightBorder/60 flex items-center gap-1.5 text-[11px] font-bold text-sageAccent">
                      {isSelected ? "Active Mode" : "Click to select"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button type="submit" variant="primary" size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Save Preferences
              </Button>
              <span className="text-xs font-medium text-darkGreen">
                Current mode: <strong className="font-bold capitalize">{selectedTheme}</strong>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
