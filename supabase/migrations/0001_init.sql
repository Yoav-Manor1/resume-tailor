-- Tailorings table
create table public.tailorings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  status            text not null default 'pending' check (status in ('pending','done','failed')),
  error             text,
  job_url           text,
  job_text          text not null,
  resume_pdf_path   text not null,
  resume_text       text,
  job_title         text,
  job_company       text,
  match_score       int check (match_score is null or (match_score between 0 and 100)),
  tailored          jsonb,
  tailored_pdf_path text
);

create index tailorings_user_created_idx
  on public.tailorings (user_id, created_at desc);

-- RLS
alter table public.tailorings enable row level security;

create policy "own rows readable"
  on public.tailorings for select
  using (auth.uid() = user_id);

create policy "own rows insertable"
  on public.tailorings for insert
  with check (auth.uid() = user_id);

create policy "own rows updatable"
  on public.tailorings for update
  using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('tailored', 'tailored', false)
  on conflict (id) do nothing;

-- Storage policies: users can read/write objects under their own user_id/ prefix.
create policy "own resume objects readable"
  on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own resume objects insertable"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own tailored objects readable"
  on storage.objects for select to authenticated
  using (bucket_id = 'tailored' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own tailored objects insertable"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'tailored' and (storage.foldername(name))[1] = auth.uid()::text);
