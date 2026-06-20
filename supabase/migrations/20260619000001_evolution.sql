-- Evolucao: Instancias, Conversas, Mensagens, Fila de Envio

-- trigger updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Instancias Evolution (uma por conta)
create table if not exists public.evolution_instances (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references profiles(id),
  instance_name text not null,
  connection_status text not null default 'disconnected'
    check (connection_status in ('disconnected', 'connecting', 'connected')),
  qr_code text,
  webhook_secret text,
  webhook_events text[] default array['messages.upsert'],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (account_id, instance_name)
);

alter table public.evolution_instances enable row level security;

create policy "Conta ve suas proprias instancias"
  on public.evolution_instances for select
  using (account_id = auth.uid() or account_id = public.current_account_owner());

create policy "Conta cria suas proprias instancias"
  on public.evolution_instances for insert
  with check (account_id = auth.uid() or account_id = public.current_account_owner());

create policy "Conta atualiza suas proprias instancias"
  on public.evolution_instances for update
  using (account_id = auth.uid() or account_id = public.current_account_owner());

create trigger set_updated_at
  before update on public.evolution_instances
  for each row execute function public.handle_updated_at();

-- Conversas (canais de conversa)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references profiles(id),
  instance_id uuid not null references evolution_instances(id),
  remote_jid text not null,
  contact_name text,
  contact_phone text,
  last_message_at timestamptz default now(),
  last_message_preview text,
  unread_count integer default 0,
  status text not null default 'active'
    check (status in ('active', 'archived', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (instance_id, remote_jid)
);

alter table public.conversations enable row level security;

create policy "Conta ve suas proprias conversas"
  on public.conversations for select
  using (account_id = auth.uid() or account_id = public.current_account_owner());

create policy "Conta cria suas proprias conversas"
  on public.conversations for insert
  with check (account_id = auth.uid() or account_id = public.current_account_owner());

create policy "Conta atualiza suas proprias conversas"
  on public.conversations for update
  using (account_id = auth.uid() or account_id = public.current_account_owner());

create trigger set_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

-- Mensagens
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  remote_jid text not null,
  instance_id uuid not null references evolution_instances(id),
  from_me boolean not null default false,
  message_type text not null default 'text'
    check (message_type in ('text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'sticker', 'reaction', 'unknown')),
  content text,
  raw_json jsonb,
  ai_processed boolean default false,
  ai_response_id uuid references messages(id),
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Conta ve mensagens das suas conversas"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.account_id = auth.uid() or c.account_id = public.current_account_owner())
    )
  );

create policy "Conta cria mensagens nas suas conversas"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.account_id = auth.uid() or c.account_id = public.current_account_owner())
    )
  );

-- Fila de envio (mensagens aguardando para ser enviadas)
create table if not exists public.message_queue (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  instance_id uuid not null references evolution_instances(id),
  remote_jid text not null,
  content text not null,
  media_url text,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed')),
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

alter table public.message_queue enable row level security;

create policy "Conta ve fila das suas conversas"
  on public.message_queue for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.account_id = auth.uid() or c.account_id = public.current_account_owner())
    )
  );

create policy "Backend manipula fila"
  on public.message_queue for all
  using (true)
  with check (true);

-- Grants para authenticated
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
