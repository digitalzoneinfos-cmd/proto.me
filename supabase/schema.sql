-- =====================================================================
--  PROTO.ME — base de données Supabase
--  À coller dans Supabase > SQL Editor > New query, puis « Run ».
--  Le script peut être relancé sans risque (il ne recrée que ce qui manque).
--
--  Sécurité :
--   • Row Level Security (RLS) activée sur TOUTES les tables.
--   • Le public ne peut que LIRE le contenu publié, et ENVOYER des
--     réservations / briefs (sans pouvoir les relire).
--   • Seuls les e-mails listés dans public.admins peuvent modifier,
--     et si la double authentification (2FA) est activée sur le compte,
--     elle devient obligatoire pour toute modification.
--   • Aucun mot de passe n'est stocké ici : le compte admin se crée dans
--     Supabase > Authentication > Users.
-- =====================================================================

-- ---------- Administrateurs ----------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
insert into public.admins (email) values ('protomecontact@gmail.com')
  on conflict do nothing;

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Vrai seulement pour un admin connecté (et en 2FA si elle est activée).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.admins a
      where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    and (
      coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      )
    );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Horodatage automatique des modifications
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------- Services ----------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 600),
  chips text[] not null default '{}',
  specs jsonb not null default '[]'::jsonb,
  image_url text not null default '',
  is_object boolean not null default false,
  bg text not null default '#161616' check (bg ~ '^#[0-9a-fA-F]{6}$'),
  fg text not null default '#faf7f6' check (fg ~ '^#[0-9a-fA-F]{6}$'),
  accent text not null default '#ddf160' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  needs text[] not null default '{}',
  cta_consult boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Galerie ----------
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  title text not null default '' check (char_length(title) <= 80),
  caption text not null default '' check (char_length(caption) <= 120),
  label text not null default '' check (char_length(label) <= 30),
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  style text not null default 'photo' check (style in ('photo','obj-lav','obj-lime','obj-ink')),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Consultants ----------
create table if not exists public.consultants (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  name text not null default '' check (char_length(name) <= 80),
  role text not null check (char_length(role) between 1 and 80),
  domain text not null default '' check (char_length(domain) <= 40),
  tags text[] not null default '{}',
  bio text not null default '' check (char_length(bio) <= 600),
  photo_url text not null default '',
  revealed boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Formations ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 140),
  level text not null default 'Tous niveaux' check (char_length(level) <= 40),
  description text not null default '' check (char_length(description) <= 800),
  cover_url text not null default '',
  status text not null default 'draft' check (status in ('draft','soon','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Formateur (ajouté en v2, sans effet si déjà présent)
alter table public.courses add column if not exists instructor_name text not null default '';
alter table public.courses add column if not exists instructor_photo_url text not null default '';
-- Catégorie (ajoutée en v3) : ai, marketing, business, design, prog, proto, legal, other
alter table public.courses add column if not exists category text not null default 'other' check (char_length(category) <= 40);
do $$ begin
  alter table public.courses add constraint courses_instructor_name_len check (char_length(instructor_name) <= 80);
exception when duplicate_object then null; end $$;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 140),
  video_url text not null default '',
  duration_sec int not null default 0 check (duration_sec >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lessons_course_idx on public.lessons(course_id, position);

-- ---------- Documents à télécharger (PDF, Word, Excel…) ----------
create table if not exists public.course_files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 140),
  file_url text not null,
  file_name text not null default '' check (char_length(file_name) <= 200),
  mime text not null default '' check (char_length(mime) <= 120),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists course_files_course_idx on public.course_files(course_id, position);

-- ---------- Événements ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 800),
  location text not null default '' check (char_length(location) <= 120),
  starts_at timestamptz,
  date_revealed boolean not null default false,
  image_url text not null default '',
  status text not null default 'soon' check (status in ('draft','soon','published','past')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Articles ----------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  excerpt text not null default '' check (char_length(excerpt) <= 300),
  body text not null default '' check (char_length(body) <= 40000),
  cover_url text not null default '',
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Réservations (consultations) ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expert text not null default '' check (char_length(expert) <= 80),
  subject text not null default '' check (char_length(subject) <= 160),
  mode text not null default '' check (char_length(mode) <= 40),
  wanted_date date,
  slot text not null default '' check (char_length(slot) <= 20),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 30),
  question text not null default '' check (char_length(question) <= 600),
  status text not null default 'nouveau' check (status in ('nouveau','confirme','termine','annule')),
  admin_note text not null default '' check (char_length(admin_note) <= 1000)
);

