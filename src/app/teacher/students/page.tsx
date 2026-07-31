"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ClassObj {
  id: string;
  name: string;
}

interface StudentStat {
  id: string;
  full_name: string;
  streak_count: number;
  vocabCount: number;
  box5Count: number;
  homeworkSubmitted: number;
  homeworkTotal: number;
  homeworkAverage: number;
  quizAverage: number;
  quizCompleted: number;
}

interface DetailedHomework {
  title: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  submission_text: string | null;
  submitted_at: string;
}

interface DetailedQuiz {
  title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export default function TeacherStudents() {
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // Modal Detail States
  const [selectedStudent, setSelectedStudent] = useState<StudentStat | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [recentHomeworks, setRecentHomeworks] = useState<DetailedHomework[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<DetailedQuiz[]>([]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id);

      if (error) throw error;
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (err) {
      console.error("Sınıflar çekilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async (classId: string) => {
    try {
      setStatsLoading(true);

      // 1. Fetch student profiles in this class
      const { data: members, error: membersErr } = await supabase
        .from("class_members")
        .select("profiles(id, full_name, streak_count)")
        .eq("class_id", classId);

      if (membersErr) throw membersErr;

      const students = (members || [])
        .map((m) => (m as unknown as { profiles: { id: string; full_name: string; streak_count: number } }).profiles)
        .filter(Boolean);

      if (students.length === 0) {
        setStudentStats([]);
        setStatsLoading(false);
        return;
      }

      // 2. Fetch total assignments in this class
      const { data: classAssignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("class_id", classId);
      const totalAssignments = classAssignments?.length || 0;
      const assignmentIds = classAssignments?.map((a) => a.id) || [];

      // 3. Fetch total quizzes in this class
      const { data: classQuizzes } = await supabase
        .from("quizzes")
        .select("id")
        .eq("class_id", classId);
      const quizIds = classQuizzes?.map((q) => q.id) || [];

      const statsList: StudentStat[] = [];

      for (const student of students) {
        // Vocabulary stats
        const { data: vocabList } = await supabase
          .from("vocabulary")
          .select("box_level")
          .eq("user_id", student.id);

        const vocabCount = vocabList?.length || 0;
        const box5Count = vocabList?.filter((v) => v.box_level === 5).length || 0;

        // Homework stats
        let homeworkSubmitted = 0;
        let homeworkAverage = 0;

        if (assignmentIds.length > 0) {
          const { data: submissions } = await supabase
            .from("assignment_submissions")
            .select("grade, status")
            .eq("student_id", student.id)
            .in("assignment_id", assignmentIds);

          homeworkSubmitted = submissions?.length || 0;
          const gradedSubmissions =
            submissions?.filter((s) => s.status === "graded" && s.grade !== null) || [];
          if (gradedSubmissions.length > 0) {
            const totalGrades = gradedSubmissions.reduce(
              (acc, curr) => acc + (curr.grade || 0),
              0
            );
            homeworkAverage = Math.round(totalGrades / gradedSubmissions.length);
          }
        }

        // Quiz stats
        let quizCompleted = 0;
        let quizAverage = 0;

        if (quizIds.length > 0) {
          const { data: quizResults } = await supabase
            .from("quiz_results")
            .select("score, total_questions")
            .eq("student_id", student.id)
            .in("quiz_id", quizIds);

          quizCompleted = quizResults?.length || 0;
          if (quizResults && quizResults.length > 0) {
            const totalPercentage = quizResults.reduce((acc, curr) => {
              const pct =
                curr.total_questions > 0 ? (curr.score / curr.total_questions) * 100 : 0;
              return acc + pct;
            }, 0);
            quizAverage = Math.round(totalPercentage / quizResults.length);
          }
        }

        statsList.push({
          id: student.id,
          full_name: student.full_name,
          streak_count: student.streak_count || 0,
          vocabCount,
          box5Count,
          homeworkSubmitted,
          homeworkTotal: totalAssignments,
          homeworkAverage,
          quizAverage,
          quizCompleted,
        });
      }

      setStudentStats(statsList);
    } catch (err) {
      console.error("Öğrenci verileri alınırken hata:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const openDetailModal = async (student: StudentStat) => {
    setSelectedStudent(student);
    setShowModal(true);
    setDetailsLoading(true);

    try {
      if (!selectedClassId) return;

      // 1. Fetch class assignments details and user's submissions
      const { data: classAssigns } = await supabase
        .from("assignments")
        .select("id, title")
        .eq("class_id", selectedClassId);

      const assignMap: Record<string, string> = {};
      classAssigns?.forEach((a) => {
        assignMap[a.id] = a.title;
      });
      const assignIds = classAssigns?.map((a) => a.id) || [];

      let subs: DetailedHomework[] = [];
      if (assignIds.length > 0) {
        const { data: submissionData } = await supabase
          .from("assignment_submissions")
          .select("assignment_id, grade, status, feedback, submission_text, submitted_at")
          .eq("student_id", student.id)
          .in("assignment_id", assignIds);

        subs = (submissionData || []).map((s) => ({
          title: assignMap[s.assignment_id] || "Ödev",
          status: s.status,
          grade: s.grade,
          feedback: s.feedback,
          submission_text: s.submission_text,
          submitted_at: s.submitted_at,
        }));
      }
      setRecentHomeworks(subs);

      // 2. Fetch class quizzes details and user's quiz results
      const { data: classQuizzes } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("class_id", selectedClassId);

      const qMap: Record<string, string> = {};
      classQuizzes?.forEach((q) => {
        qMap[q.id] = q.title;
      });
      const quizIds = classQuizzes?.map((q) => q.id) || [];

      let resultsList: DetailedQuiz[] = [];
      if (quizIds.length > 0) {
        const { data: quizResultData } = await supabase
          .from("quiz_results")
          .select("quiz_id, score, total_questions, completed_at")
          .eq("student_id", student.id)
          .in("quiz_id", quizIds);

        resultsList = (quizResultData || []).map((r) => ({
          title: qMap[r.quiz_id] || "Sınav",
          score: r.score,
          total_questions: r.total_questions,
          completed_at: r.completed_at,
        }));
      }
      setRecentQuizzes(resultsList);
    } catch (err) {
      console.error("Detaylar çekilemedi:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchClasses();
    }, 0);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      setTimeout(() => {
        fetchStudentStats(selectedClassId);
      }, 0);
    }
  }, [selectedClassId]);

  return (
    <div className="space-y-8 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Öğrenci İlerleme İzleme
          </h1>
          <p className="text-slate-500 mt-1">
            Öğrencilerinizin aktif serilerini, kelime ezberlerini ve sınav/ödev puanlarını analiz edin.
          </p>
        </div>

        {/* Class selection dropdown */}
        {classes.length > 0 && (
          <div>
            <select
              value={selectedClassId || ""}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none sm:text-sm font-semibold shadow-sm"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-655 border-teal-600 border-t-transparent"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-3xl">🏫</span>
          <p className="text-slate-400 text-sm mt-3">
            Analiz yapmak için önce en az bir sınıf oluşturmalısınız.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {statsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
            </div>
          ) : studentStats.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-16">
              Bu sınıfa kayıtlı öğrenci bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider bg-slate-50/50">
                    <th className="py-4 px-6">Öğrenci</th>
                    <th className="py-4 px-6">Çalışma Serisi</th>
                    <th className="py-4 px-4">Ezberlenen Kelimeler</th>
                    <th className="py-4 px-4">Ödev Teslimleri</th>
                    <th className="py-4 px-4">Ödev Not Ort.</th>
                    <th className="py-4 px-4">Sınav Ortalaması</th>
                    <th className="py-4 px-6 text-right">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentStats.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {student.full_name}
                      </td>
                      <td className="py-4 px-6">
                        {student.streak_count > 0 ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            🔥 {student.streak_count} Gün
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Aktif Değil</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium">
                        <div>{student.vocabCount} Kelime</div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          ({student.box5Count} Tam Ezber)
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        {student.homeworkSubmitted} / {student.homeworkTotal}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900">
                          {student.homeworkSubmitted > 0
                            ? `${student.homeworkAverage} / 100`
                            : "-"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            student.quizCompleted > 0
                              ? student.quizAverage >= 70
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {student.quizCompleted > 0 ? `%${student.quizAverage}` : "Girilmedi"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openDetailModal(student)}
                          className="text-xs font-bold text-teal-655 text-teal-600 hover:underline cursor-pointer"
                        >
                          Detayları İncele
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Student Details Popup Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedStudent.full_name} - İlerleme Raporu
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Son ödev teslimleri ve sınav başarı oranları.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center font-bold text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailsLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Side: Homework Submissions */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 border-b pb-2 text-sm">
                      Son Ödev Performansı
                    </h4>
                    {recentHomeworks.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">
                        Ödev teslim kaydı bulunamadı.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {recentHomeworks.map((hw, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-slate-800 truncate block max-w-[180px]">
                                {hw.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  hw.status === "graded"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-amber-50 text-amber-800"
                                }`}
                              >
                                {hw.status === "graded" ? `Not: ${hw.grade}` : "Bekliyor"}
                              </span>
                            </div>
                            {hw.submission_text && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-white p-2 rounded border border-slate-200/50">
                                {hw.submission_text}
                              </p>
                            )}
                            {hw.feedback && (
                              <div className="text-[10px] text-teal-800 bg-teal-50/50 p-2 rounded">
                                <strong>Yorum:</strong> {hw.feedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Quiz Submissions */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 border-b pb-2 text-sm">
                      Son Sınav Sonuçları
                    </h4>
                    {recentQuizzes.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">
                        Sınav katılım kaydı bulunamadı.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {recentQuizzes.map((quiz, idx) => {
                          const pct = Math.round((quiz.score / quiz.total_questions) * 100);
                          return (
                            <div
                              key={idx}
                              className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 flex justify-between items-center"
                            >
                              <div className="overflow-hidden pr-2">
                                <span className="font-bold text-xs text-slate-800 truncate block">
                                  {quiz.title}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(quiz.completed_at).toLocaleDateString("tr-TR")}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  pct >= 70
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-rose-50 text-rose-800"
                                }`}
                              >
                                {quiz.score} / {quiz.total_questions} (%{pct})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/20">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
