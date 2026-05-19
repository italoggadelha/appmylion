-- ═══════════════════════════════════════════════════════════════════
-- RUGIDO OS — formulários para o cliente (raio-x / descoberta)
-- + plano estratégico gerado por IA.
-- ═══════════════════════════════════════════════════════════════════
set search_path to rugido, public;

-- Modelos de formulário (a equipe monta)
create table if not exists rugido.formularios (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  descricao  text,
  campos     jsonb not null default '[]'::jsonb,  -- [{id,label,tipo,opcoes}]
  criado_em  timestamptz not null default now()
);

-- Envios: um formulário entregue a um cliente
create table if not exists rugido.formulario_respostas (
  id            uuid primary key default gen_random_uuid(),
  formulario_id uuid not null references rugido.formularios(id) on delete cascade,
  cliente_id    uuid not null references rugido.clientes(id) on delete cascade,
  token         text unique not null
                default 'form-' || left(replace(gen_random_uuid()::text,'-',''),12),
  status        text not null default 'pendente',  -- pendente | respondido
  respostas     jsonb not null default '{}'::jsonb,
  plano         text,
  plano_confirmado boolean not null default false,
  respondido_em timestamptz,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_form_resp_cliente on rugido.formulario_respostas(cliente_id);

-- Modelo padrão: Raio-X / Descoberta
insert into rugido.formularios (nome, descricao, campos)
select 'Raio-X / Descoberta',
  'Formulário inicial de mapeamento do cliente — base para o plano estratégico.',
  '[
    {"id":"negocio","label":"Descreva seu negócio e há quanto tempo ele existe","tipo":"textarea"},
    {"id":"oferta","label":"Quais produtos/serviços você vende e seus preços?","tipo":"textarea"},
    {"id":"icp","label":"Quem é o seu cliente ideal?","tipo":"textarea"},
    {"id":"desafio","label":"Qual o seu maior desafio hoje em marketing e vendas?","tipo":"textarea"},
    {"id":"faturamento","label":"Quanto fatura por mês e qual a sua meta?","tipo":"texto"},
    {"id":"canais","label":"Quais canais você já usa (Instagram, Google, indicação...)?","tipo":"texto"},
    {"id":"concorrentes","label":"Quem são seus principais concorrentes?","tipo":"textarea"},
    {"id":"diferencial","label":"Qual é o seu diferencial?","tipo":"textarea"},
    {"id":"expectativa","label":"O que você espera da agência nos próximos 90 dias?","tipo":"textarea"},
    {"id":"materiais","label":"Você já tem logo, fotos e vídeos da marca?","tipo":"texto"}
  ]'::jsonb
where not exists (select 1 from rugido.formularios);

-- RLS + grants
do $$
declare t text;
begin
  foreach t in array array['formularios','formulario_respostas']
  loop
    execute format('alter table rugido.%I enable row level security;', t);
    execute format('drop policy if exists equipe_all on rugido.%I;', t);
    execute format('create policy equipe_all on rugido.%I using (rugido.eh_equipe()) with check (rugido.eh_equipe());', t);
    execute format('grant all on rugido.%I to authenticated, service_role;', t);
    execute format('grant select on rugido.%I to anon;', t);
  end loop;
end $$;

select 'formularios: '||count(*) from rugido.formularios;
