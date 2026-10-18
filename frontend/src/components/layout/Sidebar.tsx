"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  User,
  Settings,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const TopNavbar: React.FC = () => {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "New Analysis",
      href: "/dashboard/analysis",
      icon: PlusCircle,
    },
    {
      label: "History",
      href: "/dashboard/history",
      icon: History,
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-3 sm:top-4 z-50 px-3 sm:px-6 w-full flex flex-col items-center pointer-events-none select-none">
      {/* Floating Pill Bar */}
      <div className="pointer-events-auto w-full max-w-5xl bg-[#1C2E23]/95 backdrop-blur-md rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between border border-[#2E4A38] shadow-xl shadow-black/20 transition-all duration-300">
        
        {/* Brand / Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-[#274232] border border-[#3B624A] flex items-center justify-center text-[#82C798] shadow-sm group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white leading-none">
            Knee<span className="text-[#82C798]">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Items (Centered) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex flex-col items-center justify-center px-3 py-1 text-sm transition-colors ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-[#B6CEBF] hover:text-white font-medium"
                }`}
              >
                <span>{item.label}</span>
                {/* Active Indicator Dot matching reference screenshot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${
                    isActive
                      ? "bg-[#52B788] opacity-100 scale-100"
                      : "bg-[#52B788] opacity-0 scale-50 group-hover:opacity-40 group-hover:scale-75"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: User Avatar & Sign Out (Desktop) */}
        <div className="hidden md:flex items-center gap-2 shrink-0 pl-2">
          <Link
            href="/dashboard/profile"
            title={user?.email || "Profile"}
            className="w-7 h-7 rounded-full bg-[#274232] border border-[#3B624A] text-[#E3ECE5] flex items-center justify-center text-xs font-bold hover:border-[#82C798] transition-colors"
          >
            {user?.email?.charAt(0).toUpperCase() || "R"}
          </Link>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/dashboard/profile"
            className="w-7 h-7 rounded-full bg-[#274232] border border-[#3B624A] text-[#E3ECE5] flex items-center justify-center text-xs font-bold"
          >
            {user?.email?.charAt(0).toUpperCase() || "R"}
          </Link>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1 rounded-full text-[#B6CEBF] hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Card */}
      {isMobileOpen && (
        <div className="pointer-events-auto w-full max-w-5xl mt-2 bg-[#1C2E23]/98 backdrop-blur-lg border border-[#2E4A38] rounded-2xl p-3 shadow-2xl flex flex-col space-y-1 md:hidden transition-all duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-[#274232] text-white font-semibold"
                    : "text-[#B6CEBF] hover:bg-[#233B2C] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#82C798]" : "text-[#8BA493]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#52B788]" />
                )}
              </Link>
            );
          })}

          <div className="pt-2 mt-1 border-t border-[#2B4736] flex items-center justify-between px-3">
            <span className="text-xs text-[#9BB6A4] truncate max-w-[200px]">
              {user?.email || "Researcher"}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

// Backward-compatible alias for existing imports
export const Sidebar = TopNavbar;
