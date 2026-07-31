"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  class_id?: string | null;
  classes?: {
    name: string;
  } | null;
}

export default function StudentNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Shared Lesson Notes State
  const [activeTab, setActiveTab] = useState<"personal" | "teacher">("personal");
  const [teacherNotes, setTeacherNotes] = useState<Note[]>([]);

  const editorRef = useRef<HTMLDivElement>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .is("class_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Notlar yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherNotes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch class memberships for student
      const { data: memberData, error: memberErr } = await supabase
        .from("class_members")
        .select("class_id");

      if (memberErr) throw memberErr;
      const classIds = (memberData || []).map((m: { class_id: string }) => m.class_id);

      if (classIds.length === 0) {
        setTeacherNotes([]);
        return;
      }

      // 2. Fetch notes published to these classes
      const { data: noteData, error: noteErr } = await supabase
        .from("notes")
        .select("*, classes(name)")
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      if (noteErr) throw noteErr;
      setTeacherNotes(noteData || []);
    } catch (err) {
      console.error("Öğretmen notları yüklenemedi:", err);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchNotes();
      fetchTeacherNotes();
    }, 0);
  }, []);

  const handleSave = async () => {
    const htmlContent = editorRef.current?.innerHTML || "";
    if (!title.trim() || !htmlContent.trim()) {
      alert("Lütfen başlık ve içerik alanlarını doldurun.");
      return;
    }

    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (isEditing && selectedNote) {
        const { error } = await supabase
          .from("notes")
          .update({ title: title.trim(), content: htmlContent })
          .eq("id", selectedNote.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notes")
          .insert({ user_id: user.id, title: title.trim(), content: htmlContent, class_id: null });

        if (error) throw error;
      }

      setTitle("");
      if (editorRef.current) editorRef.current.innerHTML = "";
      setIsEditing(false);
      setSelectedNote(null);
      await fetchNotes();
    } catch (err) {
      console.error("Not kaydedilirken hata oluştu:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu notu silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;

      if (selectedNote?.id === id) {
        setTitle("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        setIsEditing(false);
        setSelectedNote(null);
      }
      await fetchNotes();
    } catch (err) {
      console.error("Not silinirken hata oluştu:", err);
    }
  };

  const handleCopyNote = async (sharedNote: Note) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: `[Öğretmenden] ${sharedNote.title}`,
        content: sharedNote.content,
        class_id: null,
      });

      if (error) throw error;
      alert("Ders notu başarıyla defterinize kopyalandı!");
      setActiveTab("personal");
      await fetchNotes();
    } catch (err) {
      console.error("Not kopyalama hatası:", err);
    }
  };

  const startNewNote = () => {
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setIsEditing(false);
    setSelectedNote(null);
    setActiveTab("personal");
  };

  const startEdit = (note: Note) => {
    setTitle(note.title);
    setIsEditing(true);
    setSelectedNote(note);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content;
    }
  };

  // Toolbar Rich Text Formatter
  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const printPdf = () => {
    const htmlContent = editorRef.current?.innerHTML || "";
    if (!title.trim() || !htmlContent.trim()) {
      alert("Yazdırılacak içerik bulunamadı.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup engelleyiciyi kaldırın.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Cairo', sans-serif; color: #0f172a; line-height: 1.6; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .date { font-size: 11px; color: #64748b; margin-top: 5px; }
            .content { font-size: 14px; text-align: right; direction: rtl; }
            .content p, .content h3, .content li { text-align: right; direction: rtl; }
            ul, ol { padding-right: 20px; padding-left: 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${title}</div>
            <div class="date">Oluşturulma Tarihi: ${new Date().toLocaleDateString("tr-TR")}</div>
          </div>
          <div class="content">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeacherNotes = teacherNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ders Notlarım
          </h1>
          <p className="text-slate-500 mt-1">
            Arapça notlarınızı alın, zengin araçlarla biçimlendirin ve PDF formatında indirin.
          </p>
        </div>
        <button
          onClick={startNewNote}
          className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
        >
          ➕ Yeni Not
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: List and Search */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Notlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
            />
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            {/* Tab Swapper */}
            <div className="flex bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "personal"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Kişisel Notlarım
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("teacher")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "teacher"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Öğretmenin Notları 📚
              </button>
            </div>

            {/* Render Personal Notes */}
            {activeTab === "personal" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-950 px-1">Defterim</h3>
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-8">
                    Not bulunamadı.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredNotes.map((note) => {
                      const isSelected = selectedNote?.id === note.id;
                      return (
                        <div
                          key={note.id}
                          onClick={() => startEdit(note)}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/20 shadow-sm"
                              : "border-slate-100 hover:bg-slate-50/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-sm truncate flex-1">
                              {note.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(note.id);
                              }}
                              className="text-slate-300 hover:text-rose-600 text-xs transition-colors p-0.5"
                            >
                              🗑️
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(note.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Render Shared Teacher Notes */}
            {activeTab === "teacher" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-950 px-1">Paylaşılan Notlar</h3>
                {filteredTeacherNotes.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-8">
                    Sınıfınızda yayınlanmış ders notu bulunmamaktadır.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredTeacherNotes.map((note) => {
                      const isSelected = selectedNote?.id === note.id;
                      return (
                        <div
                          key={note.id}
                          onClick={() => startEdit(note)}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/15 shadow-sm"
                              : "border-slate-100 hover:bg-slate-50/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                                {note.classes?.name || "Ders Notu"}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm truncate mt-1">
                                {note.title}
                              </h4>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyNote(note);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-100 transition-all shadow-sm"
                              title="Kendi not defterine kopyala"
                            >
                              Kopyala 📥
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Form and Rich Editor */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          {/* Note Warning for Shared class notes preview */}
          {selectedNote?.class_id && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
              <span>
                💡 <strong>Sınıf Notu:</strong> Bu ders notu öğretmeniniz tarafından paylaşılmıştır. Üzerinde değişiklik yapmak için sol paneldeki <strong>&ldquo;Kopyala 📥&rdquo;</strong> butonunu kullanarak kendi defterinize ekleyebilirsiniz.
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Not Başlığı
              </label>
              <input
                type="text"
                placeholder="Örn: Ders 1: Harf-i Cerler"
                value={title}
                readOnly={!!selectedNote?.class_id}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm font-bold transition-all disabled:opacity-50"
              />
            </div>

            {/* Rich Editor Actions Toolbar */}
            {!selectedNote?.class_id && (
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => formatText("bold")}
                  className="px-2.5 py-1 text-xs bg-white border rounded hover:bg-slate-100 font-bold transition-all"
                  title="Kalın"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => formatText("italic")}
                  className="px-2.5 py-1 text-xs bg-white border rounded hover:bg-slate-100 italic transition-all"
                  title="İtalik"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => formatText("underline")}
                  className="px-2.5 py-1 text-xs bg-white border rounded hover:bg-slate-100 underline transition-all"
                  title="Altı Çizili"
                >
                  U
                </button>
                <div className="h-5 w-px bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => formatText("formatBlock", "H3")}
                  className="px-2.5 py-1 text-xs bg-white border rounded hover:bg-slate-100 font-black transition-all"
                  title="Başlık 3"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => formatText("insertUnorderedList")}
                  className="px-2.5 py-1 text-xs bg-white border rounded hover:bg-slate-100 transition-all"
                  title="Madde İşaretli Liste"
                >
                  • Liste
                </button>
                <div className="h-5 w-px bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => formatText("contentReadOnly", "false")} // Dummy align RTL helper
                  className="px-2 py-1 text-[10px] bg-slate-900 text-teal-400 font-mono font-bold rounded hover:bg-slate-950 transition-all cursor-pointer"
                  onClickCapture={() => {
                    // Set editor direction to RTL for Arabic
                    if (editorRef.current) {
                      editorRef.current.style.direction =
                        editorRef.current.style.direction === "rtl" ? "ltr" : "rtl";
                      editorRef.current.style.textAlign =
                        editorRef.current.style.direction === "rtl" ? "right" : "left";
                    }
                  }}
                  title="Yönü Değiştir (Sağ-Sol / RTL-LTR)"
                >
                  AR/TR Yönü 🔄
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                İçerik
              </label>
              {/* Editable content editor wrapper */}
              <div
                ref={editorRef}
                contentEditable={!selectedNote?.class_id}
                suppressContentEditableWarning
                className="min-h-[260px] max-h-[480px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm font-sans leading-relaxed text-slate-900"
                style={{ direction: "rtl", textAlign: "right" }}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={printPdf}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              PDF Olarak Yazdır 🖨️
            </button>

            {!selectedNote?.class_id && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {saving ? "Kaydediliyor..." : isEditing ? "Notu Güncelle" : "Notu Kaydet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
