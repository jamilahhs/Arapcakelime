/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isMockMode =
  !supabaseUrl ||
  supabaseUrl.includes("your-project") ||
  supabaseUrl.includes("placeholder");

// ----------------------------------------------------
// MOCK SUPABASE CLIENT (LOCAL STORAGE BACKEND)
// ----------------------------------------------------
const mockSupabase = {
  auth: {
    getUser: async () => {
      if (typeof window === "undefined") {
        return { data: { user: null }, error: null };
      }
      const session = localStorage.getItem("mock_session");
      if (session) {
        const u = JSON.parse(session);
        return { data: { user: { id: u.id, email: u.email } }, error: null };
      }
      return { data: { user: null }, error: null };
    },
    signUp: async ({ email, password, options }: any) => {
      if (typeof window === "undefined") return { data: { user: null }, error: null };

      const id = "mock-user-" + Math.random().toString(36).substr(2, 9);
      const fullName = options?.data?.full_name || "Demo Kullanıcı";
      const role = options?.data?.role || "student";

      const user = { id, email, full_name: fullName, role };
      localStorage.setItem("mock_session", JSON.stringify(user));

      // Save to profiles
      const profiles = JSON.parse(localStorage.getItem("mock_db_profiles") || "[]");
      const newProfile = {
        id,
        full_name: fullName,
        role,
        streak_count: 3,
        last_active_date: new Date().toISOString().split("T")[0],
      };
      profiles.push(newProfile);
      localStorage.setItem("mock_db_profiles", JSON.stringify(profiles));

      // Set cookie for Next.js Middleware/Proxy route verification
      document.cookie = `mock_role=${role}; path=/`;
      document.cookie = `mock_user_id=${id}; path=/`;

      return { data: { user: { id, email } }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      if (typeof window === "undefined") return { data: { user: null }, error: null };

      const profiles = JSON.parse(localStorage.getItem("mock_db_profiles") || "[]");
      let p = profiles.find((x: any) => x.full_name.toLowerCase().includes(email.split("@")[0].toLowerCase()));

      if (!p) {
        // Create auto profile for demo convenience
        const role = email.includes("teacher") ? "teacher" : "student";
        const id = "mock-user-" + Math.random().toString(36).substr(2, 9);
        p = {
          id,
          full_name: email.split("@")[0].toUpperCase(),
          role,
          streak_count: 5,
          last_active_date: new Date().toISOString().split("T")[0],
        };
        profiles.push(p);
        localStorage.setItem("mock_db_profiles", JSON.stringify(profiles));
      }

      const user = { id: p.id, email, full_name: p.full_name, role: p.role };
      localStorage.setItem("mock_session", JSON.stringify(user));

      document.cookie = `mock_role=${p.role}; path=/`;
      document.cookie = `mock_user_id=${p.id}; path=/`;

      return { data: { user: { id: p.id, email } }, error: null };
    },
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mock_session");
        document.cookie = "mock_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        document.cookie = "mock_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }
      return { error: null };
    },
  },
  from: (table: string) => {
    const getItems = () => {
      if (typeof window === "undefined") return [];
      let data = localStorage.getItem(`mock_db_${table}`);
      let list = data ? JSON.parse(data) : [];

      // Seed initial dummy data to avoid blank pages in Mock Mode
      if (list.length === 0) {
        if (table === "profiles") {
          list = [
            { id: "mock-student-id", full_name: "Yusuf Demir", role: "student", streak_count: 5, last_active_date: new Date().toISOString().split("T")[0] }
          ];
          localStorage.setItem("mock_db_profiles", JSON.stringify(list));
        }
        if (table === "class_members") {
          list = [
            { id: "cm1", class_id: "c1", student_id: "mock-student-id" },
            { id: "cm2", class_id: "c2", student_id: "mock-student-id" }
          ];
          localStorage.setItem("mock_db_class_members", JSON.stringify(list));
        }
        if (table === "classes") {
          const session = typeof window !== "undefined" ? localStorage.getItem("mock_session") : null;
          const uId = session ? JSON.parse(session).id : "mock-teacher";
          list = [
            { id: "c1", name: "Gramatik Arapça - A1", code: "ARP-101", teacher_id: uId },
            { id: "c2", name: "İleri Seviye Belagat", code: "ARP-9821", teacher_id: uId },
          ];
          localStorage.setItem("mock_db_classes", JSON.stringify(list));
        }
        if (table === "quizzes") {
          list = [
            { id: "q1", class_id: "c1", title: "A1 Seviyesi Mazi Fiil Değerlendirmesi", duration_minutes: 15 },
          ];
          localStorage.setItem("mock_db_quizzes", JSON.stringify(list));
        }
        if (table === "quiz_questions") {
          list = [
            {
              id: "qq1",
              quiz_id: "q1",
              question_arabic: "كَتَبَ fiilinin çoğul (cemi) çekimi hangisidir?",
              option_a: "كَتَبَا",
              option_b: "كَتَبُوا",
              option_c: "كَتَبَتْ",
              option_d: "كَتَبْنَ",
              correct_option: "B",
            },
            {
              id: "qq2",
              quiz_id: "q1",
              question_arabic: "أين fiili ne anlama gelir?",
              option_a: "Nasıl?",
              option_b: "Ne zaman?",
              option_c: "Nerede?",
              option_d: "Kim?",
              correct_option: "C",
            },
          ];
          localStorage.setItem("mock_db_quiz_questions", JSON.stringify(list));
        }
        if (table === "assignments") {
          list = [
            {
              id: "a1",
              class_id: "c1",
              title: "Ödev 1: Zamir Çekimleri",
              description: "Muttasıl zamirleri çekip cümle içinde kullanınız.",
              due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
            },
          ];
          localStorage.setItem("mock_db_assignments", JSON.stringify(list));
        }
        if (table === "vocabulary") {
          const session = typeof window !== "undefined" ? localStorage.getItem("mock_session") : null;
          const uId = session ? JSON.parse(session).id : "mock-student";
          list = [
            {
              id: "v1",
              user_id: uId,
              arabic_word: "كِتَاب",
              turkish_meaning: "Kitap",
              root_word: "كتب",
              example_sentence: "هَذَا كِتَابٌ مُفِيدٌ",
              box_level: 1,
              next_review_date: new Date().toISOString().split("T")[0],
            },
            {
              id: "v2",
              user_id: uId,
              arabic_word: "قَلَم",
              turkish_meaning: "Kalem",
              root_word: "قلم",
              example_sentence: "كَتَبْتُ الرِّسَالَةَ بِالْقَلَمِ",
              box_level: 2,
              next_review_date: new Date().toISOString().split("T")[0],
            },
          ];
          localStorage.setItem("mock_db_vocabulary", JSON.stringify(list));
        }
      }

      // Emulate Database Joins
      if (table === "class_members") {
        const classes = JSON.parse(localStorage.getItem("mock_db_classes") || "[]");
        const profiles = JSON.parse(localStorage.getItem("mock_db_profiles") || "[]");
        list = list.map((item: any) => ({
          ...item,
          classes: classes.find((c: any) => c.id === item.class_id) || null,
          profiles: profiles.find((p: any) => p.id === item.student_id) || null,
        }));
      }

      return list;
    };

    const setItems = (items: any[]) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(`mock_db_${table}`, JSON.stringify(items));
      }
    };

    let items = getItems();
    let singleMode = false;

    const builder = {
      select: (fields: string = "*") => {
        return builder;
      },
      eq: (field: string, val: any) => {
        items = items.filter((x: any) => x[field] === val);
        return builder;
      },
      neq: (field: string, val: any) => {
        items = items.filter((x: any) => x[field] !== val);
        return builder;
      },
      in: (field: string, vals: any[]) => {
        items = items.filter((x: any) => vals.includes(x[field]));
        return builder;
      },
      is: (field: string, val: any) => {
        items = items.filter((x: any) => x[field] === val);
        return builder;
      },
      order: (field: string, options?: any) => {
        items.sort((a: any, b: any) => {
          if (options?.ascending) {
            return a[field] > b[field] ? 1 : -1;
          }
          return a[field] < b[field] ? 1 : -1;
        });
        return builder;
      },
      single: () => {
        singleMode = true;
        return builder;
      },
      insert: async (obj: any) => {
        const list = getItems();
        const newItems = Array.isArray(obj) ? obj : [obj];
        const added = newItems.map((x: any) => {
          const item = {
            id: "mock-id-" + Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            ...x,
          };
          list.push(item);
          return item;
        });
        setItems(list);
        return { data: Array.isArray(obj) ? added : added[0], error: null };
      },
      upsert: async (obj: any) => {
        const list = getItems();
        const newItems = Array.isArray(obj) ? obj : [obj];
        newItems.forEach((item: any) => {
          const idx = list.findIndex((x: any) => x.id === item.id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...item };
          } else {
            list.push({
              id: item.id || "mock-id-" + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              ...item,
            });
          }
        });
        setItems(list);
        return { data: obj, error: null };
      },
      update: async (obj: any) => {
        const list = getItems();
        items.forEach((item: any) => {
          const idx = list.findIndex((x: any) => x.id === item.id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...obj };
            // Purge trigger emulation
            if (table === "assignment_submissions" && obj.status === "graded") {
              list[idx].file_url = null;
              list[idx].file_purged = true;
            }
          }
        });
        setItems(list);
        return { data: items, error: null };
      },
      delete: async () => {
        const list = getItems();
        const idsToRemove = items.map((x: any) => x.id);
        const filtered = list.filter((x: any) => !idsToRemove.includes(x.id));
        setItems(filtered);
        return { data: items, error: null };
      },
      // Promise resolver compatibility
      then: (resolve: any) => {
        const result = singleMode ? items[0] || null : items;
        resolve({ data: result, error: null, count: items.length });
      },
    };

    return builder;
  },
};

export const supabase: SupabaseClient = (isMockMode
  ? (mockSupabase as any)
  : createClient(supabaseUrl, supabaseAnonKey)) as SupabaseClient;
