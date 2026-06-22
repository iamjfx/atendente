-- Função para verificar se um email já possui cadastro e quais produtos tem ativos
create or replace function public.check_user_products(email_param text)
returns json
language plpgsql
security definer
as $$
declare
  v_profile_id uuid;
  v_nome text;
  v_has_atendente boolean := false;
begin
  -- Busca o perfil pelo email
  select id, nome into v_profile_id, v_nome
  from public.profiles
  where email = email_param
  limit 1;

  if v_profile_id is null then
    return json_build_object(
      'exists', false,
      'has_atendente', false,
      'nome', null
    );
  end if;

  -- Verifica se possui o Atendente ativo
  select exists (
    select 1 from public.account_products
    where account_id = v_profile_id and product_slug = 'atendente' and ativo = true
  ) into v_has_atendente;

  return json_build_object(
    'exists', true,
    'has_atendente', v_has_atendente,
    'nome', v_nome
  );
end;
$$;
