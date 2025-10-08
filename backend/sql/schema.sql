-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  completed boolean default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable RLS and example policies (run these manually in SQL editor)
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "projects_owner_full_access" on public.projects
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "tasks_project_owner_or_creator" on public.tasks
  using (
    (exists (
      select 1 from public.projects p where p.id = public.tasks.project_id and p.owner_id = auth.uid()
    )) OR (created_by = auth.uid())
  ) with check (
    (exists (
      select 1 from public.projects p where p.id = public.tasks.project_id and p.owner_id = auth.uid()
    )) OR (created_by = auth.uid())
  );
