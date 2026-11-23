-- =====================================================================
-- Wishlist: initial schema
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- =====================================================================

-- Helpers live in a schema that is NOT exposed through the Data API.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url   text check (char_length(avatar_url) <= 500),
  created_at   timestamptz not null default now()
);

create table public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  description text check (char_length(description) <= 1000),
  is_private  boolean not null default false,
  event_date  date,
  created_at  timestamptz not null default now()
);
create index wishlists_owner_idx on public.wishlists (owner_id);

create table public.items (
  id          uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 150),
  url         text check (char_length(url) <= 2000 and url ~* '^https?://'),
  price       numeric(12, 2) check (price >= 0),           -- UAH
  image_path  text check (char_length(image_path) <= 300),  -- path inside the item-images bucket
  rarity      smallint not null default 1 check (rarity between 1 and 5),
  note        text check (char_length(note) <= 1000),
  position    integer not null default 0,
  received_at timestamptz,                                  -- not null = archived ("received")
  created_at  timestamptz not null default now()
);
create index items_wishlist_idx on public.items (wishlist_id, position);

-- One reservation per item. Kept in a separate table so RLS can hide it from the list owner.
create table public.reservations (
  item_id    uuid primary key references public.items (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index reservations_user_idx on public.reservations (user_id);

-- Users invited into private wishlists.
create table public.wishlist_members (
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (wishlist_id, user_id)
);
create index wishlist_members_user_idx on public.wishlist_members (user_id);

-- Invite tokens. No direct API access at all: only through the RPC functions below.
create table public.wishlist_invites (
  wishlist_id uuid primary key references public.wishlists (id) on delete cascade,
  token       text not null unique
              default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Access helpers (security definer → no RLS recursion)
-- ---------------------------------------------------------------------

create or replace function private.is_wishlist_owner(p_wishlist uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.wishlists w
    where w.id = p_wishlist and w.owner_id = auth.uid()
  );
$$;

create or replace function private.can_view_wishlist(p_wishlist uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.wishlists w
    where w.id = p_wishlist
      and (
        not w.is_private
        or w.owner_id = auth.uid()
        or exists (
          select 1 from public.wishlist_members m
          where m.wishlist_id = w.id and m.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function private.is_item_owner(p_item uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.items i
    join public.wishlists w on w.id = i.wishlist_id
    where i.id = p_item and w.owner_id = auth.uid()
  );
$$;

create or replace function private.can_view_item(p_item uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.items i
    where i.id = p_item and private.can_view_wishlist(i.wishlist_id)
  );
$$;

create or replace function private.is_item_reservable(p_item uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.items i
    where i.id = p_item and i.received_at is null
  );
$$;

-- ---------------------------------------------------------------------
-- New user → profile (username derived from the email)
-- ---------------------------------------------------------------------

create or replace function private.create_profile(p_id uuid, p_email text, p_meta jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  base      text;
  candidate text;
  n         integer := 0;
begin
  base := lower(regexp_replace(split_part(coalesce(p_email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then
    base := 'user' || base;
  end if;
  base := left(base, 24);
  candidate := base;

  while exists (select 1 from public.profiles p where p.username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    p_id,
    candidate,
    left(coalesce(
      p_meta ->> 'full_name',
      p_meta ->> 'name',
      split_part(p_email, '@', 1)
    ), 60),
    left(p_meta ->> 'avatar_url', 500)
  )
  on conflict (id) do nothing;
end;
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.create_profile(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Users who signed up before this migration was applied get a profile too.
do $$
declare
  u record;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    where not exists (select 1 from public.profiles p where p.id = au.id)
  loop
    perform private.create_profile(u.id, u.email, u.raw_user_meta_data);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC (exposed through the Data API)
-- ---------------------------------------------------------------------

-- Returns the invite token of a wishlist (creating one if needed). Owner only.
create or replace function public.get_invite_token(p_wishlist uuid, p_regenerate boolean default false)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  t text;
begin
  if not private.is_wishlist_owner(p_wishlist) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_regenerate then
    delete from public.wishlist_invites where wishlist_id = p_wishlist;
  end if;

  insert into public.wishlist_invites (wishlist_id) values (p_wishlist)
  on conflict (wishlist_id) do nothing;

  select token into t from public.wishlist_invites where wishlist_id = p_wishlist;
  return t;
end;
$$;

-- Joins the current user to the wishlist behind the token. Returns the wishlist id.
create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  wl uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select wishlist_id into wl from public.wishlist_invites where token = p_token;
  if wl is null then
    raise exception 'invalid_invite' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.wishlists w where w.id = wl and w.owner_id = auth.uid()) then
    insert into public.wishlist_members (wishlist_id, user_id)
    values (wl, auth.uid())
    on conflict do nothing;
  end if;

  return wl;
end;
$$;

-- Saves drag-and-drop order. Runs as the caller, so the items UPDATE policy applies.
create or replace function public.reorder_items(p_wishlist uuid, p_ids uuid[])
returns void language sql volatile security invoker set search_path = '' as $$
  update public.items i
  set position = x.ord
  from unnest(p_ids) with ordinality as x (id, ord)
  where i.id = x.id and i.wishlist_id = p_wishlist;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.wishlists        enable row level security;
alter table public.items            enable row level security;
alter table public.reservations     enable row level security;
alter table public.wishlist_members enable row level security;
alter table public.wishlist_invites enable row level security; -- no policies = no direct access

-- profiles: public names, users edit only themselves
create policy "profiles: read all" on public.profiles
  for select to anon, authenticated using (true);
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- wishlists
create policy "wishlists: read visible" on public.wishlists
  for select to anon, authenticated using (private.can_view_wishlist(id));
create policy "wishlists: insert own" on public.wishlists
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "wishlists: update own" on public.wishlists
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "wishlists: delete own" on public.wishlists
  for delete to authenticated using (owner_id = (select auth.uid()));

-- items
create policy "items: read visible" on public.items
  for select to anon, authenticated using (private.can_view_wishlist(wishlist_id));
create policy "items: insert by owner" on public.items
  for insert to authenticated with check (private.is_wishlist_owner(wishlist_id));
create policy "items: update by owner" on public.items
  for update to authenticated
  using (private.is_wishlist_owner(wishlist_id)) with check (private.is_wishlist_owner(wishlist_id));
create policy "items: delete by owner" on public.items
  for delete to authenticated using (private.is_wishlist_owner(wishlist_id));

-- reservations: visible to everyone who can see the item EXCEPT the list owner
create policy "reservations: read (not owner)" on public.reservations
  for select to anon, authenticated
  using (private.can_view_item(item_id) and not private.is_item_owner(item_id));
create policy "reservations: reserve" on public.reservations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.can_view_item(item_id)
    and not private.is_item_owner(item_id)
    and private.is_item_reservable(item_id)
  );
create policy "reservations: cancel own" on public.reservations
  for delete to authenticated using (user_id = (select auth.uid()));

-- members: the member and the list owner can see / remove; joining only via accept_invite()
create policy "members: read" on public.wishlist_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_wishlist_owner(wishlist_id));
create policy "members: remove" on public.wishlist_members
  for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_wishlist_owner(wishlist_id));

-- ---------------------------------------------------------------------
-- Grants (explicit, works whether or not "auto grant" is enabled)
-- ---------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select                 on public.profiles         to anon, authenticated;
grant update                 on public.profiles         to authenticated;
grant select                 on public.wishlists        to anon, authenticated;
grant insert, update, delete on public.wishlists        to authenticated;
grant select                 on public.items            to anon, authenticated;
grant insert, update, delete on public.items            to authenticated;
grant select                 on public.reservations     to anon, authenticated;
grant insert, delete         on public.reservations     to authenticated;
grant select, delete         on public.wishlist_members to authenticated;
revoke all                   on public.wishlist_invites from anon, authenticated;

revoke execute on function public.get_invite_token(uuid, boolean) from public, anon;
revoke execute on function public.accept_invite(text)             from public, anon;
revoke execute on function public.reorder_items(uuid, uuid[])     from public, anon;
grant  execute on function public.get_invite_token(uuid, boolean) to authenticated;
grant  execute on function public.accept_invite(text)             to authenticated;
grant  execute on function public.reorder_items(uuid, uuid[])     to authenticated;

grant execute on all functions in schema private to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage: item images
--   * max 1 MB per file, only JPEG / PNG / WebP (no SVG!)
--   * public read; users write only into their own folder "<user_id>/..."
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "item-images: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "item-images: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "item-images: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'item-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "item-images: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
