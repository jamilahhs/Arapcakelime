"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function StudentNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Notlar yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchNotes();
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
          .insert({ user_id: user.id, title: title.trim(), content: htmlContent });

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
        setSelectedNote(null);
        setTitle("");
        if (editorRef.current) editorRef.current.innerHTML = "";
        setIsEditing(false);
      }
      await fetchNotes();
    } catch (err) {
      console.error("Not silinirken hata oluştu:", err);
    }
  };

  const startEdit = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setIsEditing(true);
    // Directly set DOM elements html to avoid reactivity cursor jumps
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content;
      }
    }, 50);
  };

  const startNewNote = () => {
    setSelectedNote(null);
    setTitle("");
    setIsEditing(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const execCmd = (cmd: string, val: string = "") => {
    if (typeof document !== "undefined") {
      document.execCommand(cmd, false, val);
    }
  };

  // Client-side HTML to PDF print wrapper
  const exportPDF = (note: Note) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${note.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              padding: 40px;
              direction: rtl;
              text-align: right;
              color: #1e293b;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              color: #0f172a;
              margin: 0;
            }
            .date {
              font-size: 12px;
              color: #64748b;
              margin-top: 5px;
            }
            .content {
              font-size: 16px;
            }
            h3 {
              font-size: 20px;
              color: #0f172a;
              margin-top: 15px;
              margin-bottom: 10px;
            }
            ul {
              margin-right: 20px;
              margin-bottom: 15px;
              padding-right: 10px;
            }
            li {
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${note.title}</h1>
            <div class="date">${new Date(note.created_at).toLocaleDateString("tr-TR")}</div>
          </div>
          <div class="content">${note.content}</div>
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

  // Filter notes dynamically
  const filteredNotes = notes.filter(
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

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-950">Notlarım</h3>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                Gösterilecek not bulunamadı.
              </p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredNotes.map((note) => {
                  const isSelected = selectedNote?.id === note.id;
                  return (
                    <div
                      key={note.id}
                      onClick={() => startEdit(note)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/20 shadow-sm"
                          : "border-slate-100 hover:bg-slate-50/60"
                      }`}
                    >
                      <h4 className="font-bold text-slate-900 truncate">
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {new Date(note.created_at).toLocaleDateString("tr-TR")}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100/50 pt-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportPDF(note);
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:underline"
                        >
                          📄 PDF İndir
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(note.id);
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Editor panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-950">
              {isEditing ? "Notu Düzenle" : "Yeni Not Oluştur"}
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Arapça Editörü (Cairo)
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Başlık
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Mazi Fiil Çekim Tablosu"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-950 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                İçerik
              </label>

              {/* Rich Text Editor Container */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-emerald-500 transition-all shadow-sm">
                {/* Toolbar */}
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1 items-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => execCmd("bold")}
                    className="p-1 hover:bg-slate-200 rounded text-xs font-bold w-8 h-8 flex items-center justify-center border border-slate-100 bg-white shadow-sm cursor-pointer"
                    title="Kalın Yazım (Bold)"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("formatBlock", "h3")}
                    className="p-1 hover:bg-slate-200 rounded text-xs font-black w-8 h-8 flex items-center justify-center border border-slate-100 bg-white shadow-sm cursor-pointer"
                    title="Başlık Ekle (H3)"
                  >
                    H
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("insertUnorderedList")}
                    className="p-1 hover:bg-slate-200 rounded text-xs w-8 h-8 flex items-center justify-center border border-slate-100 bg-white shadow-sm cursor-pointer"
                    title="Madde İşaretli Liste"
                  >
                    •≡
                  </button>
                  <div className="h-5 w-px bg-slate-200 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyLeft")}
                    className="p-1 hover:bg-slate-200 rounded text-xs w-8 h-8 flex items-center justify-center border border-slate-100 bg-white shadow-sm cursor-pointer"
                    title="Sola Hizala (LTR)"
                  >
                    ⬅️
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyRight")}
                    className="p-1 hover:bg-slate-200 rounded text-xs w-8 h-8 flex items-center justify-center border border-slate-100 bg-white shadow-sm cursor-pointer"
                    title="Sağa Hizala (RTL)"
                  >
                    ➡️
                  </button>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[280px] p-4 text-slate-900 focus:outline-none font-sans text-base leading-relaxed bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
                  data-placeholder="Notlarınızı buraya yazın..."
                ></div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/10"
            >
              {saving ? "Kaydediliyor..." : "Notu Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
