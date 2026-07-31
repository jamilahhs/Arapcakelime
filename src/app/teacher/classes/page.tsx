"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ClassObj {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

interface ClassMember {
  class_id: string;
  profiles: {
    id: string;
    full_name: string;
    role: string;
  };
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);

  // Stats Counters
  const [totalClassesCount, setTotalClassesCount] = useState(0);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  // New Class Form State
  const [className, setClassName] = useState("");

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch teacher's classes
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const classList = data || [];
      setClasses(classList);
      setTotalClassesCount(classList.length);

      if (classList.length > 0) {
        setSelectedClassId(classList[0].id);

        // Fetch overall student count enrolled in all of these classes
        const classIds = classList.map((c) => c.id);
        const { data: allMembers, error: membersCountErr } = await supabase
          .from("class_members")
          .select("student_id")
          .in("class_id", classIds);

        if (!membersCountErr && allMembers) {
          // Count unique student ids
          const uniqueStudents = new Set(allMembers.map((m) => m.student_id));
          setTotalStudentsCount(uniqueStudents.size);
        }
      }
    } catch (err) {
      console.error("Sınıflar çekilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassMembers = async (classId: string) => {
    try {
      setMembersLoading(true);
      const { data, error } = await supabase
        .from("class_members")
        .select("class_id, profiles(id, full_name, role)")
        .eq("class_id", classId);

      if (error) throw error;
      setMembers((data as unknown as ClassMember[]) || []);
    } catch (err) {
      console.error("Öğrenciler çekilirken hata:", err);
    } finally {
      setMembersLoading(false);
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
        fetchClassMembers(selectedClassId);
      }, 0);
    } else {
      setTimeout(() => {
        setMembers([]);
      }, 0);
    }
  }, [selectedClassId]);

  // Alphanumeric code generation e.g. ARP-4921
  const generateClassCode = () => {
    const digits = "0123456789";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return `ARP-${randomPart}`;
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let success = false;
      let attempts = 0;
      let generatedCode = "";

      // Collision retry logic for unique codes
      while (!success && attempts < 5) {
        generatedCode = generateClassCode();
        const { error } = await supabase.from("classes").insert({
          teacher_id: user.id,
          name: className.trim(),
          code: generatedCode,
        });

        if (!error) {
          success = true;
        } else if (error.code === "23505") {
          // Unique key violation Postgres code
          attempts++;
        } else {
          throw error;
        }
      }

      if (!success) {
        alert("Sınıf kodu üretilemedi. Lütfen tekrar deneyin.");
        return;
      }

      setClassName("");
      alert(`Sınıf oluşturuldu! Kod: ${generatedCode}`);
      await fetchClasses();
    } catch (err) {
      console.error("Sınıf oluşturma hatası:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Kod panoya kopyalandı: ${text}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans">
          Sınıf Yönetim Paneli
        </h1>
        <p className="text-slate-500 mt-1">
          Sınıflarınızı oluşturun ve kodları öğrencilerinizle paylaşarak onları davet edin.
        </p>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Toplam Sınıf Sayısı
            </span>
            <span className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {totalClassesCount}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl font-bold">
            🏫
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Aktif Öğrenci Sayısı
            </span>
            <span className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {totalStudentsCount}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            👥
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Add class and list selectors */}
          <div className="space-y-6">
            {/* Create Class Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-950">Yeni Sınıf Oluştur</h3>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Sınıf Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Örn: Hızlandırılmış Arapça A2"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-950 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-900/10"
                >
                  Sınıf Oluştur
                </button>
              </form>
            </div>

            {/* Selectable Class Cards */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-950">Sınıflarınız</h3>
              {classes.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  Henüz bir sınıf oluşturmadınız.
                </p>
              ) : (
                <div className="space-y-3">
                  {classes.map((cls) => {
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <div
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/20 shadow-sm shadow-teal-50"
                            : "border-slate-100 hover:bg-slate-50/60"
                        }`}
                      >
                        <h4 className="font-bold text-slate-900 truncate">
                          {cls.name}
                        </h4>
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(cls.code);
                            }}
                            className="text-[10px] bg-slate-900 font-mono text-teal-400 font-bold px-2 py-0.5 rounded hover:bg-slate-950 transition-colors"
                            title="Kodu kopyalamak için tıklayın"
                          >
                            Kod: {cls.code} 📋
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Class Member Student List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Sınıftaki Kayıtlı Öğrenciler
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kodu kullanarak bu sınıfa katılan öğrencilerin listesi.
              </p>
            </div>

            {selectedClassId === null ? (
              <p className="text-slate-400 text-sm text-center py-12">
                Bilgileri görüntülemek için sol panelden bir sınıf seçin.
              </p>
            ) : membersLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <span className="text-3xl block">👥</span>
                <p className="text-slate-400 text-sm font-semibold">
                  Bu sınıfta henüz kayıtlı öğrenci bulunmuyor.
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Öğrencilerinizin panele girmesi için sınıf kodunu onlarla paylaşın.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                {members.map((member) => (
                  <div
                    key={member.profiles.id}
                    className="py-4 flex items-center justify-between first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm uppercase">
                        {member.profiles.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800 text-sm">
                        {member.profiles.full_name}
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase">
                      Kayıt Oldu
                    </span>
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
