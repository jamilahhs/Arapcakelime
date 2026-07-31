"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ClassObj {
  id: string;
  name: string;
  code: string;
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
  submission_text: string | null;
  file_url: string | null;
  file_purged: boolean;
  status: "pending" | "graded";
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
}

export default function StudentAssignments() {
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(true);

  // Submission Form State
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitText, setSubmitText] = useState("");
  const [submitFileUrl, setSubmitFileUrl] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch joined classes
      const { data: members, error: membersErr } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id);

      if (membersErr) throw membersErr;

      if (members && members.length > 0) {
        const classIds = members.map((m) => m.class_id);

        // Fetch classes details
        const { data: classDetails } = await supabase
          .from("classes")
          .select("*")
          .in("id", classIds);

        setClasses(classDetails || []);

        // 2. Fetch assignments
        const { data: assignData, error: assignErr } = await supabase
          .from("assignments")
          .select("*, classes(name)")
          .in("class_id", classIds)
          .order("due_date", { ascending: true });

        if (assignErr) throw assignErr;
        setAssignments(assignData || []);

        // 3. Fetch student's submissions
        const { data: subData, error: subErr } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("student_id", user.id);

        if (subErr) throw subErr;

        const subMap: Record<string, Submission> = {};
        (subData || []).forEach((sub) => {
          subMap[sub.assignment_id] = sub;
        });
        setSubmissions(subMap);
      } else {
        setClasses([]);
        setAssignments([]);
        setSubmissions({});
      }
    } catch (err) {
      console.error("Ödev paneli yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchDashboard();
    }, 0);
  }, []);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find class by code
      const { data: classObj, error: classErr } = await supabase
        .from("classes")
        .select("id")
        .eq("code", classCode.trim())
        .single();

      if (classErr || !classObj) {
        alert("Sınıf kodu bulunamadı. Lütfen kontrol edip tekrar deneyin.");
        return;
      }

      // Join class
      const { error: joinErr } = await supabase.from("class_members").insert({
        class_id: classObj.id,
        student_id: user.id,
      });

      if (joinErr) {
        // If unique constraint triggers, they are already in the class
        alert("Zaten bu sınıfa üyesiniz.");
      } else {
        alert("Sınıfa başarıyla katıldınız!");
        setClassCode("");
        await fetchDashboard();
      }
    } catch (err) {
      console.error("Sınıfa katılırken hata:", err);
    }
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save submission (upsert in case they submit again)
      const { error } = await supabase.from("assignment_submissions").upsert({
        assignment_id: assignmentId,
        student_id: user.id,
        submission_text: submitText || null,
        file_url: submitFileUrl || null,
        status: "pending",
      });

      if (error) throw error;

      alert("Ödev başarıyla teslim edildi!");
      setSubmittingId(null);
      setSubmitText("");
      setSubmitFileUrl("");
      await fetchDashboard();
    } catch (err) {
      console.error("Ödev teslim hatası:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sınıflar & Ödevler</h1>
          <p className="text-slate-500 mt-1">Katıldığınız sınıfları yönetin ve ödevlerinizi teslim edin.</p>
        </div>

        {/* Join Class Form */}
        <form onSubmit={handleJoinClass} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            required
            placeholder="Sınıf Kodu (Örn: ARAPCA-A1)"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Katıl
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Assignments */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-slate-950">Ödevleriniz</h3>
            {assignments.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
                <span className="text-3xl">📦</span>
                <p className="text-slate-400 text-sm mt-3">Herhangi bir ödev bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const submission = submissions[assignment.id];
                  const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date();

                  return (
                    <div key={assignment.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2 py-1 rounded-md">
                            {assignment.classes.name}
                          </span>
                          <h4 className="font-bold text-slate-900 mt-2 text-lg">{assignment.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-semibold uppercase">Son Teslim Tarihi</span>
                          <p className={`text-sm font-medium mt-1 ${isPastDue && !submission ? "text-red-600" : "text-slate-600"}`}>
                            {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString("tr-TR") : "Belirtilmedi"}
                          </p>
                        </div>
                      </div>

                      {assignment.description && (
                        <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {assignment.description}
                        </p>
                      )}

                      {/* Status / Grade Widget */}
                      {submission ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border bg-slate-50/50 text-sm gap-3">
                          <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase block">Teslim Durumu</span>
                            <span className={`inline-flex items-center gap-1 font-semibold mt-1 ${
                              submission.status === "graded" ? "text-emerald-700" : "text-amber-700"
                            }`}>
                              {submission.status === "graded" ? "✓ Puanlandı" : "⏳ İnceleniyor"}
                            </span>
                          </div>

                          {submission.grade !== null && (
                            <div className="sm:text-right">
                              <span className="text-xs text-slate-400 font-semibold uppercase block">Puan</span>
                              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                                {submission.grade} / 100
                              </span>
                            </div>
                          )}

                          {submission.feedback && (
                            <div className="w-full border-t border-slate-100 pt-3 mt-1 text-slate-600 col-span-2">
                              <span className="text-xs font-semibold text-slate-400 uppercase block">Hoca Yorumu:</span>
                              <p className="mt-1 italic">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {submittingId === assignment.id ? (
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                  Cevabınız (Metin)
                                </label>
                                <textarea
                                  rows={4}
                                  value={submitText}
                                  onChange={(e) => setSubmitText(e.target.value)}
                                  placeholder="Ödev cevabınızı buraya yazın..."
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                  Dosya Bağlantısı (İsteğe bağlı)
                                </label>
                                <input
                                  type="text"
                                  value={submitFileUrl}
                                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                                  placeholder="Örn: Google Drive veya Dropbox linki..."
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                />
                              </div>

                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setSubmittingId(null)}
                                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                  İptal
                                </button>
                                <button
                                  onClick={() => handleSubmitAssignment(assignment.id)}
                                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                                >
                                  Ödevi Gönder
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSubmittingId(assignment.id);
                                setSubmitText("");
                                setSubmitFileUrl("");
                              }}
                              className="w-full py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-sm font-semibold transition-all"
                            >
                              Ödev Gönder
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Classes Joined sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-950">Sınıflarım</h3>
            {classes.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Kayıtlı olduğunuz bir sınıf bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                      <span className="text-xs text-slate-400 font-mono mt-1 block">{cls.code}</span>
                    </div>
                    <span className="text-xl">🏫</span>
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
