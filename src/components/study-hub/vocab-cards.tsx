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

interface BulkItem {
  id: string;
  arabic_word: string;
  turkish_meaning: string;
  root_word: string | null;
}

const PREMADE_PACKS = [
  {
    id: "pack_colors",
    name: "Renkler (الألوان)",
    desc: "Arapça temel renk isimleri ve telaffuzları.",
    words: [
      { arabic_word: "أَحْمَر", turkish_meaning: "Kırmızı", root_word: "حمر" },
      { arabic_word: "أَزْرَق", turkish_meaning: "Mavi", root_word: "زرق" },
      { arabic_word: "أَخْضَر", turkish_meaning: "Yeşil", root_word: "خضر" },
      { arabic_word: "أَصْفَر", turkish_meaning: "Sarı", root_word: "صفر" },
      { arabic_word: "أَبْيَض", turkish_meaning: "Beyaz", root_word: "بيض" },
      { arabic_word: "أَسْوَد", turkish_meaning: "Siyah", root_word: "سود" },
    ],
  },
  {
    id: "pack_verbs",
    name: "Temel Fiiller (الأفعال)",
    desc: "Günlük hayatta en sık kullanılan 6 Arapça mazi fiili.",
    words: [
      { arabic_word: "ذَهَبَ", turkish_meaning: "Gitti", root_word: "ذهب" },
      { arabic_word: "كَتَبَ", turkish_meaning: "Yazdı", root_word: "كتب" },
      { arabic_word: "قَرَأَ", turkish_meaning: "Okudu", root_word: "قرأ" },
      { arabic_word: "شَرِبَ", turkish_meaning: "İçti", root_word: "şrb" },
      { arabic_word: "أَكَلَ", turkish_meaning: "Yedi", root_word: "أكل" },
      { arabic_word: "جَلَسَ", turkish_meaning: "Oturdu", root_word: "جلس" },
    ],
  },
  {
    id: "pack_daily",
    name: "Günlük İletişim (الحوار)",
    desc: "Selamlaşma ve temel nezaket ifadeleri.",
    words: [
      { arabic_word: "مَرْحَبًا", turkish_meaning: "Merhaba", root_word: "رحيب" },
      { arabic_word: "شُكْرًا", turkish_meaning: "Teşekkürler", root_word: "شكر" },
      { arabic_word: "مِنْ فَضْلِكَ", turkish_meaning: "Lütfen", root_word: "فضل" },
      { arabic_word: "آسِف", turkish_meaning: "Üzgünüm / Özür dilerim", root_word: "أسف" },
      { arabic_word: "كَيْفَ حَالُكَ؟", turkish_meaning: "Nasılsın?", root_word: "حول" },
      { arabic_word: "بِخَيْر", turkish_meaning: "İyiyim", root_word: "خير" },
    ],
  },
];