-- ---------- Briefs (demandes de projet) ----------
create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  profile text not null default '' check (char_length(profile) <= 40),
  needs text[] not null default '{}' check (cardinality(needs) <= 20),
  stage text not null default '' check (char_length(stage) <= 60),
  details jsonb not null default '{}'::jsonb check (pg_column_size(details) <= 4000),
  budget text not null default '' check (char_length(budget) <= 60),
  delay text not null default '' check (char_length(delay) <= 60),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 30),
  city text not null default '' check (char_length(city) <= 80),
  lang text not null default '' check (char_length(lang) <= 20),
  idea text not null default '' check (char_length(idea) <= 600),
  status text not null default 'nouveau' check (status in ('nouveau','en_cours','gagne','perdu')),
  admin_note text not null default '' check (char_length(admin_note) <= 1000)
);

-- Triggers updated_at
do $$
declare t text;
begin
  foreach t in array array['services','gallery','consultants','courses','lessons','course_files','events','articles'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------- RLS ----------
alter table public.services    enable row level security;
alter table public.gallery     enable row level security;
alter table public.consultants enable row level security;
alter table public.courses     enable row level security;
alter table public.lessons     enable row level security;
alter table public.course_files enable row level security;
alter table public.events      enable row level security;
alter table public.articles    enable row level security;
alter table public.bookings    enable row level security;
alter table public.briefs      enable row level security;

-- Nettoyage des anciennes règles (pour pouvoir relancer le script)
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public'
             and tablename in ('services','gallery','consultants','courses','lessons','course_files','events','articles','bookings','briefs')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Lecture publique du contenu publié
create policy "public read services" on public.services for select to anon, authenticated using (published);
create policy "public read gallery"  on public.gallery  for select to anon, authenticated using (published);
create policy "public read courses"  on public.courses  for select to anon, authenticated using (status in ('soon','published'));
create policy "public read lessons"  on public.lessons  for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));
create policy "public read course files" on public.course_files for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));
create policy "public read articles" on public.articles for select to anon, authenticated using (status = 'published');
-- consultants et événements : lus via les vues publiques ci-dessous (noms et dates masqués)

-- Le public peut ENVOYER une réservation ou un brief, sans pouvoir les relire
create policy "public send booking" on public.bookings for insert to anon, authenticated
  with check (status = 'nouveau' and admin_note = '');
create policy "public send brief" on public.briefs for insert to anon, authenticated
  with check (status = 'nouveau' and admin_note = '');

-- L'admin peut tout faire
create policy "admin all services"    on public.services    for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all gallery"     on public.gallery     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all consultants" on public.consultants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all courses"     on public.courses     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all lessons"     on public.lessons     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all course files" on public.course_files for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all events"      on public.events      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all articles"    on public.articles    for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all bookings"    on public.bookings    for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all briefs"      on public.briefs      for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Vues publiques : le nom et la photo d'un consultant ne sortent de la base
-- que lorsqu'il est « dévoilé » ; la date d'un événement seulement si elle est annoncée.
create or replace view public.consultants_public as
  select id, position, role, domain, tags, bio, revealed,
         case when revealed then name else null end as name,
         case when revealed then photo_url else null end as photo_url,
         char_length(name) as name_len
  from public.consultants
  where published;

create or replace view public.events_public as
  select id, title, description, location, image_url, status, date_revealed,
         case when date_revealed then starts_at else null end as starts_at
  from public.events
  where status in ('soon','published','past');

revoke all on public.consultants_public, public.events_public from anon, authenticated;
grant select on public.consultants_public, public.events_public to anon, authenticated;

-- Droits de base (RLS décide ensuite ligne par ligne)
grant select on public.services, public.gallery, public.courses, public.lessons, public.course_files, public.articles to anon, authenticated;
grant insert on public.bookings, public.briefs to anon, authenticated;
grant select, insert, update, delete on public.services, public.gallery, public.consultants, public.courses,
  public.lessons, public.course_files, public.events, public.articles, public.bookings, public.briefs to authenticated;
revoke select, update, delete on public.bookings, public.briefs from anon;
revoke all on public.consultants, public.events from anon;

