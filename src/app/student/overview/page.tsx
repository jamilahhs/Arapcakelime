"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface SummaryStats {
  totalVocab: number;
  dueToday: number;
  activeAssignments: number;
  completedQuizzes: number;
}

export default function StudentOverview() {
  const [stats, setStats] = useState<SummaryStats>({
    totalVocab: 0,
    dueToday: 0,
    activeAssignments: 0,
    completedQuizzes: 0,
  });
  const [streak, setStreak] = useState(0);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Join Class State
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinedClasses, setJoinedClasses] = useState<{ id: string; name: string }[]>([]);

  const fetchOverviewData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Vocabulary metrics
      const { data: vocabData } = await supabase
        .from("vocabulary")
        .select("box_level, next_review_date")
        .eq("user_id", user.id);

      const totalVocab = vocabData?.length || 0;
      const todayStr = new Date().toISOString().split("T")[0];
      const dueToday =
        vocabData?.filter((v) => v.next_review_date <= todayStr).length || 0;

      // 2. Class memberships
      const { data: membershipData } = await supabase
        .from("class_members")
        .select("class_id, classes(id, name)")
        .eq("student_id", user.id);

      const enrolled = (membershipData || [])
        .map((m) => m.classes)
        .filter(Boolean) as unknown as { id: string; name: string }[];
      setJoinedClasses(enrolled);

      // 3. Active assignments count
      let activeAssignments = 0;
      if (enrolled.length > 0) {
        const classIds = enrolled.map((c) => c.id);
        const { data: assignmentData } = await supabase
          .from("assignments")
          .select("id")
          .in("class_id", classIds);

        activeAssignments = assignmentData?.length || 0;
      }

      // 4. Completed Quizzes count
      const { data: quizResults } = await supabase
        .from("quiz_results")
        .select("id")
        .eq("student_id", user.id);

      const completedQuizzes = quizResults?.length || 0;

      // 5. Fetch profile details (streak count)
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak_count")
        .eq("id", user.id)
        .single();
      
      const userStreak = profile?.streak_count || 0;
      setStreak(userStreak);

      // 6. Fetch homework submission count
      const { data: subData } = await supabase
        .from("assignment_submissions")
        .select("id")
        .eq("student_id", user.id);

      const homeworkSubmissions = subData?.length || 0;
      setHomeworkCount(homeworkSubmissions);

      setStats({
        totalVocab,
        dueToday,
        activeAssignments,
        completedQuizzes,
      });
    } catch (err) {
      console.error("Özet verileri alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchOverviewData();
    }, 0);
  }, []);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    try {
      setJoining(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Find class by code
      const { data: classData, error: classErr } = await supabase
        .from("classes")
        .select("id, name")
        .eq("code", classCode.trim().toUpperCase())
        .single();

      if (classErr || !classData) {
        alert("Sınıf bulunamadı. Lütfen kodu kontrol edin.");
        return;
      }

      // Check if already joined
      const { data: existingMember } = await supabase
        .from("class_members")
        .select("id")
        .eq("class_id", classData.id)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existingMember) {
        alert("Bu sınıfa zaten katılmış durumdasınız.");
        return;
      }

      // Join class
      const { error: joinErr } = await supabase.from("class_members").insert({
        class_id: classData.id,
        student_id: user.id,
      });

      if (joinErr) throw joinErr;

      setClassCode("");
      alert(`Sınıfa başarıyla katıldınız: ${classData.name}`);
      await fetchOverviewData();
    } catch (err) {
      console.error("Sınıfa katılım hatası:", err);
    } finally {
      setJoining(false);
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
    <div className="space-y-8">
      {/* Title greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Öğrenci Genel Bakış
        </h1>
        <p className="text-slate-500 mt-1">
          Arapça kelime ezberleme ve pratik yapma performansınıza göz atın.
        </p>
      </div>

      {/* Stats metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Ezberdeki Kelimeler
            </span>
            <span className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {stats.totalVocab}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            📖
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Bugün Tekrar Edilecekler
            </span>
            <span className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {stats.dueToday}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
            🔥
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Aktif Ödevler
            </span>
            <span className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {stats.activeAssignments}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            📅
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Sınav Serisi (Streak)
            </span>
            <span className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {streak} Gün
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            ⚡
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Study Prompt and Joined Classes list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-8 rounded-3xl text-white shadow-lg flex flex-col justify-between h-56">
            <div>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 font-bold uppercase tracking-wider">
                Günün Önerisi
              </span>
              <h2 className="text-xl font-bold mt-4 max-w-sm leading-relaxed">
                Tekrar zamanı gelen kelimeleriniz hafızanızı tazelemeyi bekliyor!
              </h2>
            </div>
            <Link
              href="/student/study-hub"
              className="w-fit px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all"
            >
              Çalışmaya Başla 🚀
            </Link>
          </div>

          {/* Joined Classes List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-950">Dahil Olduğunuz Sınıflar</h3>
            {joinedClasses.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">
                Henüz bir sınıfa katılmadınız. Sağdaki modülü kullanarak katılabilirsiniz.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {joinedClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800 text-sm truncate">
                      {cls.name}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                      Katıldı
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Join Class Module */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit">
          <h3 className="text-lg font-bold text-slate-950">Sınıfa Katıl</h3>
          <p className="text-xs text-slate-500">
            Öğretmeninizden aldığınız 6 karakterli davet kodunu girerek sınıfa dahil olun.
          </p>

          <form onSubmit={handleJoinClass} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Sınıf Davet Kodu
              </label>
              <input
                type="text"
                required
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Örn: ARP-9821"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-mono text-slate-950 uppercase focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all text-center"
              />
            </div>

            <button
              type="submit"
              disabled={joining || !classCode.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/10"
            >
              {joining ? "Katılınıyor..." : "Sınıfa Katıl"}
            </button>
          </form>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Başarı Rozetleri</h3>
          <p className="text-xs text-slate-500 mt-1">
            Çalışma ve ödev hedeflerine ulaşarak kilitli rozetleri açın!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              id: "first-step",
              name: "İlk Adım",
              desc: "İlk ödevini başarıyla teslim ettiğinde açılır.",
              icon: "🥉",
              unlocked: homeworkCount > 0,
              progress: `${homeworkCount > 0 ? 1 : 0} / 1`,
            },
            {
              id: "vocab-hunter",
              name: "Kelime Avcısı",
              desc: "Defterine 50 Arapça kelime eklediğinde açılır.",
              icon: "🥈",
              unlocked: stats.totalVocab >= 50,
              progress: `${stats.totalVocab} / 50`,
            },
            {
              id: "persistent-student",
              name: "Azimli Öğrenci",
              desc: "7 Günlük aktif çalışma serisine ulaştığında açılır.",
              icon: "🥇",
              unlocked: streak >= 7,
              progress: `${streak} / 7`,
            },
          ].map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border text-center transition-all ${
                badge.unlocked
                  ? "border-emerald-200 bg-emerald-50/10 shadow-sm shadow-emerald-50"
                  : "border-slate-100 bg-slate-50/50 opacity-60 grayscale"
              }`}
            >
              <span className="text-4xl block mb-3">{badge.icon}</span>
              <h4 className="font-bold text-slate-900 text-sm">{badge.name}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed px-2">
                {badge.desc}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100/60 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Durum
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    badge.unlocked
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {badge.unlocked ? "Açıldı ✓" : badge.progress}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
