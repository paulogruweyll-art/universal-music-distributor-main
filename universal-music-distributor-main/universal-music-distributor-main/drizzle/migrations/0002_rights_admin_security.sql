alter table public.profiles
  add column account_status text not null default 'active'
  check (account_status in ('active', 'suspended'));

alter table public.releases
  add column distribution_reference text,
  add column distributed_at timestamptz;

alter table public.releases
  drop constraint if exists releases_status_check;

alter table public.releases
  add constraint releases_status_check
  check (status in ('draft', 'pending', 'in_review', 'approved', 'live', 'rejected', 'removed'));

create table public.rights_declarations (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete restrict,
  artist_id uuid not null references public.profiles(id) on delete restrict,
  master_owner text not null check (length(trim(master_owner)) between 1 and 200),
  composition_owner text not null check (length(trim(composition_owner)) between 1 and 200),
  attested boolean not null check (attested),
  status text not null default 'declared'
    check (status in ('declared', 'under_review', 'verified', 'disputed', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  unique (release_id)
);

create table public.track_credits (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete restrict,
  contributor_name text not null check (length(trim(contributor_name)) between 1 and 200),
  role text not null check (role in (
    'primary_artist', 'featured_artist', 'performer', 'songwriter', 'composer',
    'producer', 'publisher', 'engineer', 'other'
  )),
  ownership_share numeric(5, 2) check (ownership_share between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.rights_documents (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete restrict,
  artist_id uuid not null references public.profiles(id) on delete restrict,
  document_type text not null
    check (document_type in ('license', 'split_sheet', 'authorization', 'identity', 'other')),
  object_path text not null unique,
  created_at timestamptz not null default now(),
  check (object_path like artist_id::text || '/' || release_id::text || '/%')
);

create table public.copyright_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  report_type text not null
    check (report_type in ('infringement', 'counter_notice', 'appeal')),
  against_release_id uuid references public.releases(id) on delete restrict,
  parent_report_id uuid references public.copyright_reports(id) on delete restrict,
  claimant_name text not null check (length(trim(claimant_name)) between 1 and 200),
  work_description text not null check (length(trim(work_description)) between 20 and 10000),
  external_reference text,
  good_faith_attested boolean not null check (good_faith_attested),
  evidence_path text,
  status text not null default 'submitted'
    check (status in (
      'submitted', 'investigating', 'action_taken', 'counter_received', 'resolved',
      'rejected', 'withdrawn', 'appealed'
    )),
  decision text check (decision in ('remove', 'restore', 'no_action', 'accept_counter')),
  admin_notes text,
  decided_by uuid references public.profiles(id) on delete restrict,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (report_type = 'infringement' and parent_report_id is null)
    or (report_type in ('counter_notice', 'appeal') and parent_report_id is not null)
  ),
  check (evidence_path is null or evidence_path like reporter_id::text || '/' || id::text || '/%')
);

create table public.copyright_report_contacts (
  report_id uuid primary key references public.copyright_reports(id) on delete restrict,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  email text not null check (length(trim(email)) between 3 and 320),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.copyright_case_notes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.copyright_reports(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index rights_declarations_artist_idx on public.rights_declarations (artist_id, created_at desc);
create index track_credits_track_idx on public.track_credits (track_id);
create index rights_documents_release_idx on public.rights_documents (release_id, created_at desc);
create index copyright_reports_reporter_idx on public.copyright_reports (reporter_id, created_at desc);
create index copyright_reports_release_idx on public.copyright_reports (against_release_id, created_at desc);
create index copyright_reports_parent_idx on public.copyright_reports (parent_report_id, created_at desc);
create index copyright_reports_status_idx on public.copyright_reports (status, created_at desc);
create index audit_events_created_idx on public.audit_events (created_at desc);
create index copyright_case_notes_report_idx on public.copyright_case_notes (report_id, created_at desc);

alter table public.rights_declarations enable row level security;
alter table public.track_credits enable row level security;
alter table public.rights_documents enable row level security;
alter table public.copyright_reports enable row level security;
alter table public.copyright_report_contacts enable row level security;
alter table public.audit_events enable row level security;
alter table public.copyright_case_notes enable row level security;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

create or replace function public.has_active_account(_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and account_status = 'active'
  )
$$;
revoke all on function public.has_active_account(uuid) from public;
grant execute on function public.has_active_account(uuid) to authenticated;

revoke update on public.profiles from authenticated;
revoke insert on public.profiles from authenticated;
grant insert (id, display_name, artist_name, country, avatar_url)
  on public.profiles to authenticated;
grant update (display_name, artist_name, country, avatar_url, account_status)
  on public.profiles to authenticated;

drop policy if exists "Utilizadores editam o proprio perfil" on public.profiles;
create policy "Utilizadores editam o proprio perfil"
  on public.profiles for update to authenticated
  using (auth.uid() = id and account_status = 'active')
  with check (auth.uid() = id and account_status = 'active');
create policy "Admin atualiza estado dos artistas"
  on public.profiles for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Artista pede saque" on public.payout_requests;
create policy "Artista pede saque"
  on public.payout_requests for insert to authenticated
  with check (
    artist_id = auth.uid()
    and public.has_active_account(auth.uid())
  );

drop policy if exists "Artista apaga lancamento pre-aprovado" on public.releases;
create policy "Artista apaga lancamento pre-aprovado"
  on public.releases for delete to authenticated
  using (
    artist_id = auth.uid()
    and status in ('draft', 'pending', 'rejected')
    and public.has_active_account(auth.uid())
  );

revoke update on public.releases from authenticated;
revoke insert on public.releases from authenticated;
grant update (
  title, release_type, genre, release_date, cover_url, description, language,
  explicit, platforms, status, review_notes, distribution_reference, distributed_at
) on public.releases to authenticated;

drop policy if exists "Artista edita lancamento pre-aprovado" on public.releases;
create policy "Artista edita lancamento pre-aprovado"
  on public.releases for update to authenticated
  using (
    artist_id = auth.uid()
    and status in ('draft', 'pending', 'rejected')
    and public.has_active_account(auth.uid())
  )
  with check (
    artist_id = auth.uid()
    and status in ('draft', 'pending', 'rejected')
    and public.has_active_account(auth.uid())
  );

drop policy if exists "Admin ve todos os lancamentos" on public.releases;
create policy "Admin ve todos os lancamentos"
  on public.releases for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Artista cria o proprio lancamento" on public.releases;
create policy "Artista cria o proprio lancamento"
  on public.releases for insert to authenticated
  with check (
    artist_id = auth.uid()
    and status = 'pending'
    and public.has_active_account(auth.uid())
  );

drop policy if exists "Artista cria faixas nos proprios lancamentos" on public.tracks;
drop policy if exists "Admin ve todas as faixas" on public.tracks;
create policy "Artista ve proprias faixas"
  on public.tracks for select to authenticated
  using (
    exists (
      select 1 from public.releases r
      where r.id = release_id and r.artist_id = auth.uid()
    )
  );
create policy "Admin ve todas as faixas"
  on public.tracks for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Artista cria faixas do proprio lancamento"
  on public.tracks for insert to authenticated
  with check (
    exists (
      select 1 from public.releases r
      where r.id = release_id
        and r.artist_id = auth.uid()
        and r.status in ('draft', 'pending', 'rejected')
        and audio_url like auth.uid()::text || '/' || release_id::text || '/audio-%'
    )
    and public.has_active_account(auth.uid())
  );

create policy "Artista ve declaracoes proprias"
  on public.rights_declarations for select to authenticated
  using (
    artist_id = auth.uid()
    and exists (
      select 1 from public.releases r where r.id = release_id and r.artist_id = auth.uid()
    )
  );
create policy "Admin ve declaracoes de direitos"
  on public.rights_declarations for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Artista declara direitos do proprio lancamento"
  on public.rights_declarations for insert to authenticated
  with check (
    artist_id = auth.uid()
    and attested
    and status = 'declared'
    and exists (
      select 1 from public.releases r
      where r.id = release_id
        and r.artist_id = auth.uid()
        and r.status in ('draft', 'pending', 'rejected')
    )
    and public.has_active_account(auth.uid())
  );
grant select, insert on public.rights_declarations to authenticated;
revoke all on public.rights_declarations from authenticated;
grant select (
  id, release_id, artist_id, master_owner, composition_owner, attested, status, created_at
) on public.rights_declarations to authenticated;
grant update (status) on public.rights_declarations to authenticated;
create policy "Admin atualiza revisao de direitos"
  on public.rights_declarations for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Artista ve creditos dos seus lancamentos"
  on public.track_credits for select to authenticated
  using (
    exists (
      select 1 from public.tracks t
      join public.releases r on r.id = t.release_id
      where t.id = track_id and r.artist_id = auth.uid()
    )
  );
create policy "Admin ve creditos"
  on public.track_credits for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Artista gere creditos pre aprovacao"
  on public.track_credits for all to authenticated
  using (
    exists (
      select 1 from public.tracks t
      join public.releases r on r.id = t.release_id
      where t.id = track_id
        and r.artist_id = auth.uid()
        and r.status in ('draft', 'pending', 'rejected')
    )
  )
  with check (
    exists (
      select 1 from public.tracks t
      join public.releases r on r.id = t.release_id
      where t.id = track_id
        and r.artist_id = auth.uid()
        and r.status in ('draft', 'pending', 'rejected')
    )
    and public.has_active_account(auth.uid())
  );
revoke all on public.track_credits from authenticated;
grant select on public.track_credits to authenticated;

create policy "Artista ve documentos do proprio lancamento"
  on public.rights_documents for select to authenticated
  using (
    artist_id = auth.uid()
    and exists (
      select 1 from public.releases r where r.id = release_id and r.artist_id = auth.uid()
    )
  );
create policy "Admin ve documentos de direitos"
  on public.rights_documents for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Artista regista documentos do proprio lancamento"
  on public.rights_documents for insert to authenticated
  with check (
    artist_id = auth.uid()
    and object_path like auth.uid()::text || '/' || release_id::text || '/%'
    and exists (
      select 1 from public.releases r
      where r.id = release_id and r.artist_id = auth.uid()
    )
    and public.has_active_account(auth.uid())
  );
grant select, insert on public.rights_documents to authenticated;

revoke insert, update, delete on public.tracks from authenticated;
grant select on public.tracks to authenticated;

create policy "Partes interessadas veem denuncias"
  on public.copyright_reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.releases r
      where r.id = against_release_id and r.artist_id = auth.uid()
    )
  );
create policy "Admin ve todas as denuncias"
  on public.copyright_reports for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Artista envia denuncia de direitos"
  on public.copyright_reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and status = 'submitted'
    and decision is null
    and decided_by is null
    and decided_at is null
    and admin_notes is null
    and (
      (report_type = 'infringement' and parent_report_id is null)
      or (
        report_type = 'counter_notice'
        and exists (
          select 1
          from public.copyright_reports parent
          join public.releases r on r.id = parent.against_release_id
          where parent.id = parent_report_id
            and parent.report_type = 'infringement'
            and r.artist_id = auth.uid()
            and parent.status in ('action_taken', 'investigating')
        )
      )
      or (
        report_type = 'appeal'
        and exists (
          select 1 from public.copyright_reports parent
          where parent.id = parent_report_id
            and parent.reporter_id = auth.uid()
            and parent.status in ('resolved', 'rejected')
        )
      )
    )
    and public.has_active_account(auth.uid())
  );
revoke all on public.copyright_reports from authenticated;
grant select (
  id, reporter_id, report_type, against_release_id, parent_report_id, claimant_name,
  work_description, external_reference, good_faith_attested, evidence_path,
  status, decision, decided_by, decided_at, created_at
) on public.copyright_reports to authenticated;
grant update (evidence_path, status) on public.copyright_reports to authenticated;
create policy "Denunciante adiciona evidencia e retira denuncia"
  on public.copyright_reports for update to authenticated
  using (reporter_id = auth.uid() and status = 'submitted')
  with check (
    reporter_id = auth.uid()
    and status in ('submitted', 'withdrawn')
    and (evidence_path is null or evidence_path like auth.uid()::text || '/' || id::text || '/%')
  );
grant update (status, decision, decided_by, decided_at)
  on public.copyright_reports to authenticated;
create policy "Admin decide denuncias"
  on public.copyright_reports for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Autor ou admin ve contactos do processo"
  on public.copyright_report_contacts for select to authenticated
  using (
    reporter_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Autor regista contacto do processo"
  on public.copyright_report_contacts for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.copyright_reports r
      where r.id = report_id and r.reporter_id = auth.uid()
    )
    and public.has_active_account(auth.uid())
  );
