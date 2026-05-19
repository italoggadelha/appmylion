-- ═══════════════════════════════════════════════════════════════════
-- RUGIDO OS — migração: anexos, status configurável, templates de fase,
-- relatório de tráfego. Roda depois de schema.sql / automacoes.sql.
-- ═══════════════════════════════════════════════════════════════════
set search_path to rugido, public;

-- ── 1. Anexos de tarefa (arquivo, imagem, texto, link) ──────────────
create table if not exists rugido.anexos (
  id         uuid primary key default gen_random_uuid(),
  tarefa_id  uuid not null references rugido.tarefas(id) on delete cascade,
  categoria  text not null default 'apoio',   -- aprovacao | ideia | apoio
  tipo       text not null default 'texto',   -- texto | link | arquivo | imagem
  titulo     text not null,
  conteudo   text,                            -- texto, URL ou caminho no storage
  criado_em  timestamptz not null default now()
);
create index if not exists idx_anexos_tarefa on rugido.anexos(tarefa_id);

-- ── 2. Status de tarefa configurável ────────────────────────────────
-- converte a coluna status (enum) em texto, para permitir status custom
alter table rugido.tarefas alter column status drop default;
alter table rugido.tarefas alter column status type text using status::text;
alter table rugido.tarefas alter column status set default 'a_fazer';

create table if not exists rugido.status_tarefa (
  id     uuid primary key default gen_random_uuid(),
  chave  text unique not null,
  nome   text not null,
  cor    text not null default '#4a4a57',
  ordem  int not null default 0,
  ativo  boolean not null default true
);
insert into rugido.status_tarefa (chave, nome, cor, ordem) values
 ('a_fazer','A fazer','#4a4a57',1),
 ('fazendo','Em execução','#5b8def',2),
 ('aguardando_cliente','Aguardando cliente','#f59e0b',3),
 ('aguardando_aprovacao','Aguardando aprovação','#8b5cf6',4),
 ('concluida','Concluída','#10b981',5),
 ('travada','Travada','#ef4444',6)
on conflict (chave) do nothing;

-- ── 3. Configuração das fases (rótulo/cor/símbolo editáveis) ─────────
create table if not exists rugido.fase_config (
  fase       rugido.fase primary key,
  nome       text not null,
  subtitulo  text,
  descricao  text,
  cor        text not null default '#b8943f',
  simbolo    text not null default '🎯',
  ordem      int not null default 0
);
insert into rugido.fase_config (fase, nome, subtitulo, descricao, cor, simbolo, ordem) values
 ('raiox','Raio-X & Mapeamento','Entender o terreno','Onboarding, coleta de acessos e ativos, diagnóstico inicial.','#5b8def','🔍',1),
 ('ultra','Ultravisão Estratégica','Enxergar além','ICP, avatar, posicionamento e arquitetura estratégica.','#8b5cf6','🦅',2),
 ('gameplan','Game Plan Estratégico','O plano de guerra','Funil, jornada, canais, automações e plano de tráfego.','#ec4899','♟️',3),
 ('impl','Implementação & Validação','Construir e testar','Páginas, integrações, automações e validação com testes.','#f59e0b','⚙️',4),
 ('demanda','Demanda & Alcance','Gerar movimento','Campanhas, criativos, conteúdo e gestão de tráfego.','#10b981','📡',5),
 ('escala','Otimização & Escala','Dominar o mercado','Relatórios, KPIs, testes A/B, otimização e expansão.','#ef4444','🚀',6)
on conflict (fase) do nothing;

-- ── 4. Templates de tarefas/subtarefas por fase (valem p/ todos) ─────
create table if not exists rugido.tarefa_templates (
  id     uuid primary key default gen_random_uuid(),
  fase   rugido.fase not null,
  titulo text not null,
  ordem  int not null default 0
);
create table if not exists rugido.subtarefa_templates (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references rugido.tarefa_templates(id) on delete cascade,
  titulo      text not null,
  ordem       int not null default 0
);

-- seed dos templates a partir das tarefas padrão de cada fase
insert into rugido.tarefa_templates (fase, titulo, ordem)
select fase, titulo, ordem from (values
 ('raiox','Onboarding do cliente',1),('raiox','Coleta de acessos',2),('raiox','Formulários de entrada',3),
 ('raiox','Reunião de Kickoff',4),('raiox','Inventário digital',5),('raiox','Coleta de ativos',6),
 ('raiox','Diagnóstico inicial',7),
 ('ultra','Definição de ICP',1),('ultra','Avatar / Persona',2),('ultra','Posicionamento',3),
 ('ultra','Análise de concorrência',4),('ultra','Diagnóstico estratégico',5),('ultra','Tom de voz',6),
 ('ultra','Proposta de valor',7),('ultra','Arquitetura estratégica',8),
 ('gameplan','Desenho do funil',1),('gameplan','Arquitetura de conversão',2),('gameplan','Definição de produtos',3),
 ('gameplan','Jornada do cliente',4),('gameplan','Estrutura de CRM',5),('gameplan','Canais de aquisição',6),
 ('gameplan','Automações',7),('gameplan','Estratégia de conteúdo',8),('gameplan','Plano de tráfego',9),
 ('impl','Landing pages',1),('impl','Site institucional',2),('impl','Configuração de CRM',3),
 ('impl','Integrações',4),('impl','Área de membros',5),('impl','Checkout',6),('impl','SEO local',7),
 ('impl','Google Meu Negócio',8),('impl','Automações',9),('impl','Copy',10),('impl','Design',11),('impl','Testes',12),
 ('demanda','Campanhas',1),('demanda','Criativos',2),('demanda','Reels',3),('demanda','Conteúdo',4),
 ('demanda','Google Ads',5),('demanda','Meta Ads',6),('demanda','Calendário editorial',7),('demanda','Gestão de tráfego',8),
 ('escala','Relatórios',1),('escala','Análise de KPIs',2),('escala','Otimização de ROAS',3),
 ('escala','Testes A/B',4),('escala','Análise de funil',5),('escala','Implementação de melhorias',6),('escala','Expansão',7)
) as t(fase, titulo, ordem)
where not exists (select 1 from rugido.tarefa_templates)
;

-- ── 5. Relatório de tráfego pago por cliente (acesso com senha) ─────
create table if not exists rugido.relatorios_trafego (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references rugido.clientes(id) on delete cascade,
  token       text unique not null
              default 'rel-' || left(replace(gen_random_uuid()::text,'-',''),10),
  senha       text not null default 'mylion',
  periodo     text not null default 'Mensal',
  publicado   boolean not null default false,
  metricas    jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_reltraf_cliente on rugido.relatorios_trafego(cliente_id);

-- ── RLS + grants para as novas tabelas ──────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['anexos','status_tarefa','fase_config',
    'tarefa_templates','subtarefa_templates','relatorios_trafego']
  loop
    execute format('alter table rugido.%I enable row level security;', t);
    execute format('drop policy if exists equipe_all on rugido.%I;', t);
    execute format(
      'create policy equipe_all on rugido.%I using (rugido.eh_equipe()) '||
      'with check (rugido.eh_equipe());', t);
    execute format('grant all on rugido.%I to authenticated, service_role;', t);
    execute format('grant select on rugido.%I to anon;', t);
  end loop;
end $$;

select 'status: '||count(*) from rugido.status_tarefa;
select 'templates: '||count(*) from rugido.tarefa_templates;
