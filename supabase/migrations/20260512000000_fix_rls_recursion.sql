-- Fix infinite recursion in RLS:
--   - boards SELECT policy queries board_members (triggers RLS on board_members)
--   - board_members SELECT policy queries board_members (self-recursive)
-- Both blow up with "infinite recursion detected in policy for relation
-- 'board_members'" the first time a non-owner authenticated user reads either
-- table. Standard Supabase fix: do the membership check via a security-definer
-- function so RLS on board_members is bypassed inside the check.

create or replace function public.is_board_member(b_id uuid, u_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.board_members
    where board_id = b_id and user_id = u_id
  );
$$;

revoke all on function public.is_board_member(uuid, uuid) from public;
grant execute on function public.is_board_member(uuid, uuid) to authenticated, anon;

drop policy if exists "boards readable by members or if public" on public.boards;
create policy "boards readable by members or if public"
  on public.boards for select
  using (
    visibility = 'public'
    or owner = auth.uid()
    or public.is_board_member(id, auth.uid())
  );

drop policy if exists "members readable to fellow members" on public.board_members;
create policy "members readable to fellow members"
  on public.board_members for select
  using (public.is_board_member(board_id, auth.uid()));
