"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Öğretmen");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.role !== "teacher") {
          router.push("/student/overview");
          return;
        }
        setUserName(profile.full_name);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Sınıflarım", path: "/teacher/classes", icon: "🏫" },
    { name: "Öğrencilerim", path: "/teacher/students", icon: "👥" },
    { name: "Ödev Yönetimi", path: "/teacher/assignments", icon: "📅" },
    { name: "Sınav Hazırlama", path: "/teacher/quiz-builder", icon: "✍️" },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
          <span className="text-sm font-semibold tracking-wide">
            Panel Yükleniyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col justify-between border-r border-slate-900/60 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } shrink-0`}
      >
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-900 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-300 to-indigo-500">
              LMS Öğretmen
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* User Profile Widget */}
          <div className="p-5 border-b border-slate-900/80 bg-slate-950/20">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center font-bold text-teal-400 uppercase shadow-lg shadow-teal-500/5">
                {userName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-200 truncate">
                  {userName}
                </p>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                  Öğretmen
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-950/30"
                      : "text-slate-400 hover:bg-slate-900/55 hover:text-slate-200"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 transition-all cursor-pointer"
          >
            <span className="text-base">🚪</span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shadow-sm shadow-slate-100/40">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 focus:outline-none p-1.5 hover:bg-slate-50 rounded-lg"
            >
              ☰
            </button>
            <span className="text-sm font-bold text-slate-800 hidden md:block">
              Öğretmen Yönetim Paneli
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
              Sistem Durumu: Çevrimiçi 🟢
            </span>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
