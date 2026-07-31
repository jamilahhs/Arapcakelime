"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface QuizResult {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  profiles: {
    full_name: string;
  };
}

function QuizResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get("quizId");

  const [quizTitle, setQuizTitle] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  useEffect(() => {
    if (!quizId) {
      router.push("/teacher/quiz-builder");
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);

        // Fetch Quiz details
        const { data: quizData } = await supabase
          .from("quizzes")
          .select("title")
          .eq("id", quizId)
          .single();

        if (quizData) {
          setQuizTitle(quizData.title);
        }

        // Fetch Quiz results with student profiles
        const { data: resultData, error: resultErr } = await supabase
          .from("quiz_results")
          .select("id, score, total_questions, completed_at, profiles(full_name)")
          .eq("quiz_id", quizId)
          .order("completed_at", { ascending: false });

        if (resultErr) throw resultErr;

        const resultsList = (resultData as unknown as QuizResult[]) || [];
        setResults(resultsList);

        // Calculate average score percentage
        if (resultsList.length > 0) {
          const totalPct = resultsList.reduce(
            (acc, curr) => acc + (curr.score / curr.total_questions) * 100,
            0
          );
          setAverageScore(Math.round(totalPct / resultsList.length));
        }
      } catch (err) {
        console.error("Sınav sonuçları çekilirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(() => {
      fetchResults();
    }, 0);
  }, [quizId, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-655 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/teacher/quiz-builder"
            className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1 mb-2"
          >
            ← Geri Dön
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Sınav Sonuç Analizi</h1>
          <p className="text-slate-500 text-sm mt-0.5">{quizTitle}</p>
        </div>

        {averageScore !== null && (
          <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl text-right">
            <span className="text-[10px] text-teal-500 font-bold uppercase tracking-wider block">
              Sınıf Başarı Ortalaması
            </span>
            <span className="text-2xl font-extrabold text-teal-900 mt-1 block">
              %{averageScore}
            </span>
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
        {results.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl block">📊</span>
            <p className="text-slate-400 text-sm font-semibold">
              Bu sınava henüz katılan öğrenci bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4">Öğrenci</th>
                  <th className="py-4">Doğru / Toplam</th>
                  <th className="py-4">Başarı Oranı</th>
                  <th className="py-4">Tamamlama Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res) => {
                  const percent = Math.round(
                    (res.score / res.total_questions) * 100
                  );
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-900">
                        {res.profiles?.full_name || "Bilinmeyen Öğrenci"}
                      </td>
                      <td className="py-4 font-medium">
                        {res.score} / {res.total_questions}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            percent >= 70
                              ? "bg-emerald-50 text-emerald-800"
                              : percent >= 45
                              ? "bg-amber-50 text-amber-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          %{percent}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-slate-500 font-mono">
                        {new Date(res.completed_at).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
        </div>
      }
    >
      <QuizResultsContent />
    </Suspense>
  );
}