grant select (report_id, reporter_id, email, created_at)
  on public.copyright_report_contacts to authenticated;
revoke insert, update, delete on public.copyright_report_contacts from authenticated;

create policy "Admin le notas privadas de investigacao"
  on public.copyright_case_notes for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admin regista notas privadas de investigacao"
  on public.copyright_case_notes for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.has_role(auth.uid(), 'admin')
  );
grant select, insert on public.copyright_case_notes to authenticated;

revoke insert on public.payout_requests from authenticated;
grant update (status, notes) on public.payout_requests to authenticated;

create or replace function public.submit_payout_request(
  p_amount numeric,
  p_currency text,
  p_method text,
  p_payment_details text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  artist uuid := auth.uid();
  available numeric(12, 2);
  request_id uuid;
begin
  if artist is null or not public.has_active_account(artist) then
    raise exception 'An active artist session is required';
  end if;
  if p_amount is null or p_amount <= 0
    or coalesce(p_currency, '') !~ '^[A-Z]{3}$'
    or coalesce(p_method, '') not in ('bank_transfer', 'mobile_money')
    or length(trim(coalesce(p_payment_details, ''))) not between 5 and 1000
  then
    raise exception 'Invalid payout request details';
  end if;

  perform pg_advisory_xact_lock(hashtext(artist::text || ':' || p_currency));

  select coalesce(sum(amount), 0) into available
  from public.royalty_transactions
  where artist_id = artist and currency = p_currency;

  available := available - coalesce((
    select sum(amount)
    from public.payout_requests
    where artist_id = artist
      and currency = p_currency
      and status in ('pending', 'processing', 'paid')
  ), 0);

  if p_amount > available then
    raise exception 'The requested amount exceeds the available royalty balance';
  end if;

  insert into public.payout_requests (
    artist_id, amount, currency, method, payment_details
  ) values (
    artist, p_amount, p_currency, p_method, trim(p_payment_details)
  ) returning id into request_id;

  return request_id;
end;
$$;

revoke all on function public.submit_payout_request(numeric, text, text, text) from public, anon;
grant execute on function public.submit_payout_request(numeric, text, text, text) to authenticated;

create policy "Admin ve historico de auditoria"
  on public.audit_events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
grant select on public.audit_events to authenticated;
revoke all on public.audit_events from anon, authenticated;
grant select on public.audit_events to authenticated;
grant all on public.audit_events to service_role;

create or replace function public.validate_release_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.artist_id and (
    new.artist_id is distinct from old.artist_id
    or new.status is distinct from old.status
    or new.review_notes is distinct from old.review_notes
    or new.distribution_reference is distinct from old.distribution_reference
    or new.distributed_at is distinct from old.distributed_at
  ) then
    raise exception 'Only the distribution team can change review or delivery status';
  end if;

  if new.status = 'live' and nullif(trim(new.distribution_reference), '') is null then
    raise exception 'A live status requires a verified distributor reference';
  end if;

  if new.status = 'removed' and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only an administrator can remove a release';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger validate_release_update
before update on public.releases
for each row execute function public.validate_release_update();

create or replace function public.validate_profile_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id and (
    new.id is distinct from old.id
    or new.account_status is distinct from old.account_status
  ) then
    raise exception 'Only an administrator can change account status';
  end if;
  return new;
end;
$$;

create trigger validate_profile_update
before update on public.profiles
for each row execute function public.validate_profile_update();

create or replace function public.validate_copyright_report_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent public.copyright_reports%rowtype;
begin
  if new.report_type = 'counter_notice' then
    select * into parent from public.copyright_reports where id = new.parent_report_id;
    if parent.id is null or parent.against_release_id is distinct from new.against_release_id then
      raise exception 'A counter notice must refer to the original reported release';
    end if;
  elsif new.report_type = 'appeal' then
    select * into parent from public.copyright_reports where id = new.parent_report_id;
    if parent.id is null or parent.against_release_id is distinct from new.against_release_id then
      raise exception 'An appeal must refer to the original case';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.validate_copyright_report_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') and (
    new.decision is distinct from old.decision
    or new.decided_by is distinct from old.decided_by
    or new.decided_at is distinct from old.decided_at
    or new.admin_notes is distinct from old.admin_notes
  ) then
    raise exception 'Only administrators can record case decisions';
  end if;

  if new.decision is not null and (
    new.decided_by is distinct from auth.uid()
    or new.decided_at is null
    or new.status not in ('action_taken', 'resolved', 'rejected')
  ) then
    raise exception 'A case decision requires an administrator and a terminal status';
  end if;
  return new;