-- ---------- Stockage des photos et vidéos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm',
              'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/csv'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media admin insert" on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
-- Lecture : le bucket est public, les fichiers s'affichent sur le site sans connexion.
-- Les leçons de formation sont des liens YouTube (colonne lessons.video_url) :
-- mettez les vidéos en « Non répertoriée » sur YouTube.

-- =====================================================================
--  Contenu de départ (repris du site actuel). Inséré seulement si vide.
-- =====================================================================
insert into public.services (position,title,description,chips,specs,image_url,is_object,bg,fg,accent,needs,cta_consult)
select * from (values
 (1,'Logiciels, sites et applications','Des produits numériques complets ou des MVP qui fonctionnent vraiment : installables sur téléphone, en ligne sur votre domaine, en français, en arabe ou en anglais.',
  array['Application mobile','Site web','Logiciel','E-commerce','PWA','Tableau de bord'],'[["Livraison","Produit complet ou MVP"],["Langues","FR · AR · EN"]]'::jsonb,'media/phone-vylivora.jpg',false,'#161616','#faf7f6','#ddf160',array['Application mobile','Site web'],false),
 (2,'Produits physiques et impression 3D','De la modélisation à la pièce finie : prototypes, maquettes, boîtiers et petites séries, prêts à présenter ou à vendre.',
  array['Modélisation 3D','Impression 3D','Maquette','Boîtier','Petite série'],'[["Matériaux","PLA, PETG, résine"],["Couche","0,1 à 0,3 mm"],["Fichiers","STL, STEP, OBJ"]]'::jsonb,'media/ph-3dmodel.jpg',false,'#9f8be7','#ffffff','#161616',array['Produit physique','Impression 3D / maquette'],false),
 (3,'Études, présentations et vidéo','Tout ce qui entoure le produit : étude de marché, business plan, pitch deck, diaporama de soutenance et vidéo de démonstration.',
  array['Étude de marché','Business plan','Pitch deck','Soutenance','Vidéo démo'],'[["Pour","Jury, investisseurs, clients"]]'::jsonb,'media/founder.jpg',false,'#efeceb','#161616','#161616',array['Étude / business plan','Présentation / pitch'],false),
 (4,'Print et supports de salon','Des supports qui donnent envie de s''arrêter à votre stand, conçus et imprimés dans la même identité.',
  array['Roll-up','Bannière','Stand','Flyer','Carte de visite'],'[["Roll-up","85 × 200 cm"],["Carte","85 × 55 mm"],["Flyer","A5, 148 × 210 mm"]]'::jsonb,'media/ph-rollups.jpg',false,'#1e1e22','#faf7f6','#9f8be7',array['Print (roll-up, flyers, cartes)'],false),
 (5,'Design graphique, brand kit et packaging','L''identité complète de votre marque, du logo aux modèles pour les réseaux, puis la conception et la fourniture de vos emballages.',
  array['Logo','Charte graphique','Brand kit','Packaging','Étiquettes','Réseaux sociaux'],'[["Fourniture","Boîtes, flacons, étiquettes, sachets"]]'::jsonb,'media/ph-boxes.jpg',false,'#ddf160','#161616','#161616',array['Logo / brand kit','Packaging'],false),
 (6,'Consultation et accompagnement','Posez vos questions à des experts en développement, comptabilité, droit, santé ou incubation, et faites-vous accompagner jusqu''au lancement.',
  array['Développeur','Comptable','Juriste','Médecin','Incubateur'],'[["Format","En ligne, par téléphone ou sur place"]]'::jsonb,'media/o-knot.webp',true,'#2b2350','#ffffff','#ddf160',array['Consultation d''expert'],true)
) v where not exists (select 1 from public.services);

