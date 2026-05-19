-- ═══════════════════════════════════════════════════════════════════
-- RUGIDO OS — seed inicial (equipe + clientes + tarefas geradas)
-- Roda depois de schema.sql. Idempotente: limpa antes de inserir.
-- ═══════════════════════════════════════════════════════════════════
set search_path to rugido, public;

truncate rugido.subtarefas, rugido.aprovacoes, rugido.comentarios,
         rugido.fase_historico, rugido.tarefas, rugido.clientes,
         rugido.membros restart identity cascade;

-- ── Equipe ──────────────────────────────────────────────────────────
insert into rugido.membros (id, nome, email, perfil, cargo) values
 ('00000000-0000-0000-0000-0000000000e1'::uuid,'Italo Gadelha','italo@mylion.com.br','ceo','CEO'),
 ('00000000-0000-0000-0000-0000000000e2'::uuid,'Camila Louback','camila@mylion.com.br','gestor','Head de Operações'),
 ('00000000-0000-0000-0000-0000000000e3'::uuid,'Rafael Souza','rafael@mylion.com.br','coordenador','Coord. de Tráfego'),
 ('00000000-0000-0000-0000-0000000000e4'::uuid,'Bianca Reis','bianca@mylion.com.br','operacional','Designer'),
 ('00000000-0000-0000-0000-0000000000e5'::uuid,'Lucas Martins','lucas@mylion.com.br','operacional','Copywriter'),
 ('00000000-0000-0000-0000-0000000000e6'::uuid,'Júlia Nunes','julia@mylion.com.br','freelancer','Web Designer');

-- ── Clientes ────────────────────────────────────────────────────────
insert into rugido.clientes
 (id, nome, empresa, segmento, status, fase_atual, plano, ticket, receita_gerada, data_entrada, responsavel_id, health_score) values
 ('00000000-0000-0000-0000-0000000000c1'::uuid,'Dr. Henrique Alves','Clínica Vitalis','Saúde / Odontologia','ativo','demanda','Escala',6500,39000,'2025-12-02','00000000-0000-0000-0000-0000000000e3'::uuid,86),
 ('00000000-0000-0000-0000-0000000000c2'::uuid,'Marina Costa','Studio MC Arquitetura','Arquitetura','ativo','impl','Performance',4200,16800,'2026-01-20','00000000-0000-0000-0000-0000000000e2'::uuid,72),
 ('00000000-0000-0000-0000-0000000000c3'::uuid,'Construtora Horizonte','Horizonte Engenharia','Construção Civil','ativo','gameplan','Escala',8900,17800,'2026-03-10','00000000-0000-0000-0000-0000000000e2'::uuid,64),
 ('00000000-0000-0000-0000-0000000000c4'::uuid,'Fernanda Lima','FL Estética Avançada','Estética','ativo','ultra','Performance',3800,7600,'2026-04-05','00000000-0000-0000-0000-0000000000e3'::uuid,58),
 ('00000000-0000-0000-0000-0000000000c5'::uuid,'AutoForce Veículos','AutoForce','Automotivo','onboarding','raiox','Escala',7400,0,'2026-05-12','00000000-0000-0000-0000-0000000000e2'::uuid,50),
 ('00000000-0000-0000-0000-0000000000c6'::uuid,'Pedro Bastos','Bastos Advocacia','Jurídico','ativo','escala','Escala',5600,67200,'2025-08-15','00000000-0000-0000-0000-0000000000e3'::uuid,91),
 ('00000000-0000-0000-0000-0000000000c7'::uuid,'Espaço Zen','Espaço Zen Wellness','Bem-estar','pausado','demanda','Performance',3200,22400,'2025-10-01','00000000-0000-0000-0000-0000000000e2'::uuid,41),
 ('00000000-0000-0000-0000-0000000000c8'::uuid,'TechParts Distribuidora','TechParts','E-commerce / B2B','ativo','impl','Escala',9800,29400,'2026-02-18','00000000-0000-0000-0000-0000000000e3'::uuid,78);