end;
$$;

create trigger validate_copyright_report_update
before update on public.copyright_reports
for each row execute function public.validate_copyright_report_update();

create or replace function public.decide_copyright_report(
  p_report_id uuid,
  p_decision text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  report public.copyright_reports%rowtype;
  result_status text;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Administrator permission is required';
  end if;
  if coalesce(p_decision, '') not in ('remove', 'restore', 'no_action', 'accept_counter') then
    raise exception 'Invalid case decision';
  end if;

  select * into report
  from public.copyright_reports
  where id = p_report_id
  for update;
  if report.id is null then
    raise exception 'Copyright case not found';
  end if;
  if p_decision = 'accept_counter' and report.report_type <> 'counter_notice' then
    raise exception 'Only a counter notice can be accepted';
  end if;

  result_status := case when p_decision = 'remove' then 'action_taken' else 'resolved' end;

  update public.copyright_reports
  set decision = p_decision,
      status = result_status,
      decided_by = auth.uid(),
      decided_at = now()
  where id = report.id;

  if p_decision = 'remove' and report.against_release_id is not null then
    update public.releases
    set status = 'removed'
    where id = report.against_release_id and status <> 'removed';
  elsif p_decision in ('restore', 'accept_counter')
    and report.against_release_id is not null
  then
    update public.releases
    set status = 'approved'
    where id = report.against_release_id and status = 'removed';
  end if;

  if p_decision = 'accept_counter' and report.parent_report_id is not null then
    update public.copyright_reports
    set decision = 'accept_counter',
        status = 'resolved',
        decided_by = auth.uid(),
        decided_at = now()
    where id = report.parent_report_id;
  end if;
end;
$$;

revoke all on function public.decide_copyright_report(uuid, text) from public, anon;
grant execute on function public.decide_copyright_report(uuid, text) to authenticated;

create trigger validate_copyright_report_insert
before insert on public.copyright_reports
for each row execute function public.validate_copyright_report_insert();

create or replace function public.submit_copyright_report(
  p_report_id uuid,
  p_report_type text,
  p_against_release_id uuid,
  p_parent_report_id uuid,
  p_claimant_name text,
  p_claimant_email text,
  p_work_description text,
  p_external_reference text,
  p_good_faith_attested boolean,
  p_evidence_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    or not public.has_active_account(auth.uid())
    or p_report_id is null
    or coalesce(p_report_type, '') not in ('infringement', 'counter_notice', 'appeal')
    or length(trim(coalesce(p_claimant_name, ''))) not between 1 and 200
    or length(trim(coalesce(p_claimant_email, ''))) not between 3 and 320
    or length(trim(coalesce(p_work_description, ''))) not between 20 and 10000
    or length(coalesce(p_external_reference, '')) > 2000
    or not coalesce(p_good_faith_attested, false)
    or (p_evidence_path is not null and p_evidence_path not like
      auth.uid()::text || '/' || p_report_id::text || '/%')
  then
    raise exception 'Invalid copyright report data or missing good-faith statement';
  end if;

  if p_evidence_path is not null and not exists (
    select 1 from storage.objects
    where bucket_id = 'rights-evidence' and name = p_evidence_path
  ) then
    raise exception 'The evidence file has not been uploaded';
  end if;

  if p_report_type = 'counter_notice' and not exists (
    select 1
    from public.copyright_reports parent
    join public.releases r on r.id = parent.against_release_id
    where parent.id = p_parent_report_id
      and parent.report_type = 'infringement'
      and parent.against_release_id is not distinct from p_against_release_id
      and r.artist_id = auth.uid()
      and parent.status in ('action_taken', 'investigating')
  ) then
    raise exception 'A counter notice must refer to an active case against your release';
  end if;

  if p_report_type = 'appeal' and not exists (
    select 1 from public.copyright_reports parent
    where parent.id = p_parent_report_id
      and parent.reporter_id = auth.uid()
      and parent.against_release_id is not distinct from p_against_release_id
      and parent.status in ('resolved', 'rejected')
  ) then
    raise exception 'An appeal must refer to your resolved or rejected case';
  end if;

  insert into public.copyright_reports (
    id, reporter_id, report_type, against_release_id, parent_report_id,
    claimant_name, work_description, external_reference, good_faith_attested, evidence_path
  ) values (
    p_report_id, auth.uid(), p_report_type, p_against_release_id, p_parent_report_id,
    trim(p_claimant_name), trim(p_work_description),
    nullif(trim(coalesce(p_external_reference, '')), ''),
    true, p_evidence_path
  );

  insert into public.copyright_report_contacts (report_id, reporter_id, email)
  values (p_report_id, auth.uid(), trim(p_claimant_email));

  return p_report_id;
end;
$$;

revoke all on function public.submit_copyright_report(
  uuid, text, uuid, uuid, text, text, text, text, boolean, text
) from public, anon;
grant execute on function public.submit_copyright_report(
  uuid, text, uuid, uuid, text, text, text, text, boolean, text
) to authenticated;

create or replace function public.submit_release(
  p_release_id uuid,
  p_title text,
  p_release_type text,
  p_genre text,
  p_release_date date,
  p_cover_path text,
  p_description text,
  p_explicit boolean,
  p_platforms text[],
  p_master_owner text,
  p_composition_owner text,
  p_rights_attested boolean,
  p_tracks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  track_entry jsonb;
  credit_entry jsonb;
  created_track_id uuid;
  track_index integer := 0;
  track_count integer;
begin
  if auth.uid() is null or not public.has_active_account(auth.uid()) then
    raise exception 'An active artist session is required';
  end if;
  if p_release_id is null
    or length(trim(coalesce(p_title, ''))) not between 1 and 150
    or length(trim(coalesce(p_genre, ''))) not between 1 and 80
    or coalesce(p_release_type, '') not in ('single', 'ep', 'album')
    or p_release_date is null
    or p_release_date < current_date
    or p_cover_path not like auth.uid()::text || '/' || p_release_id::text || '/cover-%'
    or coalesce(cardinality(p_platforms), 0) < 1
    or array_position(p_platforms, null) is not null
    or cardinality(p_platforms) <> cardinality(array(select distinct unnest(p_platforms)))
    or exists (
      select 1
      from unnest(p_platforms) as selected_platform
      where selected_platform not in (
        'spotify', 'apple_music', 'youtube_music', 'deezer', 'amazon_music', 'tidal',
        'pandora', 'qobuz', 'napster', 'iheartradio', 'soundcloud', 'anghami', 'kkbox',
        'line_music', 'joox', 'yandex_music', 'vk_music', 'netease', 'qq_music',
        'jiosaavn', 'gaana', 'wynk', 'boomplay', 'audiomack', 'mdundo', 'claro_musica',
        'uma_look', 'styngr', 'kaboodle', 'sefi', 'tiktok', 'instagram_meta',
        'youtube_content_id', 'snapchat', 'triller', 'shazam', 'spotify_discovery',
        'beatport', 'traxsource', 'junodownload', 'bandcamp', 'itunes_store', 'amazon_store'
      )
    )
    or length(coalesce(p_description, '')) > 1000
    or not coalesce(p_rights_attested, false)
    or length(trim(coalesce(p_master_owner, ''))) not between 1 and 200
    or length(trim(coalesce(p_composition_owner, ''))) not between 1 and 200
    or coalesce(jsonb_typeof(p_tracks), '') <> 'array'
  then
    raise exception 'Invalid release metadata or missing rights declaration';
  end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'covers' and name = p_cover_path
  ) then
    raise exception 'The cover file has not been uploaded';
  end if;

  track_count := jsonb_array_length(p_tracks);
  if track_count < 1 or track_count > 50 or (p_release_type = 'single' and track_count <> 1) then
    raise exception 'The number of tracks does not match the release type';
  end if;

  insert into public.releases (
    id, artist_id, title, release_type, genre, release_date, cover_url,
    description, explicit, platforms, status
  ) values (
    p_release_id, auth.uid(), trim(p_title), p_release_type, trim(p_genre),
    p_release_date, p_cover_path, nullif(trim(coalesce(p_description, '')), ''),
    coalesce(p_explicit, false), p_platforms, 'pending'
  );

  insert into public.rights_declarations (
    release_id, artist_id, master_owner, composition_owner, attested
  ) values (
    p_release_id, auth.uid(), trim(p_master_owner), trim(p_composition_owner), true
  );

  for track_entry in select value from jsonb_array_elements(p_tracks)
  loop
    track_index := track_index + 1;
    if length(trim(coalesce(track_entry->>'title', ''))) not between 1 and 150
      or coalesce(track_entry->>'audio_path', '') not like
        auth.uid()::text || '/' || p_release_id::text || '/audio-%'
      or coalesce(jsonb_typeof(track_entry->'credits'), '') <> 'array'
      or case
        when jsonb_typeof(track_entry->'credits') = 'array'
          then jsonb_array_length(track_entry->'credits') < 1
        else true
      end
    then
      raise exception 'Invalid track details, audio path, or credits';
    end if;
    if not exists (
      select 1 from storage.objects
      where bucket_id = 'audio' and name = track_entry->>'audio_path'
    ) then
      raise exception 'A track audio file has not been uploaded';
    end if;

    insert into public.tracks (
      release_id, title, track_number, audio_url, explicit
    ) values (
      p_release_id, trim(track_entry->>'title'), track_index,
      track_entry->>'audio_path', coalesce(p_explicit, false)
    ) returning id into created_track_id;

    for credit_entry in select value from jsonb_array_elements(track_entry->'credits')
    loop
      if length(trim(coalesce(credit_entry->>'name', ''))) not between 1 and 200
        or coalesce(credit_entry->>'role', '') not in (
          'primary_artist', 'featured_artist', 'performer', 'songwriter', 'composer',
          'producer', 'publisher', 'engineer', 'other'
        )
        or (
          credit_entry ? 'ownership_share'
          and nullif(credit_entry->>'ownership_share', '')::numeric not between 0 and 100
        )
      then
        raise exception 'Invalid contributor credit';
      end if;

      insert into public.track_credits (
        track_id, contributor_name, role, ownership_share
      ) values (
        created_track_id,
        trim(credit_entry->>'name'),
        credit_entry->>'role',
        nullif(credit_entry->>'ownership_share', '')::numeric
      );
    end loop;

    if not exists (
      select 1
      from jsonb_array_elements(track_entry->'credits') as credit
      where credit->>'role' = 'primary_artist'
    ) then
      raise exception 'Each track needs a primary artist credit';
    end if;
  end loop;

  return p_release_id;
end;
$$;

revoke all on function public.submit_release(
  uuid, text, text, text, date, text, text, boolean, text[], text, text, boolean, jsonb
) from public, anon;
grant execute on function public.submit_release(
  uuid, text, text, text, date, text, text, boolean, text[], text, text, boolean, jsonb
) to authenticated;

create or replace function public.validate_credit_shares()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_track uuid := coalesce(new.track_id, old.track_id);
begin
  if exists (
    select 1
    from public.track_credits
    where track_id = target_track
      and role in ('songwriter', 'composer', 'publisher')
    group by role
    having sum(coalesce(ownership_share, 0)) > 100
  ) then
    raise exception 'Contributor ownership shares cannot exceed 100 percent per role';
  end if;
  return null;
end;
$$;

create constraint trigger validate_credit_shares
after insert or update or delete on public.track_credits
deferrable initially deferred
for each row execute function public.validate_credit_shares();

create or replace function public.write_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_json jsonb;
  new_json jsonb;
  entity_key text;
begin
  if tg_op <> 'INSERT' then old_json := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_json := to_jsonb(new); end if;
  entity_key := coalesce(new_json->>'id', old_json->>'id', new_json->>'release_id', old_json->>'release_id');

  insert into public.audit_events (actor_id, entity_type, entity_id, action, before_data, after_data)
  values (auth.uid(), tg_table_name, coalesce(entity_key, 'unknown'), lower(tg_op), old_json, new_json);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.write_audit_event() from public, anon, authenticated;

create trigger audit_releases
after insert or update or delete on public.releases
for each row execute function public.write_audit_event();
create trigger audit_profiles
after update on public.profiles
for each row execute function public.write_audit_event();
create trigger audit_rights_declarations
after insert or update or delete on public.rights_declarations
for each row execute function public.write_audit_event();
create trigger audit_track_credits
after insert or update or delete on public.track_credits
for each row execute function public.write_audit_event();
create trigger audit_rights_documents
after insert or update or delete on public.rights_documents
for each row execute function public.write_audit_event();
create trigger audit_copyright_reports
after insert or update or delete on public.copyright_reports
for each row execute function public.write_audit_event();
create trigger audit_copyright_case_notes
after insert on public.copyright_case_notes
for each row execute function public.write_audit_event();
create trigger audit_payout_requests
after insert or update or delete on public.payout_requests
for each row execute function public.write_audit_event();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('audio', 'audio', false, 104857600, array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/aac', 'audio/ogg']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('rights-evidence', 'rights-evidence', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Admin atualiza capas de todos"
  on storage.objects for update to authenticated
  using (bucket_id = 'covers' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'covers' and public.has_role(auth.uid(), 'admin'));
create policy "Admin atualiza audios de todos"
  on storage.objects for update to authenticated
  using (bucket_id = 'audio' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'audio' and public.has_role(auth.uid(), 'admin'));
create policy "Utilizador le documentos de direitos proprios"
  on storage.objects for select to authenticated
  using (bucket_id = 'rights-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Admin le documentos de direitos"
  on storage.objects for select to authenticated
  using (bucket_id = 'rights-evidence' and public.has_role(auth.uid(), 'admin'));
create policy "Utilizador envia documento de direitos proprio"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'rights-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_active_account(auth.uid())
  );
create policy "Utilizador remove documento de direitos proprio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'rights-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_active_account(auth.uid())
  );

create policy "Admin gere capas de artistas"
  on storage.objects for all to authenticated
  using (bucket_id in ('covers', 'audio', 'avatars') and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id in ('covers', 'audio', 'avatars') and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Envia ficheiros na propria pasta" on storage.objects;
create policy "Envia ficheiros na propria pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('covers', 'audio', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_active_account(auth.uid())
  );

drop policy if exists "Apaga ficheiros na propria pasta" on storage.objects;
create policy "Apaga ficheiros na propria pasta"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('covers', 'audio', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_active_account(auth.uid())
  );