insert into public.gallery (position,title,caption,label,media_url,media_type,style)
select * from (values
 (1,'Roll-up','85 × 200 cm et version table','Exemple','media/ph-rollups.jpg','image','photo'),
 (2,'Showreel 3D','objets imprimables','Vidéo','media/reel-3d.mp4','video','photo'),
 (3,'Packaging','boîtes et emballages','Exemple','media/ph-boxes.jpg','image','photo'),
 (4,'Vylivora','écran d''accueil','Capture réelle','media/screen-vylivora.jpg','image','photo'),
 (5,'Cartes de visite','85 × 55 mm','Exemple','media/ph-cards.jpg','image','photo'),
 (6,'Modélisation 3D','pièces mécaniques','Exemple','media/ph-3dmodel.jpg','image','photo'),
 (7,'Flyer','dépliant','Exemple','media/ph-flyer.jpg','image','photo'),
 (8,'Design produit','drone en CAO','Exemple','media/ph-drone.jpg','image','photo'),
 (9,'Vylivora','rendu 3D','','media/phone-vylivora.jpg','image','photo'),
 (10,'Packaging','gamme cosmétique','Exemple','media/ph-cosmetic.jpg','image','photo'),
 (11,'CAO','conception de pièces','Exemple','media/ph-cad.jpg','image','photo'),
 (12,'Brand kit','mise en scène produit','Exemple','media/ph-bottles.jpg','image','photo'),
 (13,'Kit salon','PROTO.ME','','media/print.jpg','image','photo'),
 (14,'Rendu 3D','pièces modulaires','','media/o-blocks.webp','image','obj-lime')
) v where not exists (select 1 from public.gallery);

insert into public.consultants (position,name,role,domain,tags,photo_url,revealed)
select * from (values
 (1,'','Développeur senior','Développement',array['Architecture','MVP','Choix techniques'],'',false),
 (2,'','Expert-comptable','Comptabilité',array['Création d''entreprise','Fiscalité','Bilans'],'',false),
 (3,'','Juriste d''affaires','Juridique',array['Statuts','Contrats','Propriété intellectuelle'],'',false),
 (4,'','Médecin conseil','Santé',array['Projets santé','Dispositifs médicaux','Applis santé'],'',false),
 (5,'','Directeur d''incubateur','Incubation',array['Financement','Accompagnement','Pitch'],'',false),
 (6,'','Expert marketing digital','Marketing',array['Lancement','Réseaux sociaux','Publicité'],'',false),
 (7,'','Ingénieur industriel','Industrie',array['Fabrication','Production en série','Matériaux'],'',false),
 (8,'','Designer produit et UX','Design',array['Expérience utilisateur','Interfaces','Tests'],'',false)
) v where not exists (select 1 from public.consultants);

do $$
declare cid uuid;
begin
  if not exists (select 1 from public.courses) then
    insert into public.courses (position,title,level,description,cover_url,status,instructor_name,instructor_photo_url,category)
      values (1,'Lancer son projet : de l''idée au produit','Débutant','Les étapes clés pour passer d''une idée à un produit prêt à lancer : prototype, tests et présentation.','media/intro-desktop.jpg','published','Ouassim Meslaoui','media/founder.jpg','business')
      returning id into cid;
    insert into public.lessons (course_id,position,title,video_url) values
      (cid,1,'Introduction : de l''idée au produit','media/intro-desktop.mp4'),
      (cid,2,'Les étapes du prototypage','media/reel-3d.mp4'),
      (cid,3,'Préparer le lancement','media/reel-ambiance.mp4');
  end if;
end $$;

-- Formation « التجارة الإلكترونية » (Ali Mokran) : ajoutée une seule fois
do $$
declare cid uuid;
begin
  if not exists (select 1 from public.courses where title = 'التجارة الإلكترونية') then
    insert into public.courses (position,title,level,description,cover_url,status,instructor_name,instructor_photo_url,category)
      values (2,'التجارة الإلكترونية','Débutant','سلسلة لتعلّم التجارة الإلكترونية بنظام الدفع عند الاستلام، خطوة بخطوة : من المقدمة إلى إطلاق متجرك.','https://i.ytimg.com/vi/8SvC-KA1VwI/hqdefault.jpg','published','Ali Mokran','media/teachers/ali-mokran.jpg','business')
      returning id into cid;
    insert into public.lessons (course_id,position,title,video_url) values
      (cid,1,'الحلقة 1 : مقدمة في التجارة الإلكترونية والدفع عند الاستلام','https://www.youtube.com/watch?v=8SvC-KA1VwI');
  end if;
end $$;

