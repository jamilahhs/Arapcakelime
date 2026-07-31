"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Öğrenci");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [streak, setStreak] = useState(0);

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
        .select("full_name, streak_count, last_active_date")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.full_name) {
          setUserName(profile.full_name);
        }

        // Streak Count computation
        const todayStr = new Date().toISOString().split("T")[0];
        let currentStreak = profile.streak_count || 0;
        const lastActive = profile.last_active_date;

        if (!lastActive) {
          currentStreak = 1;
          await supabase
            .from("profiles")
            .update({ streak_count: 1, last_active_date: todayStr })
            .eq("id", user.id);
        } else if (lastActive === todayStr) {
          // Already checked in today
        } else {
          const lastActiveDate = new Date(lastActive);
          const todayDate = new Date(todayStr);
          const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            currentStreak += 1;
            await supabase
              .from("profiles")
              .update({ streak_count: currentStreak, last_active_date: todayStr })
              .eq("id", user.id);
          } else if (diffDays > 1) {
            currentStreak = 1;
            await supabase
              .from("profiles")
              .update({ streak_count: 1, last_active_date: todayStr })
              .eq("id", user.id);
          }
        }

        setStreak(currentStreak);
      }
      setLoading(false);
    };

    setTimeout(() => {
      checkUser();
    }, 0);
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Genel Bakış", path: "/student/overview", icon: "📊" },
    { name: "Çalışma Merkezi", path: "/student/study-hub", icon: "🧠" },
    { name: "Ders Notlarım", path: "/student/notes", icon: "📝" },
    { name: "Ödevler", path: "/student/assignments", icon: "📅" },
    { name: "Sınavlar", path: "/student/quizzes", icon: "🏆" },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
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

      {/* Sidebar (Desktop and Mobile Slide-out Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col justify-between border-r border-slate-900/60 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } shrink-0`}
      >
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-900 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Arapça Kelime LMS
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* User profile widget */}
          <div className="p-5 border-b border-slate-900/80 bg-slate-950/20">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 uppercase shadow-lg shadow-emerald-500/5">
                {userName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-200 truncate">
                  {userName}
                </p>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Öğrenci
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
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/30"
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

        {/* Logout section */}
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
              Öğrenci Kontrol Paneli
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {streak > 0 && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                🔥 {streak} Günlük Seri!
              </span>
            )}
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
