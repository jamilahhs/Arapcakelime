"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface VocabWord {
  id: string;
  arabic_word: string;
  turkish_meaning: string;
  root_word: string | null;
  example_sentence: string | null;
  box_level: number;
  next_review_date: string;
}

interface BulkItem {
  id: string;
  arabic_word: string;
  turkish_meaning: string;
  root_word: string | null;
  example_sentence: string | null;
}

const PREMADE_PACKS = [
  {
    id: "pack_colors",
    name: "Renkler",
    arabic_name: "الألوان",
    desc: "Arapça temel renk isimleri ve cümle içinde kullanımları.",
    icon: "🎨",
    float_class: "float-slow",
    gradient_class: "from-rose-500/90 to-amber-500/90 shadow-rose-500/20",
    words: [
      { arabic_word: "أَحْمَر", turkish_meaning: "Kırmızı", root_word: "حمر", example_sentence: "الْوَرْدَةُ حَمْرَاءُ جَمِيلَةٌ." },
      { arabic_word: "أَزْرَق", turkish_meaning: "Mavi", root_word: "زرق", example_sentence: "السَّمَاءُ زَرْقَاءُ صَافِيَةٌ الْيَوْمَ." },
      { arabic_word: "أَخْضَر", turkish_meaning: "Yeşil", root_word: "خضر", example_sentence: "الْعُشْبُ فِي الْحَدِيقَةِ أَخْضَرُ رَطْبٌ." },
      { arabic_word: "أَصْفَر", turkish_meaning: "Sarı", root_word: "صفر", example_sentence: "اللَّيْمُونُ أَصْفَرُ وَحَامِضٌ." },
      { arabic_word: "أَبْيَض", turkish_meaning: "Beyaz", root_word: "بيض", example_sentence: "الثَّلْجُ أَبْيَضُ نَاصِعٌ فِي الشِّتَاءِ." },
      { arabic_word: "أَسْوَد", turkish_meaning: "Siyah", root_word: "سود", example_sentence: "الْقِطُّ الأَسْوَدُ يَنَامُ عَلَى الْكُرْسِيِّ." },
    ],
  },
  {
    id: "pack_verbs",
    name: "Temel Fiiller",
    arabic_name: "الأفعال",
    desc: "En sık kullanılan 6 Arapça mazi eylem fiili.",
    icon: "🎬",
    float_class: "float-medium",
    gradient_class: "from-purple-600/90 to-indigo-600/90 shadow-purple-600/20",
    words: [
      { arabic_word: "ذَهَبَ", turkish_meaning: "Gitti", root_word: "ذهب", example_sentence: "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا." },
      { arabic_word: "كَتَبَ", turkish_meaning: "Yazdı", root_word: "كتب", example_sentence: "كَتَبَ الْوَلَدُ الرِّسَالَةَ بِالْقَلَمِ." },
      { arabic_word: "قَرَأَ", turkish_meaning: "Okudu", root_word: "قرأ", example_sentence: "قَرَأَتْ أُمِّي كِتَابًا جَمِيلًا." },
      { arabic_word: "شَرِبَ", turkish_meaning: "İçti", root_word: "شرب", example_sentence: "شَرِبَ الطِّفْلُ الْحَلِيبَ الدَّافِئَ." },
      { arabic_word: "أَكَلَ", turkish_meaning: "Yedi", root_word: "أكل", example_sentence: "أَكَلَ الرَّجُلُ التُّفَّاحَةَ اللَّذِيذَةَ." },
      { arabic_word: "جَلَسَ", turkish_meaning: "Oturdu", root_word: "جلس", example_sentence: "جَلَسَ الْمُعَلِّمُ عَلَى الْكُرْسِيِّ الْخَشَبِيِّ." },
    ],
  },
  {
    id: "pack_daily",
    name: "Günlük İletişim",
    arabic_name: "الحوار",
    desc: "Selamlaşma ve temel nezaket ifadeleri.",
    icon: "💬",
    float_class: "float-fast",
    gradient_class: "from-teal-500/90 to-emerald-600/90 shadow-teal-500/20",
    words: [
      { arabic_word: "مَرْحَبًا", turkish_meaning: "Merhaba", root_word: "رحيب", example_sentence: "مَرْحَبًا بِكَ يَا صَدِيقِي الْعَزِيزُ." },
      { arabic_word: "شُكْرًا", turkish_meaning: "Teşekkürler", root_word: "شkr", example_sentence: "شُكْرًا جَزِيلًا عَلَى هَدِيَّتِكَ الرَّائِعَةِ." },
      { arabic_word: "مِنْ فَضْلِكَ", turkish_meaning: "Lütfen", root_word: "فضل", example_sentence: "أَعْطِنِي الْقَلَمَ مِنْ فَضْلِكَ." },
      { arabic_word: "آسِف", turkish_meaning: "Üzgünüm / Özür dilerim", root_word: "أسف", example_sentence: "أَنَا آسِفٌ لِأَنِّي تَأَخَّرْتُ عَنِ الدَّرْسِ." },
      { arabic_word: "كَيْفَ حَالُكَ؟", turkish_meaning: "Nasılsın?", root_word: "حول", example_sentence: "كَيْفَ حَالُكَ يَا أَخِي الْغَالِي؟" },
      { arabic_word: "بِخَيْر", turkish_meaning: "İyiyim", root_word: "خير", example_sentence: "أَنَا بِخَيْرٍ وَالْحَمْدُ للهِ كَثِيرًا." },
    ],
  },
  {
    id: "pack_house",
    name: "Ev Eşyaları",
    arabic_name: "البيت",
    desc: "Ev ortamında kullanılan temel isimler.",
    icon: "🏠",
    float_class: "float-slow",
    gradient_class: "from-orange-500/90 to-pink-500/90 shadow-orange-500/20",
    words: [
      { arabic_word: "بَيْت", turkish_meaning: "Ev", root_word: "بيت", example_sentence: "هَذَا بَيْتُنَا الْكَبِيرُ وَالْجَمِيلُ." },
      { arabic_word: "غُرْفَة", turkish_meaning: "Oda", root_word: "غرف", example_sentence: "أَنَامُ فِي غُرْفَةِ النَّوْمِ الْهَادِئَةِ." },
      { arabic_word: "بَاب", turkish_meaning: "Kapı", root_word: "بوب", example_sentence: "افْتَحِ الْبَابَ لِيَدْخُلَ الضَّيْفُ." },
      { arabic_word: "نَافِذَة", turkish_meaning: "Pencere", root_word: "نفذ", example_sentence: "انْظُرْ مِنَ النَّافِذَةِ إِلَى الْحَدِيقَةِ." },
      { arabic_word: "طَاوِلَة", turkish_meaning: "Masa", root_word: "طول", example_sentence: "الْكِتَابُ مَوْضُوعٌ عَلَى الطَّاوِلَةِ." },
      { arabic_word: "كُرْسِيّ", turkish_meaning: "Sandalye", root_word: "كرس", example_sentence: "اجْلِسْ عَلَى الْكُرْسِيِّ الْمُرِيحِ." },
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
  const [activeFormTab, setActiveFormTab] = useState<"packs" | "single" | "bulk">("packs");

  // Single Word Form State
  const [newArabic, setNewArabic] = useState("");
  const [newTurkish, setNewTurkish] = useState("");
  const [newRoot, setNewRoot] = useState("");
  const [newExample, setNewExample] = useState("");
  const [savingWord, setSavingWord] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Bulk Word State
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<BulkItem[]>([]);

  // Packs Detail Modal State
  const [selectedPack, setSelectedPack] = useState<typeof PREMADE_PACKS[0] | null>(null);
  const [selectedWordsToImport, setSelectedWordsToImport] = useState<Record<string, boolean>>({});
  const [playingAll, setPlayingAll] = useState(false);

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
        example_sentence: newExample.trim() || null,
        box_level: 1,
      });

      if (error) throw error;

      setNewArabic("");
      setNewTurkish("");
      setNewRoot("");
      setNewExample("");
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
        let ex = "";
        const parts = line.split(/[;,-=]/);

        if (parts.length >= 3) {
          ar = parts[0].trim();
          tr = parts[1].trim();
          ex = parts[2].trim();
        } else if (parts.length === 2) {
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
          example_sentence: ex || null,
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
        example_sentence: item.example_sentence ? item.example_sentence.trim() : null,
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

  const handleLeitner = async (correct: boolean) => {
    const currentWord = reviewList[currentIdx];
    if (!currentWord) return;

    let nextBox = currentWord.box_level;
    let daysToAdd = 1;

    if (correct) {
      nextBox = Math.min(nextBox + 1, 5);
      if (nextBox === 1) daysToAdd = 1;
      else if (nextBox === 2) daysToAdd = 3;
      else if (nextBox === 3) daysToAdd = 7;
      else if (nextBox === 4) daysToAdd = 14;
      else if (nextBox === 5) daysToAdd = 30;
    } else {
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
        alert("Harika! Bugünkü tüm kelime kartlarını tamamladınız!");
        await fetchVocab();
      }
    } catch (err) {
      console.error("Leitner güncelleme hatası:", err);
    }
  };

  const speakArabic = (e: React.MouseEvent | null, text: string) => {
    if (e) e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenPackInspector = (pack: typeof PREMADE_PACKS[0]) => {
    setSelectedPack(pack);
    const initialSelects: Record<string, boolean> = {};
    pack.words.forEach((w) => {
      const isAlreadyImported = vocabList.some((vw) => vw.arabic_word === w.arabic_word);
      initialSelects[w.arabic_word] = !isAlreadyImported;
    });
    setSelectedWordsToImport(initialSelects);
  };

  const playPackAudioSequence = () => {
    if (!selectedPack || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setPlayingAll(true);
    let idx = 0;

    const playNext = () => {
      if (idx >= selectedPack.words.length) {
        setPlayingAll(false);
        return;
      }
      const wordText = selectedPack.words[idx].arabic_word;
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = "ar-SA";
      utterance.onend = () => {
        setTimeout(() => {
          idx++;
          playNext();
        }, 300);
      };
      utterance.onerror = () => {
        setPlayingAll(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.cancel();
    playNext();
  };

  const handleImportSelectedWords = async () => {
    if (!selectedPack) return;
    const wordsToInsert = selectedPack.words.filter((w) => selectedWordsToImport[w.arabic_word]);
    if (wordsToInsert.length === 0) return;

    try {
      setSavingWord(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const insertRows = wordsToInsert.map((w) => ({
        user_id: user.id,
        arabic_word: w.arabic_word,
        turkish_meaning: w.turkish_meaning,
        root_word: w.root_word,
        example_sentence: w.example_sentence,
        box_level: 1,
      }));

      const { error } = await supabase.from("vocabulary").insert(insertRows);
      if (error) throw error;

      alert(`${wordsToInsert.length} yeni kelime dağarcığınıza eklendi!`);
      setSelectedPack(null);
      await fetchVocab();
    } catch (err) {
      console.error("Kelime import hatası:", err);
    } finally {
      setSavingWord(false);
    }
  };

  const getPackProgress = (packWords: { arabic_word: string }[]) => {
    const loadedCount = packWords.filter((pw) =>
      vocabList.some((vw) => vw.arabic_word === pw.arabic_word)
    ).length;
    return {
      loaded: loadedCount,
      total: packWords.length,
      percentage: Math.round((loadedCount / packWords.length) * 100),
    };
  };

  const activeReviewWord = reviewList[currentIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Learning Map OR Flashcard Review */}
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
                onClick={() => {
                  setIsFlipped(!isFlipped);
                  // Play pronunciation automatically when card is clicked/flipped!
                  speakArabic(null, activeReviewWord?.arabic_word);
                }}
                className="perspective-1000 h-[340px] w-full cursor-pointer"
              >
                <div
                  className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 bg-white border border-slate-100 rounded-3xl shadow-sm backface-hidden p-8 flex flex-col justify-between items-center text-center">
                    <div className="w-full flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <span>Arapça Kelime (Ses için Dokun 🔊)</span>
                      <span>Kutu {activeReviewWord?.box_level}</span>
                    </div>

                    <div className="space-y-4 my-auto w-full flex flex-col items-center">
                      <h2 dir="rtl" className="text-4xl sm:text-5xl font-black text-slate-950 leading-normal font-sans">
                        {activeReviewWord?.arabic_word}
                      </h2>

                      {/* Example sentence displayed underneath the word */}
                      {activeReviewWord?.example_sentence && (
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl w-full max-w-md">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 text-center">
                            Örnek Cümle (Ön İzleme)
                          </p>
                          <p dir="rtl" className="text-sm font-semibold text-slate-700 font-sans tracking-wide text-center">
                            {activeReviewWord.example_sentence}
                          </p>
                        </div>
                      )}
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

                    <div className="space-y-4 my-auto w-full flex flex-col items-center">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-450 text-emerald-400">
                        {activeReviewWord?.turkish_meaning}
                      </h2>
                      {activeReviewWord?.root_word && (
                        <span className="text-[10px] bg-slate-800 px-2.5 py-0.5 rounded-lg text-slate-400 font-semibold uppercase font-mono">
                          Kök: {activeReviewWord.root_word}
                        </span>
                      )}

                      {/* Example sentence displayed under translation too */}
                      {activeReviewWord?.example_sentence && (
                        <div className="mt-4 p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl w-full max-w-md text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                            Örnek Cümle
                          </p>
                          <p dir="rtl" className="text-sm font-semibold text-slate-355 text-slate-300 font-sans tracking-wide">
                            {activeReviewWord.example_sentence}
                          </p>
                        </div>
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
                  {word.example_sentence && (
                    <p dir="rtl" className="text-xs text-slate-400 font-sans mt-0.5">
                      Cümle: {word.example_sentence}
                    </p>
                  )}
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

      {/* Right Column: Multi-tab word adding and Learning Map interface */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit">
        {/* Tab Picker */}
        <div className="flex border-b border-slate-150 bg-slate-50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFormTab("packs")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeFormTab === "packs"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Tema Haritası 🎁
          </button>
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
        </div>

        {/* 1. PRE-MADE THEMATIC PATHMAP */}
        {activeFormTab === "packs" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
                Arapça Öğrenim Yolculuğu
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Kürelerin üzerine tıklayarak temalardaki kelimeleri dinleyin, seçin ve dağarcığınıza yükleyin!
              </p>
            </div>

            {/* Dotted Connections Paths Map */}
            <div className="relative flex flex-col items-center gap-6 py-4">
              {/* Vertical connector line */}
              <div className="absolute top-8 bottom-8 left-1/2 w-0.5 border-l-2 border-dashed border-emerald-100 -translate-x-1/2 z-0"></div>

              {PREMADE_PACKS.map((pack, idx) => {
                const prog = getPackProgress(pack.words);
                const isCompleted = prog.loaded === prog.total;

                return (
                  <div key={pack.id} className="relative z-10 flex flex-col items-center">
                    <div
                      onClick={() => handleOpenPackInspector(pack)}
                      className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105 shadow-xl relative border-4 border-white text-white ${
                        pack.float_class
                      } bg-gradient-to-br ${pack.gradient_class}`}
                    >
                      {/* Circular Progress Overlay */}
                      <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                      <div
                        className={`absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-emerald-400/80 transition-all ${
                          isCompleted ? "border-emerald-400" : "border-transparent"
                        }`}
                        style={{
                          transform: `rotate(${prog.percentage * 3.6}deg)`,
                        }}
                      ></div>

                      <span className="text-3xl mb-1">{pack.icon}</span>
                      <h4 className="font-black text-xs tracking-wide">{pack.name}</h4>
                      <span dir="rtl" className="text-[10px] font-sans opacity-80 mt-0.5">
                        {pack.arabic_name}
                      </span>

                      {/* Progress text */}
                      <span className="text-[9px] bg-slate-900/40 px-2 py-0.5 rounded-full font-bold mt-2">
                        {prog.loaded} / {prog.total} Kelime
                      </span>

                      {isCompleted && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 border-2 border-white rounded-full text-[9px] font-black h-5 w-5 flex items-center justify-center shadow">
                          ✓
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-2">
                      {idx + 1}. Aşama
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SINGLE WORD ADD FORM */}
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Örnek Cümle (İsteğe bağlı)
              </label>
              <input
                type="text"
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                placeholder="Örn: كَتَبْتُ الرِّسَالَةَ."
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

        {/* 3. BULK IMPORT FORM */}
        {activeFormTab === "bulk" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Kelimeleri Yapıştırın
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Örn:&#10;كِتَاب&#10;قَلَم, Kalem&#10;مَدْرَسَة = Okul = هَذِهِ مَدْرَسَةٌ."
                rows={5}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all font-mono leading-relaxed"
              ></textarea>
              <p className="text-[10px] text-slate-400 mt-1">
                * Her satıra bir kelime yazın. Eşittir (=) veya virgül (,) kullanarak `Arapça = Türkçe = Cümle` formatında yazabilirsiniz.
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
                        value={item.example_sentence || ""}
                        dir="rtl"
                        onChange={(e) => {
                          const next = [...bulkPreview];
                          next[idx].example_sentence = e.target.value || null;
                          setBulkPreview(next);
                        }}
                        placeholder="Örnek Cümle (İsteğe bağlı)"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-[10px] text-right font-sans"
                      />
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
      </div>

      {/* Thematic Pack Inspector Overlay Modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedPack.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedPack.name} ({selectedPack.arabic_name})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedPack.desc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPack(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center font-bold text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Telaffuz Rehberi
                </span>
                <button
                  type="button"
                  disabled={playingAll}
                  onClick={playPackAudioSequence}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {playingAll ? "Seslendiriliyor..." : "Tüm Kelimeleri Seslendir 🔊"}
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {selectedPack.words.map((word) => {
                  const isAlreadyImported = vocabList.some(
                    (vw) => vw.arabic_word === word.arabic_word
                  );

                  return (
                    <div
                      key={word.arabic_word}
                      className="py-3.5 flex flex-col hover:bg-slate-50/20 px-2 rounded-xl transition-all"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            disabled={isAlreadyImported}
                            checked={!!selectedWordsToImport[word.arabic_word]}
                            onChange={(e) => {
                              setSelectedWordsToImport((prev) => ({
                                ...prev,
                                [word.arabic_word]: e.target.checked,
                              }));
                            }}
                            className="h-4 w-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 disabled:opacity-30"
                          />
                          <div className="text-left">
                            <span className="font-bold text-sm text-slate-800">
                              {word.turkish_meaning}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Kök: {word.root_word}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            dir="rtl"
                            className="text-lg font-black text-slate-900 font-sans"
                          >
                            {word.arabic_word}
                          </span>
                          <button
                            type="button"
                            onClick={() => speakArabic(null, word.arabic_word)}
                            className="h-7 w-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-700 text-xs cursor-pointer border border-slate-100 bg-white"
                            title="Dinle"
                          >
                            🔊
                          </button>
                          {isAlreadyImported ? (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">
                              Yüklendi ✓
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                              Hazır
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display Example Sentence inside the Theme Modal */}
                      {word.example_sentence && (
                        <div className="mt-2 ml-7 p-2 bg-slate-50 border border-slate-100 rounded-xl text-left">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                            Örnek Cümle
                          </p>
                          <p dir="rtl" className="text-xs font-semibold text-slate-600 font-sans text-right">
                            {word.example_sentence}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-between bg-slate-50/20">
              <button
                onClick={() => setSelectedPack(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleImportSelectedWords}
                disabled={
                  savingWord ||
                  Object.values(selectedWordsToImport).filter(Boolean).length === 0
                }
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-lg shadow-emerald-950/10"
              >
                {savingWord
                  ? "Ekleniyor..."
                  : `Seçilenleri Dağarcığa Ekle (${
                      Object.values(selectedWordsToImport).filter(Boolean).length
                    }) 📥`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
