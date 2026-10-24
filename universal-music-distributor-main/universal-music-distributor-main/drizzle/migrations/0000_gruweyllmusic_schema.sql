-- Perfil do utilizador
create table public.profiles (
  id uuid primary key,
  display_name text not null default '',
  artist_name text not null default '',
  country text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Papéis (separado do perfil por seguranca)
create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null default 'user',
  unique(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Lancamentos
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  title text not null,
  release_type text not null check (release_type in ('single','ep','album')),
  genre text not null,
  release_date date not null,
  cover_url text,
  description text,
  language text not null default 'pt',
  explicit boolean not null default false,
  platforms text[] not null default '{}',
  status text not null default 'pending' check (status in ('draft','pending','in_review','approved','live','rejected')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.releases TO authenticated;
GRANT ALL ON public.releases TO service_role;

-- Faixas
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null,
  title text not null,
  track_number int not null default 1,
  audio_url text not null,
  explicit boolean not null default false,
  isrc text,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT ALL ON public.tracks TO service_role;

-- Transaccoes de royalties
create table public.royalty_transactions (
  id uuid primary key default gen_random_uuid(),
  release_id uuid,
  artist_id uuid not null,
  platform text not null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.royalty_transactions TO authenticated;
GRANT ALL ON public.royalty_transactions TO service_role;

-- Pedidos de saque
create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  method text not null default 'bank_transfer',
  payment_details text,
  status text not null default 'pending' check (status in ('pending','processing','paid','rejected')),
  notes text,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.releases enable row level security;
alter table public.tracks enable row level security;
alter table public.royalty_transactions enable row level security;
alter table public.payout_requests enable row level security;

create policy "Utilizadores veem o proprio perfil" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Utilizadores criam o proprio perfil" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Utilizadores editam o proprio perfil" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admin ve todos os perfis" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "Le os proprios papeis" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create policy "Artista ve os proprios lancamentos" on public.releases for select to authenticated using (artist_id = auth.uid());
create policy "Artista cria o proprio lancamento" on public.releases for insert to authenticated with check (artist_id = auth.uid());
create policy "Artista edita lancamento pre-aprovado" on public.releases for update to authenticated using (artist_id = auth.uid() and status in ('draft','pending','rejected')) with check (artist_id = auth.uid());
create policy "Artista apaga lancamento pre-aprovado" on public.releases for delete to authenticated using (artist_id = auth.uid() and status in ('draft','pending','rejected'));
create policy "Admin ve todos os lancamentos" on public.releases for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admin edita lancamentos" on public.releases for update to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "Artista ve faixas dos proprios lancamentos" on public.tracks for select to authenticated using (exists (select 1 from public.releases r where r.id = release_id and r.artist_id = auth.uid()));
create policy "Artista cria faixas nos proprios lancamentos" on public.tracks for insert to authenticated with check (exists (select 1 from public.releases r where r.id = release_id and r.artist_id = auth.uid()));
create policy "Artista edita faixas pre-aprovadas" on public.tracks for update to authenticated using (exists (select 1 from public.releases r where r.id = release_id and r.artist_id = auth.uid() and r.status in ('draft','pending','rejected')));
create policy "Artista apaga faixas pre-aprovadas" on public.tracks for delete to authenticated using (exists (select 1 from public.releases r where r.id = release_id and r.artist_id = auth.uid() and r.status in ('draft','pending','rejected')));
create policy "Admin ve todas as faixas" on public.tracks for select to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "Artista ve os proprios royalties" on public.royalty_transactions for select to authenticated using (artist_id = auth.uid());
create policy "Admin ve todos os royalties" on public.royalty_transactions for select to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "Artista ve os proprios saques" on public.payout_requests for select to authenticated using (artist_id = auth.uid());
create policy "Artista pede saque" on public.payout_requests for insert to authenticated with check (artist_id = auth.uid());
create policy "Admin ve todos os saques" on public.payout_requests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admin atualiza saques" on public.payout_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- Perfil automatico no registo
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, artist_name, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'artist_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'country','')
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Politicas de armazenamento (buckets privados, acesso por pasta do proprio utilizador)
create policy "Le capas do proprio utilizador" on storage.objects for select to authenticated using (bucket_id in ('covers','audio','avatars') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Admin le todos os ficheiros" on storage.objects for select to authenticated using (public.has_role(auth.uid(),'admin') and bucket_id in ('covers','audio','avatars'));
create policy "Envia ficheiros na propria pasta" on storage.objects for insert to authenticated with check (bucket_id in ('covers','audio','avatars') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Apaga ficheiros na propria pasta" on storage.objects for delete to authenticated using (bucket_id in ('covers','audio','avatars') and (storage.foldername(name))[1] = auth.uid()::text);
