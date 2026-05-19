-- ═══════════════════════════════════════════════════════════════════
-- RUGIDO OS — schema do banco de dados
-- Roda no Supabase self-hosted (api.mylion.com.br) num schema isolado
-- "rugido", sem nenhum contato com as tabelas do CRM.
-- ═══════════════════════════════════════════════════════════════════

create schema if not exists rugido;
set search_path to rugido, public;

-- ── Tipos ───────────────────────────────────────────────────────────
do $$ begin
  create type rugido.fase as enum
    ('raiox','ultra','gameplan','impl','demanda','escala');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rugido.tarefa_status as enum
    ('a_fazer','fazendo','aguardando_cliente','aguardando_aprovacao','concluida','travada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rugido.prioridade as enum ('baixa','media','alta','critica');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rugido.perfil as enum
    ('ceo','gestor','coordenador','operacional','freelancer','cliente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rugido.cliente_status as enum
    ('onboarding','ativo','pausado','finalizado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rugido.aprovacao_status as enum
    ('pendente','aprovado','reprovado','ajustes');
exception when duplicate_object then null; end $$;

-- ── Membros da equipe ───────────────────────────────────────────────
create table if not exists rugido.membros (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique,                       -- referência a auth.users
  nome        text not null,
  email       text unique not null,
  perfil      rugido.perfil not null default 'operacional',
  cargo       text,
  avatar_url  text,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- ── Clientes ────────────────────────────────────────────────────────
create table if not exists rugido.clientes (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  empresa         text not null,
  segmento        text,
  status          rugido.cliente_status not null default 'onboarding',
  fase_atual      rugido.fase not null default 'raiox',
  plano           text,
  ticket          numeric(12,2) not null default 0,
  receita_gerada  numeric(12,2) not null default 0,
  data_entrada    date not null default current_date,
  responsavel_id  uuid references rugido.membros(id),
  health_score    int not null default 50 check (health_score between 0 and 100),
  logo_url        text,
  observacoes     text,
  -- dados estratégicos
  icp             text,
  persona         text,
  posicionamento  text,
  branding        jsonb default '{}'::jsonb,
  acessos         jsonb default '{}'::jsonb,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- ── Tarefas ─────────────────────────────────────────────────────────
create table if not exists rugido.tarefas (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null references rugido.clientes(id) on delete cascade,
  fase             rugido.fase not null,
  titulo           text not null,
  descricao        text,
  status           rugido.tarefa_status not null default 'a_fazer',
  prioridade       rugido.prioridade not null default 'media',
  responsavel_id   uuid references rugido.membros(id),
  prazo            date,
  precisa_aprovacao boolean not null default false,
  ordem            int not null default 0,
  criado_em        timestamptz not null default now(),
  concluido_em     timestamptz
);

-- ── Subtarefas (checklist) ──────────────────────────────────────────
create table if not exists rugido.subtarefas (
  id          uuid primary key default gen_random_uuid(),
  tarefa_id   uuid not null references rugido.tarefas(id) on delete cascade,
  titulo      text not null,
  concluida   boolean not null default false,
  ordem       int not null default 0
);

-- ── Aprovações ──────────────────────────────────────────────────────
create table if not exists rugido.aprovacoes (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references rugido.clientes(id) on delete cascade,
  tarefa_id   uuid references rugido.tarefas(id) on delete set null,
  titulo      text not null,
  tipo        text not null,                     -- arte, copy, video, pagina...
  status      rugido.aprovacao_status not null default 'pendente',
  token       text unique not null default encode(gen_random_bytes(8),'hex'),
  senha       text,
  validade    timestamptz,
  feedback    text,
  arquivo_url text,
  enviada_em  timestamptz not null default now(),
  respondida_em timestamptz
);

-- ── Comentários ─────────────────────────────────────────────────────
create table if not exists rugido.comentarios (
  id          uuid primary key default gen_random_uuid(),
  tarefa_id   uuid references rugido.tarefas(id) on delete cascade,
  cliente_id  uuid references rugido.clientes(id) on delete cascade,
  autor_id    uuid references rugido.membros(id),
  texto       text not null,
  anexo_url   text,
  criado_em   timestamptz not null default now()
);

-- ── Histórico de fases ──────────────────────────────────────────────
create table if not exists rugido.fase_historico (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references rugido.clientes(id) on delete cascade,
  fase        rugido.fase not null,
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  aprovada_por uuid references rugido.membros(id)
);

-- ── Índices ─────────────────────────────────────────────────────────
create index if not exists idx_tarefas_cliente  on rugido.tarefas(cliente_id);
create index if not exists idx_tarefas_status   on rugido.tarefas(status);
create index if not exists idx_tarefas_resp     on rugido.tarefas(responsavel_id);
create index if not exists idx_subtarefas_tar   on rugido.subtarefas(tarefa_id);
create index if not exists idx_aprov_cliente    on rugido.aprovacoes(cliente_id);
create index if not exists idx_clientes_fase    on rugido.clientes(fase_atual);

-- ── Trigger: atualizado_em ──────────────────────────────────────────
create or replace function rugido.touch_atualizado()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end $$ language plpgsql;

drop trigger if exists trg_clientes_touch on rugido.clientes;
create trigger trg_clientes_touch before update on rugido.clientes
  for each row execute function rugido.touch_atualizado();

-- ═══════════════════════════════════════════════════════════════════
-- RLS — Row Level Security
-- Equipe vê tudo; clientes só veem o próprio registro (portal).
-- Ajuste conforme a estratégia de auth definida na Fase 2.
-- ═══════════════════════════════════════════════════════════════════
alter table rugido.clientes    enable row level security;
alter table rugido.tarefas     enable row level security;
alter table rugido.subtarefas  enable row level security;
alter table rugido.aprovacoes  enable row level security;
alter table rugido.comentarios enable row level security;
alter table rugido.membros     enable row level security;

-- Helper: o usuário autenticado é membro da equipe?
create or replace function rugido.eh_equipe()
returns boolean as $$
  select exists (
    select 1 from rugido.membros
    where auth_id = auth.uid()
      and perfil <> 'cliente'
      and ativo
  );
$$ language sql security definer stable;

-- Política ampla para a equipe (leitura + escrita)
do $$
declare t text;
begin
  foreach t in array array['clientes','tarefas','subtarefas','aprovacoes','comentarios','membros']
  loop
    execute format(
      'drop policy if exists equipe_all on rugido.%I; '||
      'create policy equipe_all on rugido.%I '||
      'using (rugido.eh_equipe()) with check (rugido.eh_equipe());', t, t);
  end loop;
end $$;

-- Aprovações são públicas por token (página de aprovação do cliente):
-- a leitura por token é feita via Edge Function com service_role,
-- portanto não é necessária política anônima aqui.
