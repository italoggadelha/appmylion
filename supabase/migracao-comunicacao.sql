-- ═══════════════════════════════════════════════════════════════════
-- RUGIDO OS — módulo de Comunicação (chat interno + WhatsApp)
-- ═══════════════════════════════════════════════════════════════════
set search_path to rugido, public;

-- ── Conexão WhatsApp (estado único) ─────────────────────────────────
create table if not exists rugido.wpp_conexao (
  id          int primary key default 1,
  status      text not null default 'desconectado',  -- desconectado|conectando|conectado
  numero      text,
  nome_conta  text,
  ultima_sync timestamptz,
  atualizado_em timestamptz not null default now()
);
insert into rugido.wpp_conexao (id) values (1) on conflict (id) do nothing;

-- ── Conversas ───────────────────────────────────────────────────────
create table if not exists rugido.conversas (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references rugido.clientes(id) on delete set null,
  titulo      text,
  tipo        text not null default 'cliente',   -- cliente|grupo|interno
  canal       text not null default 'interno',   -- interno|whatsapp
  status      text not null default 'em_atendimento',
  ultima_msg  text,
  ultima_em   timestamptz not null default now(),
  criado_em   timestamptz not null default now()
);

-- ── Mensagens ───────────────────────────────────────────────────────
create table if not exists rugido.mensagens (
  id          uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references rugido.conversas(id) on delete cascade,
  autor_id    uuid references rugido.membros(id) on delete set null,
  autor_nome  text not null,
  autor_funcao text,
  do_cliente  boolean not null default false,
  tipo        text not null default 'texto',     -- texto|audio|imagem|pdf|documento
  conteudo    text,
  url         text,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_msg_conversa on rugido.mensagens(conversa_id);

-- ── Notificações configuráveis ──────────────────────────────────────
create table if not exists rugido.notif_config (
  id          uuid primary key default gen_random_uuid(),
  chave       text unique not null,
  nome        text not null,
  gatilho     text not null,
  canal_whatsapp boolean not null default false,
  canal_email    boolean not null default false,
  canal_interno  boolean not null default true,
  mensagem    text,
  ativa       boolean not null default true,
  custom      boolean not null default false,
  criado_em   timestamptz not null default now()
);
insert into rugido.notif_config (chave, nome, gatilho) values
 ('novo_cliente','Novo cliente','Cliente cadastrado'),
 ('novo_projeto','Novo projeto','Projeto criado'),
 ('projeto_atrasado','Projeto atrasado','Tarefa vencida'),
 ('nova_mensagem','Nova mensagem','Mensagem recebida'),
 ('novo_pagamento','Novo pagamento','Pagamento registrado'),
 ('reuniao_criada','Reunião criada','Reunião agendada'),
 ('arquivo_enviado','Arquivo enviado','Anexo adicionado'),
 ('projeto_concluido','Projeto concluído','Cliente na fase Escala'),
 ('cliente_respondeu','Cliente respondeu','Cliente respondeu mensagem'),
 ('tarefa_atrasada','Tarefa atrasada','Tarefa passou do prazo'),
 ('aprovacao_pendente','Aprovação pendente','Aprovação aguardando')
on conflict (chave) do nothing;

-- ── RLS + grants ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['wpp_conexao','conversas','mensagens','notif_config']
  loop
    execute format('alter table rugido.%I enable row level security;', t);
    execute format('drop policy if exists equipe_all on rugido.%I;', t);
    execute format('create policy equipe_all on rugido.%I using (rugido.eh_equipe()) with check (rugido.eh_equipe());', t);
    execute format('grant all on rugido.%I to authenticated, service_role;', t);
    execute format('grant select on rugido.%I to anon;', t);
  end loop;
end $$;

-- ── Realtime ────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table rugido.mensagens;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table rugido.conversas;
exception when duplicate_object then null; end $$;

select 'comunicacao ok · notif: '||count(*) from rugido.notif_config;
