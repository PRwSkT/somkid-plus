-- Somkid+ Diagnostic Funnel & Academic Platform Schema (PostgreSQL / Supabase)

-- 1. Courses (Academic & Activities/Sports)
create table if not exists public.courses (
  id text primary key,
  category text not null check (category in ('academic', 'activity')),
  subject text not null,
  grade_level text not null,
  exam_goal text,
  title text not null,
  subtitle text not null,
  tier_match text check (tier_match in ('foundation', 'accelerator', 'achiever', 'all')),
  schedule_summary text not null,
  seats_total int not null default 12,
  seats_remaining int not null default 4,
  tuition_thb int not null,
  duration_weeks int not null default 12,
  created_at timestamptz not null default now()
);

-- 2. Exam Attempts (Saved after Google OAuth Gate)
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  track_id text not null,
  track_label text not null,
  total_questions int not null,
  correct_count int not null,
  score_percent int not null,
  tier text not null check (tier in ('foundation', 'accelerator', 'achiever')),
  skill_breakdown jsonb not null,
  recommended_course_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 3. Progressive Profiling Leads (Phone + LINE ID + PDPA Consent)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  attempt_id uuid references public.exam_attempts(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  line_id text,
  pdpa_consent boolean not null default false,
  pdpa_consented_at timestamptz,
  recommended_tier text not null,
  webhook_dispatched boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Bookings (Course Enrollment, Trial Class, 1:1 Campus Visit)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  booking_type text not null check (booking_type in ('enrollment', 'trial_class', 'campus_visit')),
  course_id text,
  course_title text,
  student_name text not null,
  grade_level text,
  parent_name text not null,
  email text,
  phone text not null,
  line_id text,
  preferred_date text,
  notes text,
  pdpa_consent boolean not null default true,
  created_at timestamptz not null default now()
);

-- Row Level Security (RLS)
alter table public.courses enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;

-- Public read access for courses
create policy "Courses are publicly readable"
  on public.courses for select using (true);

-- Authenticated users can read/insert their own exam attempts
create policy "Users can view own exam attempts"
  on public.exam_attempts for select using (auth.uid() = user_id);

create policy "Users can insert own exam attempts"
  on public.exam_attempts for insert with check (auth.uid() = user_id);

-- Leads & bookings can be inserted by authenticated users or server service role
create policy "Users can view own leads"
  on public.leads for select using (auth.uid() = user_id);

create policy "Users can insert own leads"
  on public.leads for insert with check (auth.uid() = user_id);

create policy "Anyone can create booking"
  on public.bookings for insert with check (true);