-- ── Tarefas geradas a partir dos templates de cada fase ─────────────
do $$
declare
  fases   text[]  := array['raiox','ultra','gameplan','impl','demanda','escala'];
  membros uuid[];
  cli     record;
  fidx    int;
  cur_idx int;
  titulos text[];
  tit     text;
  ti      int;
  n       int := 0;
  st      rugido.tarefa_status;
  novo_id uuid;
  prios   rugido.prioridade[] := array['baixa','media','alta','critica'];
  statuses rugido.tarefa_status[] :=
    array['a_fazer','fazendo','aguardando_cliente','aguardando_aprovacao','concluida','travada'];
begin
  select array_agg(id order by email) into membros from rugido.membros;

  for cli in select * from rugido.clientes loop
    cur_idx := array_position(fases, cli.fase_atual::text);
    for fidx in 1..cur_idx loop
      titulos := case fases[fidx]
        when 'raiox'    then array['Onboarding do cliente','Coleta de acessos','Formulários de entrada','Reunião de Kickoff','Inventário digital','Coleta de ativos']
        when 'ultra'    then array['Definição de ICP','Avatar / Persona','Posicionamento','Análise de concorrência','Diagnóstico estratégico','Proposta de valor']
        when 'gameplan' then array['Desenho do funil','Arquitetura de conversão','Jornada do cliente','Canais de aquisição','Estratégia de conteúdo','Plano de tráfego']
        when 'impl'     then array['Landing pages','Site institucional','Configuração de CRM','Integrações','Copy','Design']
        when 'demanda'  then array['Campanhas','Criativos','Reels','Conteúdo','Calendário editorial','Gestão de tráfego']
        else                 array['Relatórios','Análise de KPIs','Otimização de ROAS','Testes A/B','Análise de funil','Expansão']
      end;
      ti := 0;
      foreach tit in array titulos loop
        n := n + 1; ti := ti + 1;
        if fidx < cur_idx then st := 'concluida';
        else st := statuses[1 + ((n + ti) % 6)]; end if;
        novo_id := gen_random_uuid();
        insert into rugido.tarefas
          (id, cliente_id, fase, titulo, status, prioridade, responsavel_id, prazo, precisa_aprovacao, ordem, concluido_em)
        values
          (novo_id, cli.id, fases[fidx]::rugido.fase, tit, st,
           prios[1 + ((n + ti) % 4)],
           membros[1 + (n % array_length(membros,1))],
           current_date + ((ti % 5) - 2),
           (ti % 3 = 1), ti,
           case when st = 'concluida' then now() else null end);
        insert into rugido.subtarefas (tarefa_id, titulo, concluida, ordem) values
          (novo_id,'Briefing', true, 1),
          (novo_id,'Execução', st='concluida', 2),
          (novo_id,'Revisão interna', st='concluida', 3);
      end loop;
    end loop;
  end loop;
end $$;

-- ── Aprovações de exemplo ───────────────────────────────────────────
insert into rugido.aprovacoes (cliente_id, titulo, tipo, status, feedback) values
 ('00000000-0000-0000-0000-0000000000c1'::uuid,'Criativo — Campanha Implantes Maio','arte','pendente',null),
 ('00000000-0000-0000-0000-0000000000c2'::uuid,'Landing Page — Projetos Residenciais','pagina','ajustes','Trocar a foto da dobra principal.'),
 ('00000000-0000-0000-0000-0000000000c6'::uuid,'Copy — Sequência de e-mails','copy','aprovado',null),
 ('00000000-0000-0000-0000-0000000000c8'::uuid,'Vídeo institucional — 30s','video','pendente',null),
 ('00000000-0000-0000-0000-0000000000c1'::uuid,'Posts — Calendário semana 21','post','reprovado','Tom muito informal para a clínica.');

select 'membros: '||count(*) from rugido.membros;
select 'clientes: '||count(*) from rugido.clientes;
select 'tarefas: '||count(*) from rugido.tarefas;
