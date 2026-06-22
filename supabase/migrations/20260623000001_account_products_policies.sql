-- Adiciona políticas de RLS para inserção e atualização em account_products
create policy "Conta insere seus próprios produtos"
  on public.account_products for insert
  with check (account_id = auth.uid() or account_id = public.current_account_owner());

create policy "Conta atualiza seus próprios produtos"
  on public.account_products for update
  using (account_id = auth.uid() or account_id = public.current_account_owner());
