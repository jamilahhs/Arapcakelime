"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        // Upsert profile record to match role
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          role: role,
        });

        if (profileError) throw profileError;

        setSuccess("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Kayıt olurken bir hata oluştu.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-slate-800/80">
        <div>
          <span className="mx-auto block text-center text-5xl mb-2">🏫</span>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Yeni Hesap Oluştur
          </h2>
          <p className="mt-3 text-center text-sm text-slate-400">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Giriş yapın
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20 text-center animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20 text-center">
            🎉 {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="full-name"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                Ad Soyad
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="Ahmet Yılmaz"
              />
            </div>
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Rol Seçiniz
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    role === "student"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold"
                      : "border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  <span className="text-2xl mb-1">🎓</span>
                  <span className="text-xs uppercase tracking-wide">Öğrenci</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    role === "teacher"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold"
                      : "border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  <span className="text-2xl mb-1">👨‍🏫</span>
                  <span className="text-xs uppercase tracking-wide">Öğretmen</span>
                </button>
              </div>
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
                  <span>Kaydediliyor...</span>
                </div>
              ) : (
                "Kayıt Ol"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