-- Formation Flown marketing : ajoutée une seule fois
do $$
declare cid uuid;
begin
  if not exists (select 1 from public.courses where instructor_name = 'Flown marketing') then
    insert into public.courses (position,title,level,description,cover_url,status,instructor_name,instructor_photo_url,category)
      values (3,'مقدمة في التجارة الإلكترونية والدفع عند الاستلام','Débutant','كيف تتحول ميزانية الإعلانات إلى مبيعات في تجارة الدفع عند الاستلام، لماذا يهيمن هذا النظام على السوق الجزائري، وأهم المصطلحات التسويقية والمالية قبل البدء.','https://i.ytimg.com/vi/8YVq6ci58jY/hqdefault.jpg','published','Flown marketing','media/teachers/flown-marketing.jpg','marketing')
      returning id into cid;
    insert into public.lessons (course_id,position,title,video_url) values
      (cid,1,'مقدمة في التجارة الإلكترونية والدفع عند الاستلام','https://www.youtube.com/watch?v=8YVq6ci58jY');
  end if;
end $$;

-- Consultant : Heithem (ajouté une seule fois)
insert into public.consultants (position,name,role,domain,tags,bio,photo_url,revealed)
select 0,'Heithem','Ingénieur web full-stack','Développement',array['Sites et applications web','Back-end et API','Mise en ligne'],
  'Heithem conçoit et développe des sites et des applications web de bout en bout : interface, back-end, base de données et mise en ligne.','media/team/heithem.jpg',true
where not exists (select 1 from public.consultants where name = 'Heithem');

-- Consultant : Samir Ait Akkache (remplace le profil flouté « Directeur d'incubateur »)
insert into public.consultants (position,name,role,domain,tags,bio,photo_url,revealed)
select 5,'Samir Ait Akkache','Directeur de l''incubateur de l''Université de Bouira','Incubation',array['Développement et lancement de startup','Business model','Banque et finance'],
  'Directeur de l''incubateur de l''Université de Bouira, Samir Ait Akkache accompagne le développement et le lancement des startups : business model, banque et financement.','media/team/samir-ait-akkache.jpg',true
where not exists (select 1 from public.consultants where name = 'Samir Ait Akkache');
update public.consultants set published = false where name = '' and role = 'Directeur d''incubateur';

-- Consultant : Arslan (ajouté une seule fois)
insert into public.consultants (position,name,role,domain,tags,bio,photo_url,revealed)
select 2,'Arslan','Graphiste senior','Design',array['Identité visuelle','Brand kit','Print et packaging'],
  'Arslan crée des identités visuelles et des supports qui se remarquent : logo, brand kit, affiches, roll-up, packaging et visuels pour les réseaux sociaux.','media/team/arslan.jpg',true
where not exists (select 1 from public.consultants where name = 'Arslan');
-- Les profils sans nom (pas encore confirmés) ne sont plus affichés
update public.consultants set published = false where name = '';

-- Formations « bientôt » de démonstration : retirées du site (passées en brouillon)
update public.courses set status = 'draft'
where status = 'soon' and title in ('L''IA au service de votre projet','Marketing digital : trouver ses premiers clients','Créer son brand kit',
  'Créer son application sans se perdre','Impression 3D de A à Z','Pitcher son projet devant un jury','Les bases juridiques et comptables d''une startup');

-- Formation vidéo (2 vidéos YouTube) : ajoutée une seule fois
do $$
declare cid uuid;
begin
  if not exists (select 1 from public.lessons where video_url like '%Dv39fDYei9A%') then
    insert into public.courses (position,title,level,description,cover_url,status,category)
      values (4,'Formation vidéo : e-commerce et vente en ligne','Débutant','Deux vidéos à suivre dans l''ordre.','https://i.ytimg.com/vi/Dv39fDYei9A/hqdefault.jpg','published','business')
      returning id into cid;
    insert into public.lessons (course_id,position,title,video_url) values
      (cid,1,'Vidéo 1','https://www.youtube.com/watch?v=Dv39fDYei9A'),
      (cid,2,'Vidéo 2','https://www.youtube.com/watch?v=Oi_sweaa0EE');
  end if;
end $$;

insert into public.events (title,description,location,image_url,status)
select * from (values
 ('Atelier prototypage','Atelier pratique · Places limitées','','media/ph-drone.jpg','soon'),
 ('Soirée pitch startups','Présentations et rencontres','','media/founder.jpg','soon'),
 ('Salon et exposition','PROTO.ME participe avec un stand','','media/ph-rollups.jpg','soon')
) v where not exists (select 1 from public.events);
