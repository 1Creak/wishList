-- =====================================================================
-- Fix: creating a wishlist returned 403.
-- INSERT ... RETURNING checks the new row against the SELECT policy.
-- The old policy called private.can_view_wishlist(id), which looks the row
-- up again and cannot see a row inserted by the same statement.
-- The policy now checks the row's own columns instead.
-- =====================================================================

create or replace function private.is_wishlist_member(p_wishlist uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.wishlist_members m
    where m.wishlist_id = p_wishlist and m.user_id = auth.uid()
  );
$$;

grant execute on function private.is_wishlist_member(uuid) to anon, authenticated;

drop policy if exists "wishlists: read visible" on public.wishlists;

create policy "wishlists: read visible" on public.wishlists
  for select to anon, authenticated
  using (
    not is_private
    or owner_id = (select auth.uid())
    or private.is_wishlist_member(id)
  );
