-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text not null,
  created_at timestamptz not null default now()
);

-- boards
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);

-- board_members
create table public.board_members (
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  primary key (board_id, user_id)
);

-- ai_command_log (post-MVP, but schema in place now)
create table public.ai_command_log (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  prompt text not null,
  model text not null,
  input_tokens int not null,
  output_tokens int not null,
  tool_calls jsonb not null,
  latency_ms int not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.ai_command_log enable row level security;

-- profiles: a user can read any profile (we display names in cursors/presence) and edit only their own
create policy "profiles readable by all authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');
create policy "users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());
create policy "users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- boards: visible to members or if public; insert/update by owner
create policy "boards readable by members or if public"
  on public.boards for select
  using (
    visibility = 'public'
    or exists (
      select 1 from public.board_members m
      where m.board_id = boards.id and m.user_id = auth.uid()
    )
  );
create policy "boards insertable by authenticated"
  on public.boards for insert
  with check (owner = auth.uid());
create policy "boards updatable by owner"
  on public.boards for update
  using (owner = auth.uid());

-- board_members: visible to all members of that board; owner manages
create policy "members readable to fellow members"
  on public.board_members for select
  using (
    exists (
      select 1 from public.board_members me
      where me.board_id = board_members.board_id and me.user_id = auth.uid()
    )
  );
create policy "owner manages members"
  on public.board_members for all
  using (
    exists (
      select 1 from public.boards b
      where b.id = board_members.board_id and b.owner = auth.uid()
    )
  );
-- allow self-insert for public boards (handled by server action with service-role; this is a fallback)
create policy "users can self-insert into public boards"
  on public.board_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.boards b
      where b.id = board_members.board_id and b.visibility = 'public'
    )
  );

-- ai_command_log: append-only by authenticated; readable by board members
create policy "ai log insertable by authenticated"
  on public.ai_command_log for insert
  with check (auth.role() = 'authenticated');
create policy "ai log readable by board members"
  on public.ai_command_log for select
  using (
    exists (
      select 1 from public.board_members m
      where m.board_id = ai_command_log.board_id and m.user_id = auth.uid()
    )
  );

-- profile auto-create trigger on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  palette text[] := array['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
begin
  insert into public.profiles (id, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous Otter'),
    palette[1 + floor(random() * array_length(palette, 1))::int]
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
