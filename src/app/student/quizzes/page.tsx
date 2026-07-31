"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Quiz {
  id: string;
  title: string;
  duration_minutes: number;
  class_id: string;
  classes: {
    name: string;
  };
}

interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  quizzes: {
    title: string;
  };
}

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzesAndResults = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch joined classes
      const { data: members, error: membersErr } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id);

      if (membersErr) throw membersErr;

      if (members && members.length > 0) {
        const classIds = members.map((m) => m.class_id);

        // 2. Fetch active quizzes
        const { data: quizData, error: quizErr } = await supabase
          .from("quizzes")
          .select("*, classes(name)")
          .in("class_id", classIds);

        if (quizErr) throw quizErr;
        setQuizzes(quizData || []);
      }

      // 3. Fetch past quiz results
      const { data: resultData, error: resultErr } = await supabase
        .from("quiz_results")
        .select("*, quizzes(title)")
        .eq("student_id", user.id)
        .order("completed_at", { ascending: false });

      if (resultErr) throw resultErr;
      setResults(resultData || []);
    } catch (err) {
      console.error("Sınav listesi alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchQuizzesAndResults();
    }, 0);
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Sınav ve Testler
        </h1>
        <p className="text-slate-500 mt-1">
          Dahil olduğunuz sınıfların aktif sınavlarına katılın ve geçmiş sonuçlarınızı inceleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Quizzes */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-950">Aktif Sınavlar</h3>
          {quizzes.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
              <span className="text-4xl block">📝</span>
              <p className="text-slate-400 text-sm mt-3">
                Şu an katılabileceğiniz aktif bir sınav bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {quizzes.map((quiz) => {
                const pastResult = results.find((r) => r.quiz_id === quiz.id);
                return (
                  <div
                    key={quiz.id}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        {quiz.classes?.name}
                      </span>
                      <h4 className="font-bold text-slate-900 text-lg mt-1">
                        {quiz.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        ⏱️ Süre: {quiz.duration_minutes} Dakika
                      </p>
                    </div>

                    <div>
                      {pastResult ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Sonuç
                          </span>
                          <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mt-1.5 inline-block">
                            Tamamlandı: %
                            {Math.round(
                              (pastResult.score / pastResult.total_questions) *
                                100
                            )}
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={`/student/quizzes/${quiz.id}`}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition-all inline-block hover:scale-[1.01]"
                        >
                          Sınava Başla 🚀
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Exam Results */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit">
          <h3 className="text-lg font-bold text-slate-955 text-slate-950">Geçmiş Sınav Sonuçları</h3>
          {results.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">
              Henüz tamamlanmış bir sınavınız bulunmamaktadır.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
              {results.map((res) => {
                const percent = Math.round(
                  (res.score / res.total_questions) * 100
                );
                return (
                  <div key={res.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                    <div className="overflow-hidden pr-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {res.quizzes?.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(res.completed_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                        percent >= 70
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-rose-50 text-rose-800"
                      }`}
                    >
                      %{percent}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
