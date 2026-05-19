-- ═══════════════════════════════════════════════════════════════════
-- RUGIDO OS — migração: cronômetro, pontuação (gamificação),
-- solicitante de aprovação.
-- ═══════════════════════════════════════════════════════════════════
set search_path to rugido, public;

-- ── Tarefas: tempo + pontos ─────────────────────────────────────────
alter table rugido.tarefas
  add column if not exists tempo_gasto_seg   int not null default 0,
  add column if not exists tempo_estimado_min int,
  add column if not exists iniciada_em       timestamptz,
  add column if not exists pontos            int not null default 0;

-- ── Aprovações: quem solicitou ──────────────────────────────────────
alter table rugido.aprovacoes
  add column if not exists solicitado_por uuid references rugido.membros(id);

-- ── Backfill: pontos para tarefas já concluídas ─────────────────────
-- Fórmula: 10 pontos por tarefa + 5 por hora de execução registrada.
update rugido.tarefas
set pontos = 10 + round(tempo_gasto_seg / 3600.0 * 5)
where status = 'concluida' and pontos = 0;

select 'tarefas concluídas com pontos: '||count(*)
from rugido.tarefas where status = 'concluida';
