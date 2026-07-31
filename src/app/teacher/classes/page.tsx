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

const PREMADE_PACKS = [
  {
    id: "pack_colors",
    name: "Renkler (الألوان)",
    words: [
      { arabic_word: "أَحْمَر", turkish_meaning: "Kırmızı", root_word: "حmer", example_sentence: "الْوَرْدَةُ حَمْرَاءُ جَمِيلَةٌ." },
      { arabic_word: "أَزْرَق", turkish_meaning: "Mavi", root_word: "zrq", example_sentence: "السَّمَاءُ زَرْقَاءُ صَافِيَةٌ الْيَوْمَ." },
      { arabic_word: "أَخْضَر", turkish_meaning: "Yeşil", root_word: "xdr", example_sentence: "الْعُشْبُ فِي الْحَدِيقَةِ أَخْضَرُ رَطْبٌ." },
      { arabic_word: "أَصْفَر", turkish_meaning: "Sarı", root_word: "sfr", example_sentence: "اللَّiمُونُ أَصْفَرُ وَحَامِضٌ." },
      { arabic_word: "أَبْيَض", turkish_meaning: "Beyaz", root_word: "byd", example_sentence: "الثَّلْجُ أَبْيَضُ نَاصِعٌ فِي الشِّtاءِ." },
      { arabic_word: "أَسْوَد", turkish_meaning: "Siyah", root_word: "swd", example_sentence: "الْقِطُّ الأَسْوَدُ يَنَامُ عَلَى الْكُرْسِيِّ." },
    ],
  },
  {
    id: "pack_verbs",
    name: "Temel Fiiller (الأفعال)",
    words: [
      { arabic_word: "ذَهَبَ", turkish_meaning: "Gitti", root_word: "zhb", example_sentence: "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا." },
      { arabic_word: "كَتَبَ", turkish_meaning: "Yazdı", root_word: "ktb", example_sentence: "كَتَبَ الْوَلَدُ الرِّسَالَةَ بِالْقَلَمِ." },
      { arabic_word: "قَرَأَ", turkish_meaning: "Okudu", root_word: "qr'", example_sentence: "قَرَأَتْ أُمِّي كِtَابًا جَمِيلًا." },
      { arabic_word: "شَرِبَ", turkish_meaning: "İçti", root_word: "shrb", example_sentence: "شَرِبَ الطِّفْلُ الْحَلِيبَ الدَّافِئَ." },
      { arabic_word: "أَكَلَ", turkish_meaning: "Yedi", root_word: "akl", example_sentence: "أَكَلَ الرَّجُلُ التُّفَّاحَةَ اللَّذِيذَةَ." },
      { arabic_word: "جَلَسَ", turkish_meaning: "Oturdu", root_word: "jls", example_sentence: "جَلَسَ الْمُعَلِّمُ عَلَى الْكُرْسِيِّ الْخَشَبِيِّ." },
    ],
  },
  {
    id: "pack_daily",
    name: "Günlük İletişim (الحوار)",
    words: [
      { arabic_word: "مَرْحَبًا", turkish_meaning: "Merhaba", root_word: "rhb", example_sentence: "مَرْحَبًا بِكَ يَا صَدِيقِي الْعَZِيزُ." },
      { arabic_word: "شُكْرًا", turkish_meaning: "Teşekkürler", root_word: "shkr", example_sentence: "شُكْرًا جَزِيلًا عَلَى هَدِيَّتِكَ الرَّائِعَةِ." },
      { arabic_word: "مِنْ فَضْلِكَ", turkish_meaning: "Lütfen", root_word: "fdl", example_sentence: "أَعْطِنِي الْقَلَمَ مِنْ فَضْلِكَ." },
      { arabic_word: "آسِف", turkish_meaning: "Üzgünüm / Özür dilerim", root_word: "asf", example_sentence: "أَنَا آسِفٌ لِأَنِّي تَأَخَّرْتُ عَنِ الدَّرْسِ." },
      { arabic_word: "كَيْفَ حَالُكَ؟", turkish_meaning: "Nasılsın?", root_word: "hwl", example_sentence: "كَيْفَ حَالُكَ يَا أَخِي الْغَالِي؟" },
      { arabic_word: "بِخَيْر", turkish_meaning: "İyiyim", root_word: "xhr", example_sentence: "أَنَا بِخَيْرٍ وَالْحَمْدُ للهِ كَثِيرًا." },
    ],
  },
  {
    id: "pack_house",
    name: "Ev Eşyaları (البيت)",
    words: [
      { arabic_word: "بَيْت", turkish_meaning: "Ev", root_word: "byt", example_sentence: "هَذَا بَيْتُنَا الْكَبِيرُ وَالْجَمِيلُ." },
      { arabic_word: "غُرْفَة", turkish_meaning: "Oda", root_word: "grf", example_sentence: "أَنَامُ فِي غُرْفَةِ النَّوْمِ الْهَادِئَةِ." },
      { arabic_word: "بَاب", turkish_meaning: "Kapı", root_word: "bwb", example_sentence: "افْتَحِ الْبَابَ لِيَدْخُلَ الضَّيْفُ." },
      { arabic_word: "نَافِذَة", turkish_meaning: "Pencere", root_word: "nfd", example_sentence: "انْظُرْ مِنَ النَّافِذَةِ إِلَى الْحَدِيقَةِ." },
      { arabic_word: "طَاوِلَة", turkish_meaning: "Masa", root_word: "twl", example_sentence: "الْكِtَابُ مَوْضُوعٌ عَلَى الطَّاوِلَةِ." },
      { arabic_word: "كُرْسِيّ", turkish_meaning: "Sandalye", root_word: "krs", example_sentence: "اجْلِسْ عَلَى الْكُرْسِيِّ الْمُرِيحِ." },
    ],
  },
];

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

  // Assign Vocabulary state
  const [selectedPackId, setSelectedPackId] = useState("pack_colors");
  const [assigningVocab, setAssigningVocab] = useState(false);

  // Publish Note form state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [publishingNote, setPublishingNote] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

        const classIds = classList.map((c) => c.id);
        const { data: allMembers, error: membersCountErr } = await supabase
          .from("class_members")
          .select("student_id")
          .in("class_id", classIds);

        if (!membersCountErr && allMembers) {
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

  // Push vocabulary pack to all students in the selected class
  const handleAssignVocab = async () => {
    if (!selectedClassId) return;
    const pack = PREMADE_PACKS.find((p) => p.id === selectedPackId);
    if (!pack) return;

    try {
      setAssigningVocab(true);
      const studentIds = members.map((m) => m.profiles.id);

      if (studentIds.length === 0) {
        alert("Bu sınıfta henüz hiç öğrenci yok. Kelime atanamadı!");
        return;
      }

      const insertRows: {
        user_id: string;
        arabic_word: string;
        turkish_meaning: string;
        root_word: string | null;
        example_sentence: string | null;
        box_level: number;
      }[] = [];
      studentIds.forEach((sId) => {
        pack.words.forEach((w) => {
          insertRows.push({
            user_id: sId,
            arabic_word: w.arabic_word,
            turkish_meaning: w.turkish_meaning,
            root_word: w.root_word,
            example_sentence: w.example_sentence,
            box_level: 1,
          });
        });
      });

      const { error } = await supabase.from("vocabulary").insert(insertRows);
      if (error) throw error;

      alert(
        `"${pack.name}" paketindeki ${pack.words.length} kelime sınıftaki ${studentIds.length} öğrenciye başarıyla atandı!`
      );
    } catch (err) {
      console.error("Kelime atama hatası:", err);
    } finally {
      setAssigningVocab(false);
    }
  };

  // Publish Shared Lesson Note to Class
  const handlePublishNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !noteTitle.trim() || !noteContent.trim()) return;

    try {
      setPublishingNote(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        class_id: selectedClassId,
      });

      if (error) throw error;

      alert("Ders notu sınıfa başarıyla yayınlandı!");
      setNoteTitle("");
      setNoteContent("");
    } catch (err) {
      console.error("Ders notu yayınlama hatası:", err);
    } finally {
      setPublishingNote(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans">
          Sınıf Yönetim Paneli
        </h1>
        <p className="text-slate-500 mt-1">
          Sınıflarınızı oluşturun, öğrencileri yönetin ve kelime/not dağıtımı yapın.
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
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-900/10 cursor-pointer"
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

          {/* Right panel: Class Member Student List and Resource Assignment */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClassId === null ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center py-12">
                <p className="text-slate-400 text-sm">
                  Bilgileri görüntülemek için sol panelden bir sınıf seçin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Class Students Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      Sınıftaki Öğrenciler ({members.length})
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Kodu kullanarak sınıfa kayıt olan öğrenciler.
                    </p>
                  </div>

                  {membersLoading ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl space-y-2">
                      <span className="text-2xl block">👥</span>
                      <p className="text-slate-400 text-xs font-semibold">
                        Henüz kayıtlı öğrenci yok.
                      </p>
                      <p className="text-[10px] text-slate-450 max-w-[180px] mx-auto leading-relaxed">
                        Sınıf kodunu öğrencilerinizle paylaşın.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
                      {members.map((member) => (
                        <div
                          key={member.profiles.id}
                          className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                              {member.profiles.full_name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800 text-xs">
                              {member.profiles.full_name}
                            </span>
                          </div>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase">
                            Kayıtlı
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Vocabulary & Notes Distribution Panel */}
                <div className="space-y-6">
                  {/* Vocab push */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">
                        Sınıfa Kelime Ata
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Seçilen kelime paketini sınıftaki tüm öğrencilerin dağarcığına ekleyin.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <select
                        value={selectedPackId}
                        onChange={(e) => setSelectedPackId(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                      >
                        {PREMADE_PACKS.map((pack) => (
                          <option key={pack.id} value={pack.id}>
                            {pack.name} ({pack.words.length} Kelime)
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={assigningVocab || members.length === 0}
                        onClick={handleAssignVocab}
                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow shadow-teal-900/10"
                      >
                        {assigningVocab ? "Atanıyor..." : "Kelimeleri Sınıfa Gönder 🚀"}
                      </button>
                    </div>
                  </div>

                  {/* Shared Note publish */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">
                        Sınıfta Ders Notu Yayınla
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Tüm sınıfın görebileceği ortak ders notu yayınlayın.
                      </p>
                    </div>

                    <form onSubmit={handlePublishNote} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="Ders Notu Başlığı"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        />
                      </div>
                      <div>
                        <textarea
                          required
                          rows={3}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Ders notu içeriği, gramer kuralları veya açıklamalar..."
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={publishingNote || members.length === 0}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow shadow-indigo-900/10"
                      >
                        {publishingNote ? "Yayınlanıyor..." : "Ders Notunu Yayınla 📝"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
