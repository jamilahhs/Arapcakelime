"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="px-6 lg:px-16 h-20 flex items-center justify-between border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 bg-slate-900/80">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Arapça Kelime LMS
          </span>
        </div>
        <nav className="flex items-center space-x-6">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
          >
            Kayıt Ol
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto py-16 sm:py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm font-medium mb-8">
          <span>✨ %100 Ücretsiz Modüler Öğrenme Platformu</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
          Arapça Kelime Öğrenimini{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Aralıklı Tekrar
          </span>{" "}
          ile Hızlandırın
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl">
          Öğretmenler için dijital sınıf ve ödev yönetimi; öğrenciler için Leitner algoritmalı akıllı flashcard, pomodoro ve sesli kelime ezberleme araçları bir arada.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/30 hover:scale-[1.02]"
          >
            Öğrenmeye Başla
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-slate-700 hover:scale-[1.02]"
          >
            Sınıfına Katıl
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/20 transition-all">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold mb-4">
              🗂️
            </div>
            <h3 className="text-lg font-bold mb-2">Leitner Kelime Sistemi</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Kelimeleri 5 aşamalı akıllı kutularda biriktirin. Doğru bilinenleri erteleyin, yanlış yapılanları tekrar edin.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/20 transition-all">
            <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold mb-4">
              📝
            </div>
            <h3 className="text-lg font-bold mb-2">Ders Notları & PDF</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Zengin metin editöründe Arapça notlar alın. Sağdan sola (RTL) tam uyumlu yapıyla notlarınızı PDF olarak indirin.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/20 transition-all">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold mb-4">
              🏫
            </div>
            <h3 className="text-lg font-bold mb-2">Dijital Sınıf & Ödevler</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Öğretmenler kodla sınıf açıp ödevler tanımlayabilir. PDF/Metin teslimleri puanlandığında otomatik temizlenerek alan tasarrufu sağlanır.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-xs border-t border-slate-900 bg-slate-950">
        © 2026 Arapça Kelime LMS. Tüm Hakları Saklıdır. %100 Ücretsiz & Açık Kaynak.
      </footer>
    </div>
  );
}
