# Maze Method Supabase Schema Plan

Maze Method remains local-first in Version 2A. This document plans the future cloud schema for optional signed-in sync. Do not run this as a production migration without reviewing column types, sync conflict policy, and storage rules.

## Shared Pattern

Every user-owned table should include:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `local_id text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz`

Local SQLite also tracks `sync_status` (`pending`, `synced`, `failed`) for offline-first sync state. The remote database does not need that column unless you want server-side sync diagnostics.

Recommended indexes:

```sql
create index <table>_user_id_idx on public.<table> (user_id);
create unique index <table>_user_local_id_idx on public.<table> (user_id, local_id);
create index <table>_deleted_at_idx on public.<table> (deleted_at) where deleted_at is not null;
```

## Row Level Security

Enable RLS on every user-owned table:

```sql
alter table public.<table> enable row level security;

create policy "<table> select own rows"
on public.<table> for select
using ((select auth.uid()) = user_id);

create policy "<table> insert own rows"
on public.<table> for insert
with check ((select auth.uid()) = user_id);

create policy "<table> update own rows"
on public.<table> for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "<table> delete own rows"
on public.<table> for delete
using ((select auth.uid()) = user_id);
```

The `(select auth.uid())` pattern keeps the auth function from being evaluated per row. Keep a `user_id` index on every table used by RLS.

## Tables

### profiles

Cloud profile row linked to `auth.users`.

```sql
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  local_id text not null,
  name text not null,
  age integer,
  gender text,
  height numeric,
  weight numeric,
  goal_weight numeric,
  units text not null,
  fitness_goal text not null,
  experience_level text not null,
  training_location text not null,
  days_per_week integer not null,
  dietary_preference text not null,
  activity_level text not null,
  maze_coach_tone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### workout_routines

```sql
create table public.workout_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  name text not null,
  notes text,
  muscle_groups text[] not null default '{}',
  is_active boolean not null default true,
  target_days_per_week integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### exercises

```sql
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  name text not null,
  muscle_group text,
  equipment text,
  default_sets integer,
  default_reps text,
  instructions text,
  custom_notes text,
  resource_links jsonb,
  is_custom boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### workout_logs

```sql
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  routine_id uuid references public.workout_routines(id) on delete set null,
  routine_local_id text,
  routine_name text,
  started_at timestamptz not null,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### routine_exercises

Used by the local routine builder so saved routines can keep their exercise order and set/rep prescriptions.

```sql
create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  routine_local_id text not null,
  exercise_local_id text not null,
  exercise_name text not null,
  muscle_group text not null,
  equipment text,
  order_index integer not null,
  sets integer not null,
  reps text not null,
  weight numeric,
  rest_seconds integer,
  notes text,
  is_personal_record boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### exercise_resource_links

```sql
create table public.exercise_resource_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  exercise_local_id text not null,
  url text not null,
  label text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### workout_log_exercises

```sql
create table public.workout_log_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  workout_log_local_id text not null,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_local_id text,
  exercise_name text not null,
  sets integer,
  reps integer,
  weight numeric,
  rest_seconds integer,
  duration_seconds integer,
  distance numeric,
  muscle_group text,
  order_index integer,
  is_personal_record boolean not null default false,
  is_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### meal_logs

```sql
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  logged_at timestamptz not null,
  meal_name text not null,
  meal_category text not null default 'Snack',
  calories integer,
  protein_grams numeric,
  carb_grams numeric,
  fat_grams numeric,
  barcode text,
  serving_size text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### daily_macro_logs

```sql
create table public.daily_macro_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  date date not null,
  calories integer,
  protein_grams numeric,
  carb_grams numeric,
  fat_grams numeric,
  water_ounces numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### body_weight_entries

```sql
create table public.body_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  date date not null,
  weight numeric not null,
  units text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### body_measurements

```sql
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  date date not null,
  measurement_type text not null,
  value numeric not null,
  units text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### cardio_sessions

```sql
create table public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  date date not null,
  activity_type text not null,
  duration_minutes integer not null,
  distance numeric,
  pace text,
  speed numeric,
  calories_burned integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### progress_photos

Store metadata in Postgres. Store image files later in Supabase Storage under a path like `progress-photos/{user_id}/{id}.jpg`.

```sql
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  date date not null,
  local_uri text,
  storage_path text,
  angle text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### calendar_entries

```sql
create table public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  date date not null,
  entry_type text not null,
  title text not null,
  related_id uuid,
  related_local_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### daily_notes

```sql
create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  date date not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### personal_records

```sql
create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_local_id text,
  exercise_name text not null,
  record_type text not null,
  value numeric not null,
  units text,
  achieved_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

### maze_coach_history

For future backend/OpenAI-powered recommendations. The mobile app should never store OpenAI keys.

```sql
create table public.maze_coach_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  prompt_context jsonb not null default '{}',
  recommendation jsonb not null,
  tone text not null,
  source text not null default 'local_mock',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

## Sync Notes

- Local SQLite remains the source of truth until sync is implemented.
- `local_id` lets the app map existing phone records to future Supabase rows.
- `deleted_at` supports soft deletes so sync can propagate deletions later.
- Sync progress photo bytes only through Supabase Storage policies that restrict each user to their own folder.
- Do not put service role keys, database URLs, or OpenAI keys in the mobile app.
- Maze Coach history can store local mock, local fallback, backend fallback, and backend-generated recommendations. OpenAI calls should happen only in backend code.

## Storage Notes

Create a Supabase Storage bucket named `progress-photos`. Version 2B uploads files under `{user_id}/{local_id}.jpg` and stores that path in `progress_photos.storage_path`. Keep local URIs in SQLite when available so offline viewing remains possible.