export default function VocabCards() {
  const [vocabList, setVocabList] = useState<VocabWord[]>([]);
  const [reviewList, setReviewList] = useState<VocabWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filterMode, setFilterMode] = useState<"due" | "all">("due");
  const [isFlipped, setIsFlipped] = useState(false);

  // Tab State for Forms
  const [activeFormTab, setActiveFormTab] = useState<"single" | "bulk" | "packs">("single");

  // Single Word Form State
  const [newArabic, setNewArabic] = useState("");
  const [newTurkish, setNewTurkish] = useState("");
  const [newRoot, setNewRoot] = useState("");
  const [savingWord, setSavingWord] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Bulk Word State
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<BulkItem[]>([]);

  // Packs State
  const [importingPackId, setImportingPackId] = useState<string | null>(null);

  const fetchVocab = async () => {
    try {
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
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchVocab();
    }, 0);
  }, []);

  // Free client-side translation helper
  const translateWord = async (word: string): Promise<string> => {
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=tr&dt=t&q=${encodeURIComponent(
          word
        )}`
      );
      const data = await res.json();
      return data?.[0]?.[0]?.[0] || "";
    } catch (err) {
      console.error("Çeviri hatası:", err);
      return "";
    }
  };

  const handleAutoTranslate = async () => {
    if (!newArabic.trim()) return;
    try {
      setTranslating(true);
      const translated = await translateWord(newArabic.trim());
      if (translated) setNewTurkish(translated);
    } catch (err) {
      console.error("Çeviri hatası:", err);
    } finally {
      setTranslating(false);
    }
  };

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

  // Bulk parser & translator
  const handleBulkParseAndTranslate = async () => {
    if (!bulkText.trim()) return;
    try {
      setBulkLoading(true);
      const lines = bulkText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const parsed: BulkItem[] = [];

      for (const line of lines) {
        let ar = "";
        let tr = "";
        const parts = line.split(/[;,-=]/);

        if (parts.length >= 2) {
          ar = parts[0].trim();
          tr = parts[1].trim();
        } else {
          ar = line.trim();
        }

        if (!ar) continue;

        if (!tr) {
          tr = await translateWord(ar);
        }

        parsed.push({
          id: Math.random().toString(36).substr(2, 9),
          arabic_word: ar,
          turkish_meaning: tr,
          root_word: null,
        });
      }

      setBulkPreview(parsed);
    } catch (err) {
      console.error("Toplu çözümleme hatası:", err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkInsert = async () => {
    if (bulkPreview.length === 0) return;
    try {
      setSavingWord(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const insertRows = bulkPreview.map((item) => ({
        user_id: user.id,
        arabic_word: item.arabic_word.trim(),
        turkish_meaning: item.turkish_meaning.trim(),
        root_word: item.root_word ? item.root_word.trim() : null,
        box_level: 1,
      }));

      const { error } = await supabase.from("vocabulary").insert(insertRows);
      if (error) throw error;

      alert(`${bulkPreview.length} kelime başarıyla eklendi!`);
      setBulkText("");
      setBulkPreview([]);
      setActiveFormTab("single");
      await fetchVocab();
    } catch (err) {
      console.error("Toplu kaydetme hatası:", err);
    } finally {
      setSavingWord(false);
    }
  };

  const handleImportPack = async (pack: typeof PREMADE_PACKS[0]) => {
    try {
      setImportingPackId(pack.id);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const insertRows = pack.words.map((w) => ({
        user_id: user.id,
        arabic_word: w.arabic_word,
        turkish_meaning: w.turkish_meaning,
        root_word: w.root_word,
        box_level: 1,
      }));

      const { error } = await supabase.from("vocabulary").insert(insertRows);
      if (error) throw error;

      alert(`"${pack.name}" paketindeki ${pack.words.length} kelime dağarcığınıza eklendi!`);
      await fetchVocab();
    } catch (err) {
      console.error("Paket eklenirken hata:", err);
    } finally {
      setImportingPackId(null);
    }
  };

  const handleLeitner = async (correct: boolean) => {
    const currentWord = reviewList[currentIdx];
    if (!currentWord) return;

    let nextBox = currentWord.box_level;
    let daysToAdd = 1;

    if (correct) {
      // Correct reviews shift boxes up
      nextBox = Math.min(nextBox + 1, 5);
      if (nextBox === 1) daysToAdd = 1;
      else if (nextBox === 2) daysToAdd = 3;
      else if (nextBox === 3) daysToAdd = 7;
      else if (nextBox === 4) daysToAdd = 14;
      else if (nextBox === 5) daysToAdd = 30;
    } else {
      // Incorrect reviews reset back to Box 1
      nextBox = 1;
      daysToAdd = 1;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    const nextDateStr = nextDate.toISOString().split("T")[0];

    try {
      const { error } = await supabase
        .from("vocabulary")
        .update({
          box_level: nextBox,
          next_review_date: nextDateStr,
        })
        .eq("id", currentWord.id);

      if (error) throw error;

      // Update local states
      setVocabList((prev) =>
        prev.map((w) =>
          w.id === currentWord.id
            ? { ...w, box_level: nextBox, next_review_date: nextDateStr }
            : w
        )
      );

      if (currentIdx + 1 < reviewList.length) {
        setCurrentIdx(currentIdx + 1);
        setIsFlipped(false);
      } else {
        // Completed all reviews
        alert("Harika! Bugünkü tüm kelime kartlarını tamamladınız!");
        await fetchVocab();
      }
    } catch (err) {
      console.error("Leitner güncelleme hatası:", err);
    }
  };

  const speakArabic = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeReviewWord = reviewList[currentIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Leitner Box and Flip Card Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Toggle Filters */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode("due")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === "due"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Bugün Tekrar Edilecekler ({reviewList.length})
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Tüm Kelimelerim ({vocabList.length})
            </button>
          </div>
        </div>

        {filterMode === "due" ? (
          reviewList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center space-y-3">
              <span className="text-4xl">🎉</span>
              <h3 className="text-base font-bold text-slate-800">Harika Haber!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bugün için tekrar edecek kelimeniz kalmadı. Yeni kelimeler ekleyebilir ya da tüm kelimeler listenize göz atabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="perspective-1000 h-[280px] w-full cursor-pointer"
              >
                <div
                  className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 bg-white border border-slate-100 rounded-3xl shadow-sm backface-hidden p-8 flex flex-col justify-between items-center text-center">
                    <div className="w-full flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <span>Arapça Kelime</span>
                      <span>Kutu {activeReviewWord?.box_level}</span>
                    </div>

                    <div className="space-y-4">
                      <h2 dir="rtl" className="text-4xl sm:text-5xl font-bold text-slate-950 leading-normal font-sans">
                        {activeReviewWord?.arabic_word}
                      </h2>
                      <button
                        onClick={(e) => speakArabic(e, activeReviewWord?.arabic_word)}
                        className="h-9 w-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold flex items-center justify-center mx-auto transition-all cursor-pointer"
                        title="Telaffuzu Dinle"
                      >
                        🔊
                      </button>
                    </div>

                    <span className="text-xs text-slate-400 font-semibold">
                      Anlamını görmek için karta tıklayın 🔄
                    </span>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 bg-slate-900 border border-slate-950 rounded-3xl shadow-sm backface-hidden rotate-y-180 p-8 flex flex-col justify-between items-center text-center text-white">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Türkçe Karşılığı
                    </span>

                    <div className="space-y-3">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-450 text-emerald-400">
                        {activeReviewWord?.turkish_meaning}
                      </h2>
                      {activeReviewWord?.root_word && (
                        <p dir="rtl" className="text-sm text-slate-400 font-sans">
                          Kök Kelime: {activeReviewWord.root_word}
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-slate-500 font-semibold">
                      Arapça kelimeyi görmek için tıklayın 🔄
                    </span>
                  </div>
                </div>
              </div>

              {/* Leitner Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleLeitner(false)}
                  className="flex-1 py-4 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 rounded-2xl font-bold text-sm transition-all shadow-sm cursor-pointer"
                >
                  {"❌ Hatırlamadım (Kutu 1'e Gönder)"}
                </button>
                <button
                  onClick={() => handleLeitner(true)}
                  className="flex-1 py-4 border border-emerald-200 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer"
                >
                  ✓ Hatırladım (Bir Sonraki Kutu)
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {vocabList.map((word) => (
              <div
                key={word.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <span dir="rtl" className="font-sans">
                      {word.arabic_word}
                    </span>
                    <button
                      onClick={(e) => speakArabic(e, word.arabic_word)}
                      className="text-slate-400 hover:text-emerald-600 text-xs cursor-pointer"
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

      {/* Right Column: Multi-tab word adding interface */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit">
        {/* Tab Picker */}
        <div className="flex border-b border-slate-150 bg-slate-50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFormTab("single")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeFormTab === "single"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tekli Kelime
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab("bulk")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeFormTab === "bulk"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Toplu Yükleme ⚡
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab("packs")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeFormTab === "packs"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Hazır Paketler 🎁
          </button>
        </div>

        {/* 1. SINGLE WORD ADD FORM */}
        {activeFormTab === "single" && (
          <form onSubmit={handleAddWord} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Arapça Kelime
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newArabic}
                  onChange={(e) => setNewArabic(e.target.value)}
                  placeholder="Örn: كِتَاب"
                  dir="rtl"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-16 pr-4 py-3 text-right text-slate-950 font-sans focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={handleAutoTranslate}
                  disabled={translating || !newArabic.trim()}
                  className="absolute left-2 top-2 px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {translating ? "..." : "Çevir 🪄"}
                </button>
              </div>
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
                placeholder="Örn: ك - ت - ب"
                dir="rtl"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-right text-slate-950 font-sans focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={savingWord || !newArabic.trim() || !newTurkish.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-emerald-900/10 hover:scale-[1.01] cursor-pointer"
            >
              {savingWord ? "Kaydediliyor..." : "Kelime Ekle"}
            </button>
          </form>
        )}

        {/* 2. BULK IMPORT FORM */}
        {activeFormTab === "bulk" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Kelimeleri Yapıştırın
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Örn:&#10;كِتَاب&#10;قَلَم, Kalem&#10;مَدْرَسَة = Okul"
                rows={5}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all font-mono leading-relaxed"
              ></textarea>
              <p className="text-[10px] text-slate-400 mt-1">
                * Her satıra bir kelime yazın. Virgül (,), eşittir (=) veya tire (-) kullanarak karşılığını yazabilirsiniz. Anlamları boş bırakırsanız otomatik çevrilecektir.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBulkParseAndTranslate}
              disabled={bulkLoading || !bulkText.trim()}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {bulkLoading ? "Çözümleniyor..." : "Çözümle & Otomatik Çevir 🪄"}
            </button>

            {bulkPreview.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">
                  Çözümlenen Kelimeler ({bulkPreview.length})
                </h4>
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                  {bulkPreview.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2"
                    >
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.arabic_word}
                          dir="rtl"
                          onChange={(e) => {
                            const next = [...bulkPreview];
                            next[idx].arabic_word = e.target.value;
                            setBulkPreview(next);
                          }}
                          className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs text-right font-sans"
                        />
                        <input
                          type="text"
                          value={item.turkish_meaning}
                          onChange={(e) => {
                            const next = [...bulkPreview];
                            next[idx].turkish_meaning = e.target.value;
                            setBulkPreview(next);
                          }}
                          placeholder="Türkçe karşılığı"
                          className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                      <input
                        type="text"
                        value={item.root_word || ""}
                        dir="rtl"
                        onChange={(e) => {
                          const next = [...bulkPreview];
                          next[idx].root_word = e.target.value || null;
                          setBulkPreview(next);
                        }}
                        placeholder="Kök kelime (İsteğe bağlı)"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-[10px] text-right font-sans"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleBulkInsert}
                  disabled={savingWord}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  {savingWord ? "Ekleniyor..." : "Hepsini Dağarcığa Ekle 🚀"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. PRE-MADE THEMATIC PACKS */}
        {activeFormTab === "packs" && (
          <div className="space-y-4">
            {PREMADE_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{pack.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{pack.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pack.words.slice(0, 4).map((w, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white border border-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono"
                      >
                        {w.arabic_word}
                      </span>
                    ))}
                    {pack.words.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-bold px-1.5">
                        +{pack.words.length - 4} daha
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={importingPackId === pack.id}
                  onClick={() => handleImportPack(pack)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  {importingPackId === pack.id ? "Ekleniyor..." : "Bu Paketi Ekle 📥"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
