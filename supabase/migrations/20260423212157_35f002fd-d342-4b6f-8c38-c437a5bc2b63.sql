create table public.app_content (
  id uuid primary key default gen_random_uuid(),
  screen_key text not null unique,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.app_content enable row level security;

create policy "Public can read app content"
  on public.app_content for select
  using (true);

create policy "Anyone can insert app content"
  on public.app_content for insert
  with check (true);

create policy "Anyone can update app content"
  on public.app_content for update
  using (true)
  with check (true);

create or replace function public.touch_app_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_content_set_updated_at
before update on public.app_content
for each row execute function public.touch_app_content_updated_at();