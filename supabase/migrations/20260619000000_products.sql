-- Produtos do ecossistema
create table if not exists public.products (
  slug text primary key,
  nome text not null,
  descricao text,
  paddle_product_id text,
  created_at timestamptz default now()
);

insert into public.products (slug, nome, descricao) values
  ('controletotal', 'Controle Total', 'Gestão inteligente para prestadores de serviços'),
  ('atendente', 'Atendente', 'Recepcionista IA para WhatsApp')
on conflict (slug) do nothing;

-- Quais contas têm acesso a qual produto
create table if not exists public.account_products (
  account_id uuid not null references profiles(id),
  product_slug text not null references products(slug),
  ativo boolean default true,
  paddle_subscription_id text,
  created_at timestamptz default now(),
  primary key (account_id, product_slug)
);

alter table public.account_products enable row level security;

create policy "Conta vê seus próprios produtos"
  on public.account_products for select
  using (account_id = auth.uid() or account_id = public.current_account_owner());
