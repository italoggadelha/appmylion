-- ═══════════════════════════════════════════════════════════════════
-- RUGIDO OS — tabela de automações (catálogo de regras operacionais)
-- Roda depois de schema.sql.
-- ═══════════════════════════════════════════════════════════════════
set search_path to rugido, public;

create table if not exists rugido.automacoes (
  id         uuid primary key default gen_random_uuid(),
  chave      text unique not null,
  nome       text not null,
  descricao  text,
  gatilho    text not null,
  ativa      boolean not null default true,
  execucoes  int not null default 0,
  criado_em  timestamptz not null default now()
);

alter table rugido.automacoes enable row level security;
drop policy if exists equipe_all on rugido.automacoes;
create policy equipe_all on rugido.automacoes
  using (rugido.eh_equipe()) with check (rugido.eh_equipe());

grant all on rugido.automacoes to authenticated, service_role;
grant select on rugido.automacoes to anon;

insert into rugido.automacoes (chave, nome, descricao, gatilho) values
 ('onboarding_cliente','Onboarding automático',
  'Ao cadastrar um cliente, cria as tarefas padrão da fase inicial.',
  'Novo cliente'),
 ('tarefas_da_fase','Tarefas padrão por fase',
  'Quando o cliente avança de fase, gera as tarefas padrão da nova fase.',
  'Mudança de fase'),
 ('aprovacao_conclui','Aprovação conclui a tarefa',
  'Quando o cliente aprova uma entrega, a tarefa vinculada é concluída.',
  'Aprovação respondida'),
 ('sugerir_avanco','Sugestão de avanço de fase',
  'Quando todas as tarefas da fase atual são concluídas, sugere o avanço.',
  'Tarefa concluída'),
 ('alerta_atraso','Alerta de tarefa atrasada',
  'Destaca tarefas que passaram do prazo sem conclusão.',
  'Diário')
on conflict (chave) do nothing;
