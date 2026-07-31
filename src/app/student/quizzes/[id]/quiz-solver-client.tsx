"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Quiz {
  id: string;
  title: string;
  duration_minutes: number;
}

interface Question {
  id: string;
  question_arabic: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

export default function LiveQuizSolver({ quizId }: { quizId: string }) {
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizRunning, setQuizRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Results display state
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const fetchQuizAndQuestions = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Quiz details
      const { data: quizData, error: quizErr } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizErr || !quizData) {
        alert("Sınav bulunamadı.");
        router.push("/student/quizzes");
        return;
      }

      setQuiz(quizData);
      setTimeLeft(quizData.duration_minutes * 60);

      // Fetch Questions
      const { data: questionsData, error: qErr } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId);

      if (qErr) throw qErr;

      const qList = questionsData || [];
      if (qList.length === 0) {
        alert("Bu sınavda soru bulunmuyor.");
        router.push("/student/quizzes");
        return;
      }

      setQuestions(qList);
      setQuizRunning(true);
    } catch (err) {
      console.error("Sınav verisi çekilemedi:", err);
    } finally {
      setLoading(false);
    }
  }, [quizId, router]);

  useEffect(() => {
    setTimeout(() => {
      fetchQuizAndQuestions();
    }, 0);
  }, [fetchQuizAndQuestions]);

  // Anti-cheat window blur listener
  useEffect(() => {
    if (!quizRunning || finished) return;

    const handleBlur = () => {
      alert("⚠️ UYARI: Sınav esnasında tarayıcı sekmesini veya penceresini değiştiremezsiniz! Bu davranış sistem loguna kaydedilir.");
    };

    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [quizRunning, finished]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || questions.length === 0 || finished) return;

    try {
      setSubmitting(false);
      setQuizRunning(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate score
      let correctCount = 0;
      questions.forEach((q) => {
        const studentAns = selectedAnswers[q.id];
        if (studentAns === q.correct_option) {
          correctCount++;
        }
      });

      // Upload results
      const { error: resultErr } = await supabase.from("quiz_results").insert({
        quiz_id: quiz.id,
        student_id: user.id,
        score: correctCount,
        total_questions: questions.length,
      });

      if (resultErr) throw resultErr;

      setScore(correctCount);
      setFinished(true);
    } catch (err) {
      console.error("Sınav gönderilirken hata oluştu:", err);
    } finally {
      setSubmitting(false);
    }
  }, [quiz, questions, selectedAnswers, finished]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (quizRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (quizRunning && timeLeft === 0) {
      // Auto submit when time runs out
      setTimeout(() => {
        handleSubmitQuiz();
      }, 0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quizRunning, timeLeft, handleSubmitQuiz]);

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm font-semibold tracking-wide">
            Sınav Başlatılıyor...
          </span>
        </div>
      </div>
    );
  }

  if (finished && quiz) {
    const successPct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-6">
          <span className="text-5xl block animate-bounce">🎓</span>
          <h2 className="text-2xl font-bold text-slate-900">Sınav Tamamlandı!</h2>
          <p className="text-slate-500 text-sm">{quiz.title} sonuçlarınız hesaplandı.</p>

          <div className="max-w-xs mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Skorunuz
            </span>
            <p className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {score} / {questions.length}
            </p>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded mt-3 inline-block ${
                successPct >= 70 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
              }`}
            >
              Başarı Oranı: %{successPct}
            </span>
          </div>

          <button
            onClick={() => router.push("/student/quizzes")}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-sm transition-all"
          >
            Sınavlar Sayfasına Dön
          </button>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-955 text-slate-950">Soru Detayları & Cevaplarınız</h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const studentAns = selectedAnswers[q.id];
              const isCorrect = studentAns === q.correct_option;
              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border ${
                    isCorrect ? "border-emerald-100 bg-emerald-50/10" : "border-rose-100 bg-rose-50/10"
                  } space-y-3`}
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Soru {idx + 1}</span>
                    <span className={isCorrect ? "text-emerald-700" : "text-rose-700"}>
                      {isCorrect ? "✓ Doğru" : "✗ Yanlış"}
                    </span>
                  </div>

                  <h4
                    className="font-bold text-slate-900 text-right text-lg leading-relaxed font-sans"
                    dir="rtl"
                  >
                    {q.question_arabic}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <strong>A:</strong> {q.option_a}
                    </div>
                    <div>
                      <strong>B:</strong> {q.option_b}
                    </div>
                    <div>
                      <strong>C:</strong> {q.option_c}
                    </div>
                    <div>
                      <strong>D:</strong> {q.option_d}
                    </div>
                  </div>

                  <div className="text-xs pt-2 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                    <span className="text-slate-500 font-semibold">
                      Seçiminiz:{" "}
                      <span className="font-bold text-slate-800">
                        {studentAns ? `${studentAns}) ${q[`option_${studentAns.toLowerCase()}` as keyof Question]}` : "(Boş)"}
                      </span>
                    </span>
                    <span className="text-slate-500 font-semibold sm:border-l sm:pl-3 border-slate-200">
                      Doğru Cevap:{" "}
                      <span className="font-bold text-emerald-700">
                        {q.correct_option}) {q[`option_${q.correct_option.toLowerCase()}` as keyof Question]}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 font-sans">
      {/* Quiz details bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-slate-900 text-sm truncate max-w-[280px]">
            {quiz?.title}
          </h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Canlı Sınav Ekranı
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Question navigator map */}
          <div className="hidden sm:flex gap-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${
                  idx === currentIdx
                    ? "bg-slate-900 text-white"
                    : selectedAnswers[questions[idx].id]
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                    : "bg-slate-50 text-slate-400 border border-slate-100"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl font-mono font-bold text-sm ${
              timeLeft < 60 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-700"
            }`}
          >
            ⏱️ {formatTimer(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Question Display */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100/50">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">
            Soru {currentIdx + 1} / {questions.length}
          </span>
          <h2
            className="text-3xl font-extrabold text-slate-900 leading-relaxed font-sans"
            dir="rtl"
          >
            {currentQuestion?.question_arabic}
          </h2>
        </div>

        {/* Options Selection Radio Card Grid */}
        <div className="grid grid-cols-1 gap-3">
          {(["A", "B", "C", "D"] as const).map((opt) => {
            const isSelected = selectedAnswers[currentQuestion.id] === opt;
            const textVal = currentQuestion[`option_${opt.toLowerCase()}` as keyof Question];
            return (
              <button
                key={opt}
                onClick={() => handleSelectOption(currentQuestion.id, opt)}
                className={`p-4 rounded-xl border text-left font-semibold text-sm transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                    : "border-slate-100 hover:bg-slate-50/80 text-slate-700"
                }`}
              >
                <span className="font-bold text-xs uppercase tracking-wide mr-2 text-slate-400">
                  {opt})
                </span>
                {textVal}
              </button>
            );
          })}
        </div>

        {/* Bottom Navigation Row */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-100 disabled:opacity-50 transition-colors"
          >
            ← Önceki Soru
          </button>

          {currentIdx + 1 === questions.length ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/10 transition-colors"
            >
              {submitting ? "Gönderiliyor..." : "Sınavı Bitir"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Sonraki Soru →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
