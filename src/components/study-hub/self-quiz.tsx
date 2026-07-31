"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

interface VocabWord {
  id: string;
  arabic_word: string;
  turkish_meaning: string;
  box_level: number;
}

interface Question {
  id: string;
  arabic_word: string;
  correct_answer: string;
  options: string[];
}

export default function SelfQuiz() {
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const startQuiz = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vocabulary")
        .select("id, arabic_word, turkish_meaning, box_level")
        .eq("user_id", user.id);

      if (error) throw error;

      const words: VocabWord[] = data || [];

      if (words.length < 4) {
        alert(
          "Pratik sınav oluşturabilmek için en az 4 kelime eklemiş olmanız gerekir."
        );
        return;
      }

      // Prioritize Box 1 and Box 2 words (where user struggles)
      const box1And2 = words.filter((w) => w.box_level <= 2);
      const box3Plus = words.filter((w) => w.box_level > 2);

      // Shuffle helper
      const shuffle = <T,>(arr: T[]): T[] =>
        [...arr].sort(() => 0.5 - Math.random());

      // Select 10 words
      const shuffledBox1And2 = shuffle(box1And2);
      const shuffledBox3Plus = shuffle(box3Plus);

      const targetWords = shuffledBox1And2
        .concat(shuffledBox3Plus)
        .slice(0, 10);

      // Generate questions
      const generatedQuestions = targetWords.map((word) => {
        // Collect incorrect options from all other words
        const incorrect = words
          .filter((w) => w.id !== word.id)
          .map((w) => w.turkish_meaning);

        const shuffledIncorrect = shuffle(Array.from(new Set(incorrect))).slice(
          0,
          3
        );

        // Mix correct option with incorrect ones and shuffle options
        const options = shuffle([
          word.turkish_meaning,
          ...shuffledIncorrect,
        ]);

        return {
          id: word.id,
          arabic_word: word.arabic_word,
          correct_answer: word.turkish_meaning,
          options,
        };
      });

      setQuizQuestions(generatedQuestions);
      setCurrentIdx(0);
      setSelectedOpt("");
      setScore(0);
      setActive(true);
    } catch (err) {
      console.error("Sınav oluşturulurken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const question = quizQuestions[currentIdx];
    if (selectedOpt === question.correct_answer) {
      setScore((prev) => (prev !== null ? prev + 1 : 1));
    }

    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt("");
    } else {
      // Quiz finished
      setActive(false);
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
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      {!active && score === null && (
        <div className="text-center space-y-6 py-6 animate-fade-in">
          <span className="text-5xl block">✍️</span>
          <h3 className="text-xl font-bold text-slate-900">
            Ezberlediğin Kelimelerden Sınav Ol
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
            Sistem zorlandığın (1. ve 2. kutu) kelimelere ağırlık vererek 10 soruluk çoktan seçmeli bir test hazırlar.
          </p>
          <button
            onClick={startQuiz}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-emerald-900/10 hover:scale-[1.01]"
          >
            Hızlı Sınavı Başlat
          </button>
        </div>
      )}

      {active && quizQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Öğrenci Pratik Sınavı</span>
            <span>
              Soru {currentIdx + 1} / {quizQuestions.length}
            </span>
          </div>

          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100/50">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">
              Aşağıdaki Arapça kelimenin anlamı nedir?
            </span>
            <h2
              className="text-4xl font-extrabold text-slate-900 font-sans tracking-wide leading-relaxed"
              dir="rtl"
            >
              {quizQuestions[currentIdx].arabic_word}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {quizQuestions[currentIdx].options.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedOpt(option)}
                className={`p-4 rounded-2xl border text-left font-semibold text-sm transition-all cursor-pointer ${
                  selectedOpt === option
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                    : "border-slate-100 hover:bg-slate-50/80 text-slate-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              disabled={!selectedOpt}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:scale-[1.01] transition-all"
            >
              {currentIdx + 1 === quizQuestions.length
                ? "Sınavı Bitir"
                : "Sonraki Soru"}
            </button>
          </div>
        </div>
      )}

      {!active && score !== null && (
        <div className="text-center space-y-6 py-6 animate-fade-in">
          <span className="text-5xl block animate-bounce">🏆</span>
          <h3 className="text-2xl font-bold text-slate-900">Sınav Bitti!</h3>
          <div className="max-w-xs mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm mt-3">
            <span className="text-xs font-semibold text-slate-400 uppercase block tracking-wider">
              Başarı Durumu
            </span>
            <p className="text-4xl font-extrabold text-slate-900 mt-2 block">
              {score} / {quizQuestions.length}
            </p>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-3 inline-block">
              Başarı Oranı: %{Math.round((score / quizQuestions.length) * 100)}
            </span>
          </div>

          <button
            onClick={startQuiz}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm hover:scale-[1.01] transition-all"
          >
            Yeniden Sınav Yap
          </button>
        </div>
      )}
    </div>
  );
}
