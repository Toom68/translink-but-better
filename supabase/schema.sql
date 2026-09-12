-- ─────────────────────────────────────────────────────────
-- TransLink But Better — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Saved stops (the library)
create table if not exists public.saved_stops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stop_id text not null,            -- GTFS stop_id
  custom_label text,                -- optional user rename
  note text,                        -- optional free-text note
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create unique index if not exists saved_stops_user_stop_unique
  on public.saved_stops (user_id, stop_id);
create index if not exists saved_stops_user_order
  on public.saved_stops (user_id, sort_order);

-- User preferences
create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'system',     -- 'light' | 'dark' | 'system'
  default_region text default 'SEQ',
  map_default_lat double precision default -27.4701,
  map_default_lng double precision default 153.0260,
  map_default_zoom real default 11
);

-- ── Row Level Security ──
alter table public.profiles enable row level security;
alter table public.saved_stops enable row level security;
alter table public.preferences enable row level security;

-- Profiles: users can only see/edit their own profile
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Saved stops: users can only see/edit their own saved stops
drop policy if exists "own saved stops" on public.saved_stops;
create policy "own saved stops" on public.saved_stops
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Preferences: users can only see/edit their own preferences
drop policy if exists "own prefs" on public.preferences;
create policy "own prefs" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Auto-create profile + preferences on signup ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
    on conflict (id) do nothing;
  insert into public.preferences (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
