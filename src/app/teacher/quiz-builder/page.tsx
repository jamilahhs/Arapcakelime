"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ClassObj {
  id: string;
  name: string;
}

interface Quiz {
  id: string;
  title: string;
  duration_minutes: number;
  class_id: string;
}

interface Question {
  id: string;
  quiz_id: string;
  question_arabic: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

export default function QuizBuilder() {
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [qLoading, setQLoading] = useState(false);

  // New Quiz Form State
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30");

  // New Question Form State
  const [arabicText, setArabicText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correct, setCorrect] = useState("A");

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch classes
      const { data: classData } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id);

      setClasses(classData || []);
      if (classData && classData.length > 0) {
        setClassId(classData[0].id);

        const classIds = classData.map((c) => c.id);

        // 2. Fetch quizzes
        const { data: quizData } = await supabase
          .from("quizzes")
          .select("*")
          .in("class_id", classIds);

        setQuizzes(quizData || []);
        if (quizData && quizData.length > 0) {
          setSelectedQuizId(quizData[0].id);
        }
      }
    } catch (err) {
      console.error("Başlangıç verileri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (quizId: string) => {
    try {
      setQLoading(true);
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId);

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error("Sorular yüklenirken hata:", err);
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchInitialData();
    }, 0);
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      setTimeout(() => {
        fetchQuestions(selectedQuizId);
      }, 0);
    } else {
      setTimeout(() => {
        setQuestions([]);
      }, 0);
    }
  }, [selectedQuizId]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !title.trim()) return;

    try {
      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          class_id: classId,
          title: title.trim(),
          duration_minutes: parseInt(duration) || 30,
        })
        .select()
        .single();

      if (error) throw error;

      alert("Sınav oluşturuldu! Şimdi soruları ekleyebilirsiniz.");
      setTitle("");
      
      // Update local quizzes list and select the newly created quiz
      setQuizzes((prev) => [...prev, data]);
      setSelectedQuizId(data.id);
    } catch (err) {
      console.error("Sınav oluşturma hatası:", err);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId || !arabicText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      const { error } = await supabase.from("quiz_questions").insert({
        quiz_id: selectedQuizId,
        question_arabic: arabicText.trim(),
        option_a: optA.trim(),
        option_b: optB.trim(),
        option_c: optC.trim(),
        option_d: optD.trim(),
        correct_option: correct,
      });

      if (error) throw error;

      setArabicText("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setCorrect("A");
      
      await fetchQuestions(selectedQuizId);
    } catch (err) {
      console.error("Soru ekleme hatası:", err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedQuizId) return;
    try {
      const { error } = await supabase.from("quiz_questions").delete().eq("id", qId);
      if (error) throw error;

      await fetchQuestions(selectedQuizId);
    } catch (err) {
      console.error("Soru silme hatası:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sınav Tasarımcısı (Quiz Builder)</h1>
        <p className="text-slate-500 mt-1">Sınıflarınız için çoktan seçmeli Arapça sınavlar hazırlayın.</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-3xl">🏫</span>
          <p className="text-slate-400 text-sm mt-3">Sınav hazırlamak için önce bir sınıf oluşturmalısınız.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Quiz & Select Quiz */}
          <div className="space-y-6">
            {/* Create Quiz Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-950">Yeni Sınav Oluştur</h3>
              <form onSubmit={handleCreateQuiz} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Seçin</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sınav Başlığı</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Kelime Seviye Tespit Sınavı"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Süre (Dakika)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold text-sm transition-all"
                >
                  Sınav Oluştur
                </button>
              </form>
            </div>

            {/* Quiz Selector */}
            {quizzes.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-950">Düzenlenecek Sınavı Seçin</h3>
                <select
                  value={selectedQuizId || ""}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-teal-500 focus:outline-none sm:text-sm"
                >
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
                {selectedQuizId && (
                  <Link
                    href={`/teacher/quiz-builder/results?quizId=${selectedQuizId}`}
                    className="block text-center w-full py-2.5 bg-indigo-655 hover:bg-indigo-600 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md transition-all mt-2"
                  >
                    📊 Sonuçları İncele
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Add Questions & Questions List */}
          <div className="lg:col-span-2 space-y-6">
            {selectedQuizId === null ? (
              <p className="text-slate-400 text-sm text-center py-12 bg-white rounded-2xl border">
                Lütfen soru eklemek veya incelemek için sol panelden bir sınav seçin ya da yenisini oluşturun.
              </p>
            ) : (
              <>
                {/* Question Form */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-950">Sınava Soru Ekle</h3>
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Arapça Soru Metni</label>
                      <input
                        type="text"
                        required
                        value={arabicText}
                        onChange={(e) => setArabicText(e.target.value)}
                        placeholder="Örn: Bu kelimenin anlamı nedir?"
                        dir="rtl"
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-right focus:border-teal-500 focus:outline-none sm:text-sm font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Seçenek A</label>
                        <input
                          type="text"
                          required
                          value={optA}
                          onChange={(e) => setOptA(e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Seçenek B</label>
                        <input
                          type="text"
                          required
                          value={optB}
                          onChange={(e) => setOptB(e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Seçenek C</label>
                        <input
                          type="text"
                          required
                          value={optC}
                          onChange={(e) => setOptC(e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Seçenek D</label>
                        <input
                          type="text"
                          required
                          value={optD}
                          onChange={(e) => setOptD(e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Doğru Seçenek</label>
                      <select
                        value={correct}
                        onChange={(e) => setCorrect(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:border-teal-500 focus:outline-none sm:text-sm"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold text-sm transition-all"
                    >
                      Soru Ekle
                    </button>
                  </form>
                </div>

                {/* Questions List */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-950">Sınav Soruları ({questions.length})</h3>
                  {qLoading ? (
                    <div className="flex h-12 items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                    </div>
                  ) : questions.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">Bu sınava henüz soru eklenmemiş.</p>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-slate-400 font-bold">Soru {idx + 1}</span>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Sil
                            </button>
                          </div>

                          <h4 className="font-bold text-slate-900 text-right leading-relaxed font-sans" dir="rtl">
                            {q.question_arabic}
                          </h4>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div><strong>A:</strong> {q.option_a}</div>
                            <div><strong>B:</strong> {q.option_b}</div>
                            <div><strong>C:</strong> {q.option_c}</div>
                            <div><strong>D:</strong> {q.option_d}</div>
                          </div>

                          <div className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2 py-1 rounded w-fit">
                            Doğru Cevap: {q.correct_option}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
