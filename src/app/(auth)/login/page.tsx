"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        // Fetch user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          // If profile check fails, fallback to check-in or student overview
          router.push("/student/overview");
          return;
        }

        if (profile.role === "teacher") {
          router.push("/teacher/classes");
        } else {
          router.push("/student/overview");
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Giriş yapılırken bir hata oluştu.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-slate-800/80">
        <div>
          <span className="mx-auto block text-center text-5xl mb-2">📖</span>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Arapça Kelime LMS
          </h2>
          <p className="mt-3 text-center text-sm text-slate-400">
            Hesabınıza giriş yapın veya{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              yeni hesap oluşturun
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20 text-center animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email-address"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                E-posta Adresi
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="ornek@eposta.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-900/30 hover:scale-[1.01]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Giriş yapılıyor...</span>
                </div>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
