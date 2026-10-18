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

export const Sidebar: React.FC = () => {
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
      label: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const NavContent = (
    <div className="flex flex-col h-full bg-[#1A2E22] border-r border-[#264232] text-[#E3ECE5] w-64 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#264232] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#243F30] border border-[#325742] flex items-center justify-center text-[#9CC4A4] shadow-subtle">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white leading-none">
              Knee<span className="text-[#9CC4A4]">AI</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-[#A8C9B0] mt-1">
              Radiograph Analysis
            </span>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-[#A8C9B0] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8FB998] mb-2">
          Clinical Navigation
        </p>
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-sageAccent text-white shadow-subtle font-semibold"
                  : "text-[#E3ECE5] font-semibold hover:bg-[#254231] hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#9CC4A4]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-[#264232] bg-[#14261C]">
        <div className="flex items-center gap-3 px-2 py-1 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#243F30] border border-[#325742] text-[#E3ECE5] flex items-center justify-center text-xs font-bold">
            {user?.email?.charAt(0).toUpperCase() || "R"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Researcher"}
            </p>
            <p className="text-[10px] text-[#A8C9B0] font-medium truncate">
              {user?.email || "Verified Researcher"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="lg:hidden bg-[#1A2E22] text-white px-4 py-3 flex items-center justify-between border-b border-[#264232]">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#9CC4A4]" />
          <span className="font-bold text-base text-white">KneeAI Portal</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1 rounded text-[#A8C9B0] hover:text-white focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex shrink-0 h-screen sticky top-0 z-40">
        {NavContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          ></div>
          <div className="relative z-50 flex flex-col h-full">{NavContent}</div>
        </div>
      )}
    </>
  );
};
