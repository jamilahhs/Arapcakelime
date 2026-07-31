"use client";

import React, { useEffect, useState, useRef } from "react";
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
      { arabic_word: "أَحْمَر", turkish_meaning: "Kırmızı", root_word: "حمر", example_sentence: "الْوَرْدَةُ حَمْرَاءُ جَمِيلَةٌ." },
      { arabic_word: "أَزْرَق", turkish_meaning: "Mavi", root_word: "زرق", example_sentence: "السَّمَاءُ زَرْقَاءُ صَافِيَةٌ الْيَوْمَ." },
      { arabic_word: "أَخْضَر", turkish_meaning: "Yeşil", root_word: "خضر", example_sentence: "الْعُشْبُ فِي الْحَدِيقَةِ أَخْضَرُ رَطْبٌ." },
      { arabic_word: "أَصْفَر", turkish_meaning: "Sarı", root_word: "صفر", example_sentence: "اللَّيْمُونُ أَصْفَرُ وَحَامِضٌ." },
      { arabic_word: "أَبْيَض", turkish_meaning: "Beyaz", root_word: "بيض", example_sentence: "الثَّلْجُ أَبْيَضُ نَاصِعٌ فِي الشِّتَاءِ." },
      { arabic_word: "أَسْوَد", turkish_meaning: "Siyah", root_word: "سود", example_sentence: "الْقِطُّ الأَسْوَدُ يَنَامُ عَلَى الْكُرْسِيِّ." },
    ],
  },
  {
    id: "pack_verbs",
    name: "Temel Fiiller (الأفعال)",
    words: [
      { arabic_word: "ذَهَبَ", turkish_meaning: "Gitti", root_word: "ذهب", example_sentence: "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا." },
      { arabic_word: "كَتَبَ", turkish_meaning: "Yazdı", root_word: "كتب", example_sentence: "كَتَبَ الْوَلَدُ الرِّسَالَةَ بِالْقَلَمِ." },
      { arabic_word: "قَرَأَ", turkish_meaning: "Okudu", root_word: "قرأ", example_sentence: "قَرَأَتْ أُمِّي كِتَابًا جَمِيلًا." },
      { arabic_word: "شَرِبَ", turkish_meaning: "İçti", root_word: "شرب", example_sentence: "شَرِبَ الطِّفْلُ الْحَلِيبَ الدَّافِئَ." },
      { arabic_word: "أَكَلَ", turkish_meaning: "Yedi", root_word: "أكل", example_sentence: "أَكَلَ الرَّجُلُ التُّفَّاحَةَ اللَّذِيذَةَ." },
      { arabic_word: "جَلَسَ", turkish_meaning: "Oturdu", root_word: "جلس", example_sentence: "جَلَسَ الْمُعَلِّمُ عَلَى الْكُرْسِيِّ الْخَشَبِيِّ." },
    ],
  },
  {
    id: "pack_daily",
    name: "Günlük İletişim (الحوار)",
    words: [
      { arabic_word: "مَرْحَبًا", turkish_meaning: "Merhaba", root_word: "رحيب", example_sentence: "مَرْحَبًا بِكَ يَا صَدِيقِي الْعَزِيزُ." },
      { arabic_word: "شُكْرًا", turkish_meaning: "Teşekkürler", root_word: "شكر", example_sentence: "شُكْرًا جَZِيلًا عَلَى هَدِيَّتِكَ الرَّائِعَةِ." },
      { arabic_word: "مِنْ فَضْلِكَ", turkish_meaning: "Lütfen", root_word: "فضل", example_sentence: "أَعْطِنِي الْقَلَمَ مِنْ فَضْلِكَ." },
      { arabic_word: "آسِف", turkish_meaning: "Üzgünüm / Özür dilerim", root_word: "أسف", example_sentence: "أَنَا آسِفٌ لِأَنِّي تَأَخَّرْتُ عَنِ الدَّرْسِ." },
      { arabic_word: "كَيْفَ حَالُكَ؟", turkish_meaning: "Nasılsın?", root_word: "حول", example_sentence: "كَيْفَ حَالُكَ يَا أَخِي الْغَالِي؟" },
      { arabic_word: "بِخَيْر", turkish_meaning: "İyiyim", root_word: "خير", example_sentence: "أَنَا بِخَيْرٍ وَالْحَمْدُ للهِ كَثِيرًا." },
    ],
  },
  {
    id: "pack_house",
    name: "Ev Eşyaları (البيت)",
    words: [
      { arabic_word: "بَيْت", turkish_meaning: "Ev", root_word: "بيت", example_sentence: "هَذَا بَيْتُنَا الْكَبِيرُ وَالْجَمِيلُ." },
      { arabic_word: "غُرْفَة", turkish_meaning: "Oda", root_word: "غرف", example_sentence: "أَنَامُ فِي غُرْفَةِ النَّوْمِ الْهَادِئَةِ." },
      { arabic_word: "بَاب", turkish_meaning: "Kapı", root_word: "بوب", example_sentence: "افْتَحِ الْبَابَ لِيَدْخُلَ الضَّيْفُ." },
      { arabic_word: "نَافِذَة", turkish_meaning: "Pencere", root_word: "نفذ", example_sentence: "انْظُرْ مِنَ النَّافِذَةِ إِلَى الْحَدِيقَةِ." },
      { arabic_word: "طَاوِلَة", turkish_meaning: "Masa", root_word: "طول", example_sentence: "الْكِتَابُ مَوْضُوعٌ عَلَى الطَّاوِلَةِ." },
      { arabic_word: "كُرْسِيّ", turkish_meaning: "Sandalye", root_word: "كرس", example_sentence: "اجْلِسْ عَلَى الْكُرْسِيِّ الْمُرِيحِ." },
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
  const [totalNotesCount, setTotalNotesCount] = useState(0);

  // New Class Form State
  const [className, setClassName] = useState("");

  // Tabs for resource distribution
  const [activeResourceTab, setActiveResourceTab] = useState<"premade" | "custom" | "note">("premade");

  // Assign Premade Vocabulary state
  const [selectedPackId, setSelectedPackId] = useState("pack_colors");
  const [assigningVocab, setAssigningVocab] = useState(false);

  // Assign Custom Vocabulary state
  const [customArabic, setCustomArabic] = useState("");
  const [customTurkish, setCustomTurkish] = useState("");
  const [customRoot, setCustomRoot] = useState("");
  const [customExample, setCustomExample] = useState("");
  const [assigningCustom, setAssigningCustom] = useState(false);

  // Publish Note form state
  const [noteTitle, setNoteTitle] = useState("");
  const [publishingNote, setPublishingNote] = useState(false);

  const teacherEditorRef = useRef<HTMLDivElement>(null);

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

        // Fetch published notes count
        const { data: allNotes } = await supabase
          .from("notes")
          .select("id")
          .in("class_id", classIds);
        setTotalNotesCount(allNotes?.length || 0);
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

  // Push Custom Word to all students in the selected class
  const handleAssignCustomVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !customArabic.trim() || !customTurkish.trim()) return;

    try {
      setAssigningCustom(true);
      const studentIds = members.map((m) => m.profiles.id);

      if (studentIds.length === 0) {
        alert("Bu sınıfta henüz hiç öğrenci yok. Kelime atanamadı!");
        return;
      }

      const insertRows = studentIds.map((sId) => ({
        user_id: sId,
        arabic_word: customArabic.trim(),
        turkish_meaning: customTurkish.trim(),
        root_word: customRoot.trim() || null,
        example_sentence: customExample.trim() || null,
        box_level: 1,
      }));

      const { error } = await supabase.from("vocabulary").insert(insertRows);
      if (error) throw error;

      alert(`"${customArabic}" kelimesi sınıftaki ${studentIds.length} öğrenciye başarıyla atandı!`);
      setCustomArabic("");
      setCustomTurkish("");
      setCustomRoot("");
      setCustomExample("");
    } catch (err) {
      console.error("Özel kelime atama hatası:", err);
    } finally {
      setAssigningCustom(false);
    }
  };

  // Publish Shared Lesson Note to Class
  const handlePublishNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const htmlContent = teacherEditorRef.current?.innerHTML || "";
    if (!selectedClassId || !noteTitle.trim() || !htmlContent.trim()) {
      alert("Lütfen başlık ve içerik alanlarını doldurun.");
      return;
    }

    try {
      setPublishingNote(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: noteTitle.trim(),
        content: htmlContent,
        class_id: selectedClassId,
      });

      if (error) throw error;

      alert("Ders notu sınıfa başarıyla yayınlandı!");
      setNoteTitle("");
      if (teacherEditorRef.current) teacherEditorRef.current.innerHTML = "";
      await fetchClasses();
    } catch (err) {
      console.error("Ders notu yayınlama hatası:", err);
    } finally {
      setPublishingNote(false);
    }
  };

  // Rich Text Editor Commands
  const formatTeacherText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    teacherEditorRef.current?.focus();
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

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Yayınlanan Ders Notları
            </span>
            <span className="text-3xl font-extrabold text-slate-950 mt-2 block">
              {totalNotesCount}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            📝
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Class Students Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit md:col-span-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      Sınıftaki Öğrenciler ({members.length})
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Kayıt olan öğrenciler.
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
                        Kayıtlı öğrenci yok.
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Vocabulary & Notes Distribution Panel */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm md:col-span-2 space-y-4">
                  {/* Swappable Resource Tabs */}
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveResourceTab("premade")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeResourceTab === "premade"
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Hazır Kelimeler
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResourceTab("custom")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeResourceTab === "custom"
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Özel Kelime
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveResourceTab("note")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeResourceTab === "note"
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Ders Notu Paylaş 📝
                    </button>
                  </div>

                  {/* TAB 1: PREMADE WORD ASSIGNMENT */}
                  {activeResourceTab === "premade" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Hazır Paket Ata</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Kelime paketindeki tüm kelimeleri sınıftaki öğrencilere atayın.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <select
                          value={selectedPackId}
                          onChange={(e) => setSelectedPackId(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-slate-950 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
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
                          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {assigningVocab ? "Atanıyor..." : "Kelimeleri Sınıfa Gönder 🚀"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CUSTOM WORD ASSIGNMENT */}
                  {activeResourceTab === "custom" && (
                    <form onSubmit={handleAssignCustomVocab} className="space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Özel Kelime Ata</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Bugün işlediğiniz ders kelimelerini sınıftaki öğrencilere ödev olarak atayın.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Arapça Kelime
                          </label>
                          <input
                            type="text"
                            required
                            value={customArabic}
                            onChange={(e) => setCustomArabic(e.target.value)}
                            placeholder="Örn: بَحْث"
                            dir="rtl"
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none text-xs font-sans text-right"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Türkçe Karşılığı
                          </label>
                          <input
                            type="text"
                            required
                            value={customTurkish}
                            onChange={(e) => setCustomTurkish(e.target.value)}
                            placeholder="Örn: Araştırma"
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Kök Kelime (İsteğe bağlı)
                          </label>
                          <input
                            type="text"
                            value={customRoot}
                            onChange={(e) => setCustomRoot(e.target.value)}
                            placeholder="Örn: بحث"
                            dir="rtl"
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none text-xs font-sans text-right"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Örnek Cümle (İsteğe bağlı)
                          </label>
                          <input
                            type="text"
                            value={customExample}
                            onChange={(e) => setCustomExample(e.target.value)}
                            placeholder="Örn: هَذَا بَحْثٌ جَمِيلٌ."
                            dir="rtl"
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none text-xs font-sans text-right"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={assigningCustom || members.length === 0}
                        className="w-full py-2.5 bg-teal-655 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer mt-2"
                      >
                        {assigningCustom ? "Ekleniyor..." : "Özel Kelimeyi Sınıfa Gönder 🚀"}
                      </button>
                    </form>
                  )}

                  {/* TAB 3: FORMATTED LESSON NOTE PUBLISHING */}
                  {activeResourceTab === "note" && (
                    <form onSubmit={handlePublishNote} className="space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Ders Notu Yayınla</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Öğrencileriniz için zengin metin araçlarıyla biçimlendirilmiş ders notları yayınlayın.
                        </p>
                      </div>

                      <div>
                        <input
                          type="text"
                          required
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="Ders Notu Başlığı (Örn: Ders 3: Muttasıl Zamirler)"
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-950 focus:border-teal-500 focus:outline-none text-xs font-bold"
                        />
                      </div>

                      {/* HTML Editor Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <button
                          type="button"
                          onClick={() => formatTeacherText("bold")}
                          className="px-2 py-0.5 text-[10px] bg-white border rounded hover:bg-slate-100 font-bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => formatTeacherText("italic")}
                          className="px-2 py-0.5 text-[10px] bg-white border rounded hover:bg-slate-100 italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => formatTeacherText("underline")}
                          className="px-2 py-0.5 text-[10px] bg-white border rounded hover:bg-slate-100 underline"
                        >
                          U
                        </button>
                        <button
                          type="button"
                          onClick={() => formatTeacherText("formatBlock", "H3")}
                          className="px-2 py-0.5 text-[10px] bg-white border rounded hover:bg-slate-100 font-black"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => formatTeacherText("insertUnorderedList")}
                          className="px-2 py-0.5 text-[10px] bg-white border rounded hover:bg-slate-100"
                        >
                          • Liste
                        </button>
                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        <button
                          type="button"
                          className="px-2 py-0.5 text-[9px] bg-slate-900 text-teal-400 font-mono font-bold rounded hover:bg-slate-950 cursor-pointer"
                          onClickCapture={() => {
                            if (teacherEditorRef.current) {
                              teacherEditorRef.current.style.direction =
                                teacherEditorRef.current.style.direction === "rtl" ? "ltr" : "rtl";
                              teacherEditorRef.current.style.textAlign =
                                teacherEditorRef.current.style.direction === "rtl" ? "right" : "left";
                            }
                          }}
                        >
                          Yönü Değiştir (RTL) 🔄
                        </button>
                      </div>

                      <div>
                        <div
                          ref={teacherEditorRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="min-h-[140px] max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 focus:border-teal-500 focus:outline-none sm:text-xs font-sans leading-relaxed text-slate-900"
                          style={{ direction: "rtl", textAlign: "right" }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={publishingNote || members.length === 0}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow shadow-indigo-900/10"
                      >
                        {publishingNote ? "Yayınlanıyor..." : "Ders Notunu Yayınla 📝"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
