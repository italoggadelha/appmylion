import { supabase, SUPABASE_PRONTO } from './supabase'
import type { Cliente, Membro, Tarefa, Aprovacao } from './types'
import * as mock from '@/data/mock'

// ═══════════════════════════════════════════════════════════════════
// Camada de dados. Com Supabase configurado lê do banco (schema rugido);
// sem ele, devolve os dados de demonstração.
// ═══════════════════════════════════════════════════════════════════

// ── Mapeadores snake_case (banco) → camelCase (app) ─────────────────
const mapMembro = (r: any): Membro => ({
  id: r.id,
  nome: r.nome,
  email: r.email,
  perfil: r.perfil,
  cargo: r.cargo ?? undefined,
  avatarUrl: r.avatar_url ?? undefined,
})

const mapCliente = (r: any, nomes: Map<string, string>): Cliente => ({
  id: r.id,
  nome: r.nome,
  empresa: r.empresa,
  segmento: r.segmento ?? '',
  status: r.status,
  faseAtual: r.fase_atual,
  plano: r.plano ?? '',
  ticket: Number(r.ticket ?? 0),
  receitaGerada: Number(r.receita_gerada ?? 0),
  dataEntrada: r.data_entrada,
  responsavelId: r.responsavel_id ?? '',
  responsavelNome: nomes.get(r.responsavel_id) ?? '—',
  healthScore: r.health_score ?? 50,
  logoUrl: r.logo_url ?? undefined,
  observacoes: r.observacoes ?? undefined,
})

const mapTarefa = (r: any, nomes: Map<string, string>): Tarefa => ({
  id: r.id,
  clienteId: r.cliente_id,
  fase: r.fase,
  titulo: r.titulo,
  descricao: r.descricao ?? undefined,
  status: r.status,
  prioridade: r.prioridade,
  responsavelId: r.responsavel_id ?? undefined,
  responsavelNome: r.responsavel_id ? nomes.get(r.responsavel_id) : undefined,
  prazo: r.prazo ?? undefined,
  subtarefas: (r.subtarefas ?? [])
    .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((s: any) => ({ id: s.id, titulo: s.titulo, concluida: s.concluida })),
  precisaAprovacao: !!r.precisa_aprovacao,
  comentarios: 0,
  anexos: 0,
  criadaEm: r.criado_em,
})

const mapAprovacao = (r: any): Aprovacao => ({
  id: r.id,
  clienteId: r.cliente_id,
  tarefaId: r.tarefa_id ?? undefined,
  titulo: r.titulo,
  tipo: r.tipo,
  status: r.status,
  enviadaEm: r.enviada_em,
  token: r.token,
  feedback: r.feedback ?? undefined,
})

// ── Snapshot completo carregado após o login ────────────────────────
export interface Snapshot {
  membros: Membro[]
  clientes: Cliente[]
  tarefas: Tarefa[]
  aprovacoes: Aprovacao[]
}

export async function carregarTudo(): Promise<Snapshot> {
  if (!SUPABASE_PRONTO) {
    return {
      membros: mock.EQUIPE,
      clientes: mock.CLIENTES,
      tarefas: mock.TAREFAS,
      aprovacoes: mock.APROVACOES,
    }
  }

  const [mRes, cRes, tRes, aRes] = await Promise.all([
    supabase.from('membros').select('*').order('email'),
    supabase.from('clientes').select('*').order('empresa'),
    supabase.from('tarefas').select('*, subtarefas(*)').order('ordem'),
    supabase.from('aprovacoes').select('*').order('enviada_em', { ascending: false }),
  ])

  const erro = mRes.error || cRes.error || tRes.error || aRes.error
  if (erro) throw erro

  const membros = (mRes.data ?? []).map(mapMembro)
  const nomes = new Map(membros.map((m) => [m.id, m.nome]))

  return {
    membros,
    clientes: (cRes.data ?? []).map((r) => mapCliente(r, nomes)),
    tarefas: (tRes.data ?? []).map((r) => mapTarefa(r, nomes)),
    aprovacoes: (aRes.data ?? []).map(mapAprovacao),
  }
}

// ── Mutações ────────────────────────────────────────────────────────
export async function atualizarStatusTarefa(id: string, status: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('tarefas')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function atualizarFaseTarefa(id: string, fase: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('tarefas')
    .update({ fase })
    .eq('id', id)
  if (error) throw error
}

export async function criarCliente(c: Partial<Cliente>) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: c.nome,
      empresa: c.empresa,
      segmento: c.segmento,
      status: c.status ?? 'onboarding',
      fase_atual: c.faseAtual ?? 'raiox',
      plano: c.plano,
      ticket: c.ticket ?? 0,
      responsavel_id: c.responsavelId || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
