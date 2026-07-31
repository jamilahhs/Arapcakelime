"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ClassObj {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  class_id: string;
  classes: {
    name: string;
  };
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  file_url: string | null;
  file_purged: boolean;
  status: "pending" | "graded";
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  profiles: {
    full_name: string;
  };
}

export default function TeacherAssignments() {
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  // New Assignment Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  // Grading form state
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchClassesAndAssignments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch teacher's classes
      const { data: classData, error: classErr } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id);

      if (classErr) throw classErr;
      setClasses(classData || []);

      if (classData && classData.length > 0) {
        setSelectedClassId(classData[0].id);

        const classIds = classData.map((c) => c.id);

        // 2. Fetch assignments for these classes
        const { data: assignData, error: assignErr } = await supabase
          .from("assignments")
          .select("*, classes(name)")
          .in("class_id", classIds)
          .order("created_at", { ascending: false });

        if (assignErr) throw assignErr;
        setAssignments(assignData || []);
      }
    } catch (err) {
      console.error("Ödevler ve sınıflar çekilemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchClassesAndAssignments();
    }, 0);
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !newTitle.trim()) return;

    try {
      const { error } = await supabase.from("assignments").insert({
        class_id: selectedClassId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        due_date: newDueDate || null,
      });

      if (error) throw error;

      alert("Ödev başarıyla oluşturuldu!");
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      await fetchClassesAndAssignments();
    } catch (err) {
      console.error("Ödev oluşturma hatası:", err);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      setSubLoading(true);
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*, profiles(full_name)")
        .eq("assignment_id", assignmentId);

      if (error) throw error;
      setSubmissions((data as unknown as Submission[]) || []);
    } catch (err) {
      console.error("Ödev teslimleri çekilemedi:", err);
    } finally {
      setSubLoading(false);
    }
  };

  const handleGradeSubmission = async (submission: Submission) => {
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      alert("Lütfen 0 ile 100 arasında geçerli bir not girin.");
      return;
    }

    const confirmPurge = confirm(
      "Ödevi puanladığınızda, sunucu kotasını korumak adına yüklenen orijinal dosya otomatik olarak silinecektir. Onaylıyor musunuz?"
    );

    if (!confirmPurge) return;

    try {
      const { error } = await supabase
        .from("assignment_submissions")
        .update({
          grade: gradeNum,
          feedback: feedback.trim() || null,
          status: "graded",
        })
        .eq("id", submission.id);

      if (error) throw error;

      alert("Ödev başarıyla puanlandı! Dosya silindi.");
      setGradingId(null);
      setGrade("");
      setFeedback("");
      await fetchSubmissions(submission.assignment_id);
    } catch (err) {
      console.error("Puanlama hatası:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ödev Yönetimi</h1>
        <p className="text-slate-500 mt-1">Ödev tanımlayın, teslimleri inceleyin ve öğrencilere not verin.</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-3xl">🏫</span>
          <p className="text-slate-400 text-sm mt-3">Ödev tanımlamak için önce bir sınıf oluşturmalısınız.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Assignment Form */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-950">Yeni Ödev Tanımla</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Seçin</label>
                  <select
                    value={selectedClassId || ""}
                    onChange={(e) => setSelectedClassId(e.target.value)}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ödev Başlığı</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Örn: Mazi Fiil Alıştırmaları"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ödev Açıklaması</label>
                  <textarea
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Alıştırma detaylarını buraya yazın..."
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Son Teslim Tarihi</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold text-sm transition-all"
                >
                  Yayınla
                </button>
              </form>
            </div>
          </div>

          {/* Assignments list and submissions viewer */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-slate-950 font-sans">Tanımlı Ödevler ve Teslimler</h3>
            {assignments.length === 0 ? (
              <p className="text-slate-400 text-sm py-12 text-center bg-white rounded-2xl border">
                Henüz yayınlanmış bir ödev bulunmamaktadır.
              </p>
            ) : (
              <div className="space-y-4">
                {assignments.map((assign) => (
                  <div key={assign.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs bg-teal-50 text-teal-800 font-semibold px-2 py-1 rounded-md">
                          {assign.classes.name}
                        </span>
                        <h4 className="font-bold text-slate-900 mt-2 text-lg">{assign.title}</h4>
                      </div>
                      <button
                        onClick={() => fetchSubmissions(assign.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-xs font-semibold text-slate-700 transition-colors"
                      >
                        📥 Teslimleri Gör
                      </button>
                    </div>

                    {/* Submissions Section */}
                    <div className="border-t border-slate-100 pt-4">
                      {subLoading ? (
                        <div className="flex h-12 items-center justify-center">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                        </div>
                      ) : submissions.length > 0 && submissions[0].assignment_id === assign.id ? (
                        <div className="space-y-3">
                          {submissions.map((sub) => (
                            <div key={sub.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-slate-900">{sub.profiles.full_name}</span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                  sub.status === "graded" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                                }`}>
                                  {sub.status === "graded" ? `Puanlandı: ${sub.grade}` : "Bekliyor"}
                                </span>
                              </div>

                              {sub.submission_text && (
                                <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                                  {sub.submission_text}
                                </p>
                              )}

                              {sub.file_url ? (
                                <a
                                  href={sub.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs font-semibold text-teal-700 hover:underline"
                                >
                                  📎 Dosya Eki (Tıkla ve Aç)
                                </a>
                              ) : sub.file_purged ? (
                                <span className="text-xs text-slate-400 block italic">
                                  🧹 Alan tasarrufu için orijinal dosya eki temizlenmiştir.
                                </span>
                              ) : null}

                              {/* Grade Form */}
                              {gradingId === sub.id ? (
                                <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                      <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Not (0-100)</label>
                                      <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full rounded border px-2 py-1 text-sm"
                                        placeholder="95"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Geri Bildirim</label>
                                      <input
                                        type="text"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-full rounded border px-2 py-1 text-sm"
                                        placeholder="Aferin, başarılı çalışma!"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setGradingId(null)}
                                      className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                                    >
                                      İptal
                                    </button>
                                    <button
                                      onClick={() => handleGradeSubmission(sub)}
                                      className="px-3 py-1 text-xs bg-teal-600 hover:bg-teal-500 text-white rounded font-semibold"
                                    >
                                      Notu Onayla & Dosyayı Sil
                                    </button>
                                  </div>
                                </div>
                              ) : sub.status === "pending" ? (
                                <button
                                  onClick={() => {
                                    setGradingId(sub.id);
                                    setGrade("");
                                    setFeedback("");
                                  }}
                                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
                                >
                                  Not Ver / Puanla
                                </button>
                              ) : (
                                <div className="text-xs text-slate-500 italic bg-white p-3 rounded-lg border border-slate-200">
                                  <strong>Geri Bildirim:</strong> {sub.feedback || "Yok"}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Teslimleri incelemek için yukarıdaki buton yardımıyla yükleme yapın.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
