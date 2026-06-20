-- Adiciona coluna para o nome personalizado da IA
alter table public.profiles add column if not exists nome_ia text;
