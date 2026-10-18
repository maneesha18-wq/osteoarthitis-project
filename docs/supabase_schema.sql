-- ==============================================================================
-- KneeAI Supabase PostgreSQL Schema & Row Level Security (RLS) Policy
-- Explainable Knee Osteoarthritis Grade Classification Decision Support
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (User metadata & institution details)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text,
    institution text,
    role text default 'Researcher',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS Policies: Users can only view and edit their own record
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. ANALYSES TABLE (Evaluated cases, class probabilities & Grad-CAM metadata)
-- ------------------------------------------------------------------------------
create table if not exists public.analyses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    filename text not null,
    file_size_bytes bigint,
    predicted_grade integer not null check (predicted_grade between 0 and 4),
    predicted_grade_label text not null,
    severity_label text not null,
    confidence double precision not null check (confidence between 0.0 and 1.0),
    probabilities jsonb not null,
    model_name text not null,
    model_version text not null,
    inference_time_ms double precision not null,
    clahe_applied boolean default true,
    has_gradcam boolean default true,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for efficient search & filtering
create index if not exists idx_analyses_user_id on public.analyses(user_id);
create index if not exists idx_analyses_created_at on public.analyses(created_at desc);
create index if not exists idx_analyses_predicted_grade on public.analyses(predicted_grade);

-- Enable RLS on analyses
alter table public.analyses enable row level security;

-- Analyses RLS Policies: Enforce strict user-data isolation at the database layer
create policy "Users can view only their own analyses"
    on public.analyses for select
    using (auth.uid() = user_id);

create policy "Users can insert their own analyses"
    on public.analyses for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own analyses"
    on public.analyses for update
    using (auth.uid() = user_id);

create policy "Users can delete their own analyses"
    on public.analyses for delete
    using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. Automatic Profile Trigger on Auth Signup
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
