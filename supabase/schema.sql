-- ==========================================
-- ARAPÇA KELİME LMS DATABASE SCHEMA
-- ==========================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    streak_count INTEGER DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Class Members Table
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (class_id, student_id)
);

-- 4. Vocabulary Table (Spaced Repetition / Leitner)
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    arabic_word TEXT NOT NULL,
    turkish_meaning TEXT NOT NULL,
    root_word TEXT,
    box_level INTEGER DEFAULT 1 CHECK (box_level BETWEEN 1 AND 5),
    next_review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    submission_text TEXT,
    file_url TEXT,
    file_purged BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
    grade INTEGER CHECK (grade BETWEEN 0 AND 100),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);

-- 8. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question_arabic TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Quiz Results Table
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (quiz_id, student_id)
);

-- ==========================================
-- STORAGE PURGING FUNCTION & TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.purge_homework_file()
RETURNS TRIGGER AS $$
BEGIN
    -- When homework submission changes from pending to graded, purge file references to save space
    IF NEW.status = 'graded' AND OLD.status = 'pending' THEN
        NEW.file_url := NULL;
        NEW.file_purged := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_purge_homework_file ON public.assignment_submissions;
CREATE TRIGGER trigger_purge_homework_file
    BEFORE UPDATE ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.purge_homework_file();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Classes Policies
CREATE POLICY "Allow all authenticated users to read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow teachers to insert classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Allow teachers to update their own classes" ON public.classes FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Allow teachers to delete their own classes" ON public.classes FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- 3. Class Members Policies
CREATE POLICY "Allow enrolled class members check" ON public.class_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow students to enroll themselves" ON public.class_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Allow students to unenroll" ON public.class_members FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- 4. Vocabulary Policies
CREATE POLICY "Allow users to manage their own vocabulary" ON public.vocabulary FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Notes Policies
CREATE POLICY "Allow users to manage their own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Assignments Policies
CREATE POLICY "Allow read assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow teachers to manage assignments" ON public.assignments FOR ALL TO authenticated USING (true);

-- 7. Assignment Submissions Policies
CREATE POLICY "Allow student submission management" ON public.assignment_submissions FOR ALL TO authenticated USING (true);

-- 8. Quizzes Policies
CREATE POLICY "Allow read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow teachers to manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (true);

-- 9. Quiz Questions Policies
CREATE POLICY "Allow read questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow teachers to manage questions" ON public.quiz_questions FOR ALL TO authenticated USING (true);

-- 10. Quiz Results Policies
CREATE POLICY "Allow student and teacher results view" ON public.quiz_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow students to post quiz scores" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
