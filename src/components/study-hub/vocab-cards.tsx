"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface VocabWord {
  id: string;
  arabic_word: string;
  turkish_meaning: string;
  root_word: string | null;
  box_level: number;
  next_review_date: string;
}

export default function VocabCards() {
  const [vocabList, setVocabList] = useState<VocabWord[]>([]);
  const [reviewList, setReviewList] = useState<VocabWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filterMode, setFilterMode] = useState<"due" | "all">("due");
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Word Form State
  const [newArabic, setNewArabic] = useState("");
  const [newTurkish, setNewTurkish] = useState("");
  const [newRoot, setNewRoot] = useState("");
  const [savingWord, setSavingWord] = useState(false);

  const fetchVocab = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vocabulary")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const words = data || [];
      setVocabList(words);

      // Filter due words (review date <= today)
      const todayStr = new Date().toISOString().split("T")[0];
      const dueWords = words.filter((w) => w.next_review_date <= todayStr);
      setReviewList(dueWords);
      setCurrentIdx(0);
      setIsFlipped(false);
    } catch (err) {
      console.error("Kelime listesi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchVocab();
    }, 0);
  }, []);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArabic.trim() || !newTurkish.trim()) return;

    try {
      setSavingWord(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("vocabulary").insert({
        user_id: user.id,
        arabic_word: newArabic.trim(),
        turkish_meaning: newTurkish.trim(),
        root_word: newRoot.trim() || null,
        box_level: 1,
      });

      if (error) throw error;

      setNewArabic("");
      setNewTurkish("");
      setNewRoot("");
      alert("Kelime dağarcığınıza eklendi!");
      await fetchVocab();
    } catch (err) {
      console.error("Kelime ekleme hatası:", err);
    } finally {
      setSavingWord(false);
    }
  };

  const handleLeitner = async (correct: boolean) => {
    const currentWord = reviewList[currentIdx];
    if (!currentWord) return;

    let newLevel = currentWord.box_level;
    let daysToAdd = 1;

    if (correct) {
      newLevel = Math.min(5, newLevel + 1);
      const intervals = [1, 3, 7, 14, 30]; // Box levels 1-5 spacing
      daysToAdd = intervals[newLevel - 1];
    } else {
      newLevel = 1;
      daysToAdd = 0; // Review today/immediately
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
    const dateStr = nextReviewDate.toISOString().split("T")[0];

    try {
      const { error } = await supabase
        .from("vocabulary")
        .update({
          box_level: newLevel,
          next_review_date: dateStr,
        })
        .eq("id", currentWord.id);

      if (error) throw error;

      setIsFlipped(false);
      // Wait for card flip animation to finish resetting before showing the next card
      setTimeout(() => {
        if (currentIdx + 1 < reviewList.length) {
          setCurrentIdx((prev) => prev + 1);
        } else {
          // Finished reviews!
          fetchVocab();
        }
      }, 300);
    } catch (err) {
      console.error("Leitner güncelleme hatası:", err);
    }
  };

  const speakArabic = (e: React.MouseEvent, text: string) => {
    e.stopPropagation(); // Avoid flipping card
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Review Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900">Ezber Çalışması</h3>
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterMode("due")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterMode === "due"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tekrar Gelenler ({reviewList.length})
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterMode === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tüm Kelimelerim ({vocabList.length})
            </button>
          </div>
        </div>

        {filterMode === "due" ? (
          reviewList.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
              <span className="text-5xl block animate-bounce">🎉</span>
              <h4 className="text-xl font-bold text-slate-900">Tebrikler!</h4>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Bugün için gözden geçirilecek hiçbir kartınız kalmadı. Hafızanızı taze tutmaya devam edin!
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-8">
              {/* 3D Flip Card */}
              <div
                className="w-full max-w-md h-72 perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div
                  className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Front Face (Arabic) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-white border border-slate-100 shadow-lg flex flex-col justify-between p-8">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-wider">
                        Kutu {reviewList[currentIdx].box_level}
                      </span>
                      <button
                        onClick={(e) =>
                          speakArabic(e, reviewList[currentIdx].arabic_word)
                        }
                        className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 hover:scale-105 transition-all text-base"
                        title="Telaffuz Et"
                      >
                        🔊
                      </button>
                    </div>

                    <h2
                      className="text-5xl font-bold text-slate-900 text-center font-sans tracking-wide leading-relaxed"
                      dir="rtl"
                    >
                      {reviewList[currentIdx].arabic_word}
                    </h2>

                    <span className="text-xs text-slate-400 text-center">
                      Cevabı görmek için karta dokunun
                    </span>
                  </div>

                  {/* Back Face (Turkish Translation) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-slate-950 border border-slate-900 shadow-lg text-white flex flex-col justify-between p-8">
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[10px] bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-wider">
                        Türkçe Anlamı
                      </span>
                      {reviewList[currentIdx].root_word && (
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 font-medium">
                          Kök: {reviewList[currentIdx].root_word}
                        </span>
                      )}
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="text-3xl font-bold text-emerald-400">
                        {reviewList[currentIdx].turkish_meaning}
                      </h3>
                      <p className="text-xs text-slate-400 italic">
                        (Kelimenin kök harflerini ve diğer anlamlarını inceleyin)
                      </p>
                    </div>

                    <span className="text-xs text-slate-500 text-center">
                      Karta tekrar dokunarak Arapçasını görün
                    </span>
                  </div>
                </div>
              </div>

              {/* Leitner Decision Buttons */}
              <div className="flex gap-4 w-full max-w-xs">
                <button
                  onClick={() => handleLeitner(false)}
                  className="flex-1 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl font-bold text-sm hover:bg-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  ❌ Hatırlamadım
                </button>
                <button
                  onClick={() => handleLeitner(true)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-950/20 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  ✅ Hatırladım
                </button>
              </div>
            </div>
          )
        ) : vocabList.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
            <p className="text-slate-400 text-sm">Ezber defterinizde henüz kelime bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {vocabList.map((word) => (
              <div
                key={word.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <span dir="rtl" className="font-sans">
                      {word.arabic_word}
                    </span>
                    <button
                      onClick={(e) => speakArabic(e, word.arabic_word)}
                      className="text-slate-400 hover:text-emerald-600 text-xs"
                    >
                      🔊
                    </button>
                  </h4>
                  <p className="text-sm font-semibold text-slate-500">
                    {word.turkish_meaning}
                  </p>
                  {word.root_word && (
                    <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded text-slate-400 font-semibold uppercase">
                      Kök: {word.root_word}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Kutu {word.box_level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Word Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Yeni Kelime Ekle</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ezberlenecek kelimeleri Leitner aralıklı tekrar kutularına ekleyin.
          </p>
        </div>

        <form onSubmit={handleAddWord} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Arapça Kelime
            </label>
            <input
              type="text"
              required
              value={newArabic}
              onChange={(e) => setNewArabic(e.target.value)}
              placeholder="Örn: كِتَاب"
              dir="rtl"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-right text-slate-950 font-sans focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Türkçe Karşılığı
            </label>
            <input
              type="text"
              required
              value={newTurkish}
              onChange={(e) => setNewTurkish(e.target.value)}
              placeholder="Örn: Kitap"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Kök Kelime (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={newRoot}
              onChange={(e) => setNewRoot(e.target.value)}
              placeholder="Örn: ك - ت - b"
              dir="rtl"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-right text-slate-950 font-sans focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={savingWord || !newArabic.trim() || !newTurkish.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-emerald-900/10 hover:scale-[1.01]"
          >
            {savingWord ? "Kaydediliyor..." : "Kelime Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}
