-- =====================================================================
--  مكتبة أريام — لوحة التقارير  |  Supabase schema
--  نفّذ هذا الملف كاملاً مرة واحدة في:  Supabase → SQL Editor → New query
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- المؤسسات / المتاجر ----------
create table if not exists public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  phone        text,
  invite_code  text not null unique,
  language     text not null default 'en' check (language in ('en','ar','fr')),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- للمشاريع المُنشأة سابقاً
alter table public.organizations add column if not exists language text not null default 'en';

-- ---------- الأعضاء (أدمن / مسيّر) ----------
create table if not exists public.memberships (
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin','manager')),
  full_name  text,
  email      text,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- ---------- المداخيل اليومية ----------
create table if not exists public.daily_entries (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  entry_date        date not null,
  card_amount       numeric(12,2) not null default 0,
  cash_amount       numeric(12,2) not null default 0,
  other_income      numeric(12,2) not null default 0,
  other_income_note text,
  notes             text,
  report_paths      text[] not null default '{}',   -- صور التقرير اليومي (Day Close…)
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, entry_date)
);

-- ---------- المصاريف ----------
create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  expense_date  date not null,
  description   text not null,
  category      text not null default 'أخرى',
  amount        numeric(12,2) not null check (amount >= 0),
  receipt_paths text[] not null default '{}',       -- صور / ملفات الوصل
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists expenses_org_date on public.expenses(org_id, expense_date);

-- ---------- ملفات التقارير الشهرية المرفوعة ----------
create table if not exists public.monthly_files (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  month      text not null,                         -- 'YYYY-MM'
  title      text,
  path       text not null,
  created_at timestamptz not null default now()
);

-- ---------- تعديلات نص التقرير (موجّه إلى، ملاحظة، خلاصة…) ----------
create table if not exists public.report_notes (
  org_id     uuid not null references public.organizations(id) on delete cascade,
  period     text not null,                         -- 'YYYY-MM' أو 'YYYY-MM-DD'
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (org_id, period)
);

-- ---------- التنبيهات: مستلزمات / اقتراحات / انشغالات ----------
create table if not exists public.notices (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  kind       text not null check (kind in ('supply','suggestion','concern')),
  title      text not null,
  details    text,
  quantity   text,
  author     text,
  priority   text not null default 'normal' check (priority in ('low','normal','high')),
  status     text not null default 'open'   check (status in ('open','progress','done')),
  created_at timestamptz not null default now()
);

-- ---------- الموردون ----------
create table if not exists public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  company    text,
  phone      text not null,
  category   text,
  notes      text,
  created_at timestamptz not null default now()
);

-- =====================================================================
--  دوال مساعدة
-- =====================================================================
create or replace function public.is_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from memberships where org_id = o and user_id = auth.uid());
$$;

create or replace function public.is_admin(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from memberships where org_id = o and user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.gen_invite_code() returns text
language sql volatile set search_path = '' as $$
  select upper(substr(translate(encode(extensions.gen_random_bytes(12),'base64'),'+/=0O1Il',''),1,8));
$$;

-- الأدمن ينشئ متجره ويحصل على كود دعوة
create or replace function public.create_organization(p_name text, p_full_name text default null)
returns public.organizations
language plpgsql security definer set search_path = public as $$
declare o organizations;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into organizations(name, invite_code, created_by)
    values (p_name, gen_invite_code(), auth.uid()) returning * into o;
  insert into memberships(org_id, user_id, role, full_name, email)
    values (o.id, auth.uid(), 'admin', p_full_name, (select email from auth.users where id = auth.uid()));
  return o;
end $$;

-- المسيّر ينضم بكود الدعوة السري
create or replace function public.join_with_code(p_code text, p_full_name text default null)
returns public.organizations
language plpgsql security definer set search_path = public as $$
declare o organizations;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into o from organizations where invite_code = upper(trim(p_code));
  if o.id is null then raise exception 'INVALID_CODE'; end if;
  insert into memberships(org_id, user_id, role, full_name, email)
    values (o.id, auth.uid(), 'manager', p_full_name, (select email from auth.users where id = auth.uid()))
    on conflict (org_id, user_id) do nothing;
  return o;
end $$;

-- الأدمن يجدّد كود الدعوة (الكود القديم يتوقف فوراً)
create or replace function public.regenerate_invite_code(p_org uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not is_admin(p_org) then raise exception 'forbidden'; end if;
  c := gen_invite_code();
  update organizations set invite_code = c where id = p_org;
  return c;
end $$;

-- =====================================================================
--  Row Level Security
-- =====================================================================
alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.daily_entries enable row level security;
alter table public.expenses      enable row level security;
alter table public.monthly_files enable row level security;
alter table public.report_notes  enable row level security;
alter table public.notices       enable row level security;
alter table public.suppliers     enable row level security;

-- المؤسسات: الأعضاء يقرؤون، الأدمن يعدّل
drop policy if exists org_read on public.organizations;
create policy org_read on public.organizations for select using (is_member(id));
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update using (is_admin(id));

-- العضويات: كل عضو يرى أعضاء متجره، الأدمن يحذف
drop policy if exists mem_read on public.memberships;
create policy mem_read on public.memberships for select using (is_member(org_id));
drop policy if exists mem_delete on public.memberships;
create policy mem_delete on public.memberships for delete using (is_admin(org_id) and user_id <> auth.uid());

-- باقي الجداول: قراءة للأعضاء، كتابة للأدمن فقط
do $$
declare t text;
begin
  foreach t in array array['daily_entries','expenses','monthly_files','report_notes','notices','suppliers'] loop
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format('create policy %1$s_read on public.%1$s for select using (is_member(org_id))', t);
    execute format('drop policy if exists %1$s_write on public.%1$s', t);
    execute format('create policy %1$s_write on public.%1$s for all using (is_admin(org_id)) with check (is_admin(org_id))', t);
  end loop;
end $$;

-- =====================================================================
--  التخزين (الوصولات والصور) — حاوية خاصة "files"
--  المسار:  <org_id>/<نوع>/<اسم الملف>
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict (id) do nothing;

drop policy if exists files_read on storage.objects;
create policy files_read on storage.objects for select
  using (bucket_id = 'files' and public.is_member(((storage.foldername(name))[1])::uuid));

drop policy if exists files_insert on storage.objects;
create policy files_insert on storage.objects for insert
  with check (bucket_id = 'files' and public.is_admin(((storage.foldername(name))[1])::uuid));

drop policy if exists files_update on storage.objects;
create policy files_update on storage.objects for update
  using (bucket_id = 'files' and public.is_admin(((storage.foldername(name))[1])::uuid));

drop policy if exists files_delete on storage.objects;
create policy files_delete on storage.objects for delete
  using (bucket_id = 'files' and public.is_admin(((storage.foldername(name))[1])::uuid));

-- =====================================================================
--  تقييد استدعاء الدوال: للمستخدمين المسجّلين فقط
-- =====================================================================
revoke execute on function public.create_organization(text, text) from public, anon;
revoke execute on function public.join_with_code(text, text) from public, anon;
revoke execute on function public.regenerate_invite_code(uuid) from public, anon;
revoke execute on function public.gen_invite_code() from public, anon, authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.join_with_code(text, text) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
