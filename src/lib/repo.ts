import { supabase, SUPABASE_PRONTO } from './supabase'
import type {
  Cliente,
  Membro,
  Tarefa,
  Aprovacao,
  Automacao,
  StatusTarefa,
  FaseConfig,
  TarefaTemplate,
  Anexo,
  PerfilAcesso,
  AgenteExterno,
} from './types'
import { FASES_RUGIDO, type FaseId } from '@/data/rugido'
import * as mock from '@/data/mock'

// Status padrão (fallback quando sem backend)
const STATUS_PADRAO: StatusTarefa[] = [
  { id: '1', chave: 'a_fazer', nome: 'A fazer', cor: '#4a4a57', ordem: 1, ativo: true },
  { id: '2', chave: 'fazendo', nome: 'Em execução', cor: '#5b8def', ordem: 2, ativo: true },
  { id: '3', chave: 'aguardando_cliente', nome: 'Aguardando cliente', cor: '#f59e0b', ordem: 3, ativo: true },
  { id: '4', chave: 'aguardando_aprovacao', nome: 'Aguardando aprovação', cor: '#8b5cf6', ordem: 4, ativo: true },
  { id: '5', chave: 'concluida', nome: 'Concluída', cor: '#10b981', ordem: 5, ativo: true },
  { id: '6', chave: 'travada', nome: 'Travada', cor: '#ef4444', ordem: 6, ativo: true },
]
const FASES_PADRAO: FaseConfig[] = FASES_RUGIDO.map((f) => ({
  fase: f.id,
  nome: f.nome,
  subtitulo: f.subtitulo,
  descricao: f.descricao,
  cor: f.cor,
  simbolo: f.simbolo,
  ordem: f.numero,
}))

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
  driveUrl: r.drive_url ?? undefined,
  mesesContrato: r.meses_contrato ?? undefined,
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
  tempoGastoSeg: r.tempo_gasto_seg ?? 0,
  tempoEstimadoMin: r.tempo_estimado_min ?? undefined,
  iniciadaEm: r.iniciada_em ?? null,
  pontos: r.pontos ?? 0,
  funcao: r.funcao ?? null,
  avulsa: !!r.avulsa,
  aprovacao: r.aprovacao ?? 'nenhum',
})

const mapAprovacao = (r: any, nomes: Map<string, string>): Aprovacao => ({
  id: r.id,
  clienteId: r.cliente_id,
  tarefaId: r.tarefa_id ?? undefined,
  titulo: r.titulo,
  tipo: r.tipo,
  status: r.status,
  enviadaEm: r.enviada_em,
  token: r.token,
  feedback: r.feedback ?? undefined,
  solicitadoPor: r.solicitado_por ?? undefined,
  solicitanteNome: r.solicitado_por ? nomes.get(r.solicitado_por) : undefined,
})

// ── Snapshot completo carregado após o login ────────────────────────
export interface Snapshot {
  membros: Membro[]
  clientes: Cliente[]
  tarefas: Tarefa[]
  aprovacoes: Aprovacao[]
  automacoes: Automacao[]
  status: StatusTarefa[]
  fases: FaseConfig[]
  templates: TarefaTemplate[]
  perfis: PerfilAcesso[]
  agentesExternos: AgenteExterno[]
}

export async function carregarTudo(): Promise<Snapshot> {
  if (!SUPABASE_PRONTO) {
    return {
      membros: mock.EQUIPE,
      clientes: mock.CLIENTES,
      tarefas: mock.TAREFAS,
      aprovacoes: mock.APROVACOES,
      automacoes: [],
      status: STATUS_PADRAO,
      fases: FASES_PADRAO,
      templates: [],
      perfis: [],
      agentesExternos: [],
    }
  }

  const [mRes, cRes, tRes, aRes, auRes, sRes, fRes, tpRes, pRes, agRes] =
    await Promise.all([
      supabase.from('membros').select('*').order('email'),
      supabase.from('clientes').select('*').order('empresa'),
      supabase.from('tarefas').select('*, subtarefas(*)').order('ordem'),
      supabase.from('aprovacoes').select('*').order('enviada_em', { ascending: false }),
      supabase.from('automacoes').select('*').order('criado_em'),
      supabase.from('status_tarefa').select('*').order('ordem'),
      supabase.from('fase_config').select('*').order('ordem'),
      supabase.from('tarefa_templates').select('*').order('ordem'),
      supabase.from('perfis_acesso').select('*').order('ordem'),
      supabase.from('agentes_externos').select('*').order('criado_em'),
    ])

  const erro =
    mRes.error || cRes.error || tRes.error || aRes.error || auRes.error ||
    sRes.error || fRes.error || tpRes.error || pRes.error || agRes.error
  if (erro) throw erro

  const membros = (mRes.data ?? []).map(mapMembro)
  const nomes = new Map(membros.map((m) => [m.id, m.nome]))

  return {
    membros,
    clientes: (cRes.data ?? []).map((r) => mapCliente(r, nomes)),
    tarefas: (tRes.data ?? []).map((r) => mapTarefa(r, nomes)),
    aprovacoes: (aRes.data ?? []).map((r) => mapAprovacao(r, nomes)),
    automacoes: (auRes.data ?? []) as Automacao[],
    status: ((sRes.data ?? []) as StatusTarefa[]).length
      ? (sRes.data as StatusTarefa[])
      : STATUS_PADRAO,
    fases: ((fRes.data ?? []) as FaseConfig[]).length
      ? (fRes.data as FaseConfig[])
      : FASES_PADRAO,
    templates: (tpRes.data ?? []) as TarefaTemplate[],
    perfis: (pRes.data ?? []) as PerfilAcesso[],
    agentesExternos: (agRes.data ?? []).map((r: any) => ({
      id: r.id,
      nome: r.nome,
      descricao: r.descricao ?? undefined,
      webhookUrl: r.webhook_url,
    })),
  }
}

// ── Agentes externos (webhooks conectados às tarefas) ───────────────
export async function salvarAgenteExterno(
  a: { id?: string; nome: string; descricao?: string; webhookUrl: string },
) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const campos = {
    nome: a.nome,
    descricao: a.descricao ?? null,
    webhook_url: a.webhookUrl,
  }
  if (a.id) {
    const { error } = await supabase
      .from('agentes_externos')
      .update(campos)
      .eq('id', a.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('agentes_externos').insert(campos)
    if (error) throw error
  }
}

export async function excluirAgenteExterno(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('agentes_externos').delete().eq('id', id)
  if (error) throw error
}

export async function executarAgenteIA(p: {
  agente: string
  papel: string
  clienteId?: string
  mensagem: string
}) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.functions.invoke('agente-ia', {
    body: p,
  })
  if (error) throw error
  return data as { resposta?: string; erro?: string }
}

export async function executarAgente(tarefaId: string, agenteId: string) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.functions.invoke('executar-agente', {
    body: { tarefaId, agenteId },
  })
  if (error) throw error
  return data as { ok?: boolean; erro?: string; detalhe?: any }
}

export async function aprovarAnexo(id: string, aprovado: boolean) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('anexos')
    .update({ aprovado })
    .eq('id', id)
  if (error) throw error
}

export async function getAnexo(id: string): Promise<Anexo | null> {
  if (!SUPABASE_PRONTO) return null
  const { data } = await supabase.from('anexos').select('*').eq('id', id).maybeSingle()
  return data ? mapAnexo(data) : null
}

export async function salvarPerfil(
  p: { id?: string; chave?: string; nome: string; permissoes: Record<string, boolean> },
) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  if (p.id) {
    const { error } = await supabase
      .from('perfis_acesso')
      .update({ nome: p.nome, permissoes: p.permissoes })
      .eq('id', p.id)
    if (error) throw error
  } else {
    const chave =
      'perfil_' +
      p.nome.toLowerCase().normalize('NFD').replace(/[^\w]/g, '_').slice(0, 24)
    const { error } = await supabase
      .from('perfis_acesso')
      .insert({ chave, nome: p.nome, permissoes: p.permissoes, ordem: 99 })
    if (error) throw error
  }
}

export async function excluirPerfil(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('perfis_acesso').delete().eq('id', id)
  if (error) throw error
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

export async function criarTarefa(t: Partial<Tarefa>) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase
    .from('tarefas')
    .insert({
      cliente_id: t.clienteId || null,
      fase: t.fase,
      titulo: t.titulo,
      descricao: t.descricao || null,
      status: t.status ?? 'a_fazer',
      prioridade: t.prioridade ?? 'media',
      responsavel_id: t.responsavelId || null,
      prazo: t.prazo || null,
      precisa_aprovacao: !!t.precisaAprovacao,
      funcao: t.funcao ?? null,
      avulsa: t.avulsa ?? false,
      aprovacao: t.aprovacao ?? 'nenhum',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function atualizarTarefa(id: string, t: Partial<Tarefa>) {
  if (!SUPABASE_PRONTO) return
  const campos: Record<string, unknown> = {}
  if (t.titulo !== undefined) campos.titulo = t.titulo
  if (t.descricao !== undefined) campos.descricao = t.descricao || null
  if (t.fase !== undefined) campos.fase = t.fase
  if (t.status !== undefined) {
    campos.status = t.status
    campos.concluido_em = t.status === 'concluida' ? new Date().toISOString() : null
  }
  if (t.prioridade !== undefined) campos.prioridade = t.prioridade
  if (t.responsavelId !== undefined) campos.responsavel_id = t.responsavelId || null
  if (t.prazo !== undefined) campos.prazo = t.prazo || null
  if (t.precisaAprovacao !== undefined) campos.precisa_aprovacao = t.precisaAprovacao
  if (t.funcao !== undefined) campos.funcao = t.funcao || null
  if (t.aprovacao !== undefined) campos.aprovacao = t.aprovacao
  const { error } = await supabase.from('tarefas').update(campos).eq('id', id)
  if (error) throw error
}

// ── Cronômetro de tarefa ────────────────────────────────────────────
export async function iniciarTarefa(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('tarefas')
    .update({ iniciada_em: new Date().toISOString(), status: 'fazendo' })
    .eq('id', id)
  if (error) throw error
}

export async function pararTarefa(id: string, tempoTotalSeg: number) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('tarefas')
    .update({ iniciada_em: null, tempo_gasto_seg: tempoTotalSeg })
    .eq('id', id)
  if (error) throw error
}

export async function setTempoTarefa(id: string, seg: number) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('tarefas')
    .update({ tempo_gasto_seg: seg })
    .eq('id', id)
  if (error) throw error
}

export async function excluirTarefa(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('tarefas').delete().eq('id', id)
  if (error) throw error
}

export async function setSubtarefa(id: string, concluida: boolean) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('subtarefas')
    .update({ concluida })
    .eq('id', id)
  if (error) throw error
}

export async function criarAprovacao(a: {
  clienteId: string
  tarefaId?: string
  titulo: string
  tipo: string
  solicitadoPor?: string
}) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase
    .from('aprovacoes')
    .insert({
      cliente_id: a.clienteId,
      tarefa_id: a.tarefaId ?? null,
      titulo: a.titulo,
      tipo: a.tipo,
      solicitado_por: a.solicitadoPor ?? null,
    })
    .select('token')
    .single()
  if (error) throw error
  return data as { token: string }
}

// ── Documentos do cliente ───────────────────────────────────────────
export async function listarDocumentos(clienteId: string) {
  if (!SUPABASE_PRONTO) return []
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    clienteId: r.cliente_id,
    nome: r.nome,
    tipo: r.tipo,
    conteudo: r.conteudo ?? undefined,
    criadoEm: r.criado_em,
  }))
}

export async function criarDocumento(d: {
  clienteId: string
  nome: string
  tipo: string
  conteudo?: string
}) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { error } = await supabase.from('documentos').insert({
    cliente_id: d.clienteId,
    nome: d.nome,
    tipo: d.tipo,
    conteudo: d.conteudo ?? null,
  })
  if (error) throw error
}

export async function excluirDocumento(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('documentos').delete().eq('id', id)
  if (error) throw error
}

// ── Membros da equipe ───────────────────────────────────────────────
export async function atualizarMembro(
  id: string,
  campos: { nome?: string; cargo?: string; perfil?: string; avatarUrl?: string },
) {
  if (!SUPABASE_PRONTO) return
  const db: Record<string, unknown> = {}
  if (campos.nome !== undefined) db.nome = campos.nome
  if (campos.cargo !== undefined) db.cargo = campos.cargo || null
  if (campos.perfil !== undefined) db.perfil = campos.perfil
  if (campos.avatarUrl !== undefined) db.avatar_url = campos.avatarUrl || null
  const { error } = await supabase.from('membros').update(db).eq('id', id)
  if (error) throw error
}

export async function excluirMembro(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('membros').delete().eq('id', id)
  if (error) throw error
}

export async function gerarTarefasFase(clienteId: string, fase: FaseId) {
  if (!SUPABASE_PRONTO) return 0
  const { data: tpls } = await supabase
    .from('tarefa_templates')
    .select('id, titulo, ordem, funcao, aprovacao, subtarefa_templates(titulo, ordem)')
    .eq('fase', fase)
    .order('ordem')
  const lista = tpls ?? []
  if (!lista.length) return 0
  for (const tp of lista as any[]) {
    const { data: nova } = await supabase
      .from('tarefas')
      .insert({
        cliente_id: clienteId,
        fase,
        titulo: tp.titulo,
        status: 'a_fazer',
        prioridade: 'media',
        ordem: tp.ordem,
        funcao: tp.funcao ?? null,
        aprovacao: tp.aprovacao ?? 'nenhum',
      })
      .select('id')
      .single()
    const subs = tp.subtarefa_templates ?? []
    if (nova && subs.length) {
      await supabase.from('subtarefas').insert(
        subs.map((s: any, i: number) => ({
          tarefa_id: nova.id,
          titulo: s.titulo,
          concluida: false,
          ordem: s.ordem ?? i,
        })),
      )
    }
  }
  return lista.length
}

// ── Plano de conteúdo por contrato (3/6/9/12 meses) ─────────────────
export async function gerarPlanoConteudo(
  clienteId: string,
  meses: number,
): Promise<number> {
  if (!SUPABASE_PRONTO || !meses) return 0
  // evita duplicar
  const { data: existe } = await supabase
    .from('tarefas')
    .select('id')
    .eq('cliente_id', clienteId)
    .ilike('titulo', 'Plano de conteúdo — Mês%')
    .limit(1)
  if (existe && existe.length) return 0

  const linhas: any[] = []
  for (let m = 1; m <= meses; m++) {
    linhas.push(
      {
        cliente_id: clienteId, fase: 'demanda', status: 'a_fazer',
        prioridade: 'alta', ordem: m * 10,
        titulo: `Plano de conteúdo — Mês ${m}`, funcao: 'conteudo',
      },
      {
        cliente_id: clienteId, fase: 'demanda', status: 'a_fazer',
        prioridade: 'media', ordem: m * 10 + 1,
        titulo: `Criação de artes — Mês ${m}`, funcao: 'design',
      },
      {
        cliente_id: clienteId, fase: 'demanda', status: 'a_fazer',
        prioridade: 'media', ordem: m * 10 + 2,
        titulo: `Conteúdos para gravação — Mês ${m}`, funcao: 'conteudo',
      },
    )
  }
  const { error } = await supabase.from('tarefas').insert(linhas)
  if (error) throw error
  return linhas.length
}

// ── Anexos de tarefa ────────────────────────────────────────────────
const mapAnexo = (r: any): Anexo => ({
  id: r.id,
  tarefaId: r.tarefa_id,
  categoria: r.categoria,
  tipo: r.tipo,
  titulo: r.titulo,
  conteudo: r.conteudo ?? undefined,
  aprovado: !!r.aprovado,
  criadoEm: r.criado_em,
})

export async function listarAnexos(tarefaId: string): Promise<Anexo[]> {
  if (!SUPABASE_PRONTO) return []
  const { data, error } = await supabase
    .from('anexos')
    .select('*')
    .eq('tarefa_id', tarefaId)
    .order('criado_em')
  if (error) throw error
  return (data ?? []).map(mapAnexo)
}

export async function criarAnexo(a: Omit<Anexo, 'id' | 'criadoEm'>) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { error } = await supabase.from('anexos').insert({
    tarefa_id: a.tarefaId,
    categoria: a.categoria,
    tipo: a.tipo,
    titulo: a.titulo,
    conteudo: a.conteudo ?? null,
  })
  if (error) throw error
}

export async function excluirAnexo(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('anexos').delete().eq('id', id)
  if (error) throw error
}

export async function uploadArquivo(file: File): Promise<string> {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const nome = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`
  const { error } = await supabase.storage.from('anexos').upload(nome, file)
  if (error) throw error
  return supabase.storage.from('anexos').getPublicUrl(nome).data.publicUrl
}

// ── Status de tarefa ────────────────────────────────────────────────
export async function salvarStatus(s: Partial<StatusTarefa> & { id?: string }) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const campos = { chave: s.chave, nome: s.nome, cor: s.cor, ordem: s.ordem }
  if (s.id) {
    const { error } = await supabase
      .from('status_tarefa')
      .update({ nome: s.nome, cor: s.cor, ordem: s.ordem })
      .eq('id', s.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('status_tarefa').insert(campos)
    if (error) throw error
  }
}

export async function excluirStatus(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('status_tarefa').delete().eq('id', id)
  if (error) throw error
}

// ── Templates de fase ───────────────────────────────────────────────
export async function salvarTemplate(t: Partial<TarefaTemplate> & { id?: string }) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  if (t.id) {
    const { error } = await supabase
      .from('tarefa_templates')
      .update({
        titulo: t.titulo,
        fase: t.fase,
        ordem: t.ordem,
        funcao: t.funcao ?? null,
        aprovacao: t.aprovacao ?? 'nenhum',
      })
      .eq('id', t.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('tarefa_templates')
      .insert({
        titulo: t.titulo,
        fase: t.fase,
        ordem: t.ordem ?? 99,
        funcao: t.funcao ?? null,
        aprovacao: t.aprovacao ?? 'nenhum',
      })
    if (error) throw error
  }
}

export async function excluirTemplate(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('tarefa_templates').delete().eq('id', id)
  if (error) throw error
}

export async function moverTemplateFase(id: string, fase: FaseId) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('tarefa_templates')
    .update({ fase })
    .eq('id', id)
  if (error) throw error
}

// ── Relatório de tráfego pago ───────────────────────────────────────
export interface RelatorioTrafego {
  id: string
  clienteId: string
  token: string
  senha: string
  periodo: string
  publicado: boolean
  metricas: Record<string, any>
  metaToken?: string
  metaAdAccount?: string
}

export async function getRelatorioCliente(
  clienteId: string,
): Promise<RelatorioTrafego | null> {
  if (!SUPABASE_PRONTO) return null
  const { data } = await supabase
    .from('relatorios_trafego')
    .select('*')
    .eq('cliente_id', clienteId)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    clienteId: data.cliente_id,
    token: data.token,
    senha: data.senha,
    periodo: data.periodo,
    publicado: data.publicado,
    metricas: data.metricas ?? {},
    metaToken: data.meta_token ?? undefined,
    metaAdAccount: data.meta_ad_account ?? undefined,
  }
}

export async function sincronizarMeta(clienteId: string) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.functions.invoke('meta-insights', {
    body: { clienteId },
  })
  if (error) throw error
  return data as
    | { metricas: Record<string, any>; criativos: any[] }
    | { erro: string; detalhe?: string }
}

export async function salvarRelatorio(
  clienteId: string,
  campos: { senha?: string; periodo?: string; publicado?: boolean; metricas?: any },
): Promise<RelatorioTrafego> {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const existente = await getRelatorioCliente(clienteId)
  if (existente) {
    const { data, error } = await supabase
      .from('relatorios_trafego')
      .update({ ...campos, atualizado_em: new Date().toISOString() })
      .eq('id', existente.id)
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id, clienteId, token: data.token, senha: data.senha,
      periodo: data.periodo, publicado: data.publicado, metricas: data.metricas ?? {},
    }
  }
  const { data, error } = await supabase
    .from('relatorios_trafego')
    .insert({ cliente_id: clienteId, ...campos })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id, clienteId, token: data.token, senha: data.senha,
    periodo: data.periodo, publicado: data.publicado, metricas: data.metricas ?? {},
  }
}

// ── Formulários (raio-x / descoberta) ───────────────────────────────
export interface CampoForm {
  id: string
  label: string
  tipo: string // texto | textarea | opcao_unica | opcao_multipla
  opcoes?: string[]
}
export interface FormularioModelo {
  id: string
  nome: string
  descricao?: string
  campos: CampoForm[]
}
export interface RespostaForm {
  id: string
  formularioId: string
  formularioNome: string
  clienteId: string
  token: string
  status: string
  respostas: Record<string, any>
  tempos: Record<string, number>
  plano?: string
  planoConfirmado: boolean
  respondidoEm?: string
  criadoEm: string
}

export async function listarFormularios(): Promise<FormularioModelo[]> {
  if (!SUPABASE_PRONTO) return []
  const { data, error } = await supabase
    .from('formularios')
    .select('*')
    .order('criado_em')
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? undefined,
    campos: r.campos ?? [],
  }))
}

export async function listarRespostas(): Promise<RespostaForm[]> {
  if (!SUPABASE_PRONTO) return []
  const { data, error } = await supabase
    .from('formulario_respostas')
    .select('*, formularios(nome)')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    formularioId: r.formulario_id,
    formularioNome: r.formularios?.nome ?? 'Formulário',
    clienteId: r.cliente_id,
    token: r.token,
    status: r.status,
    respostas: r.respostas ?? {},
    tempos: r.tempos ?? {},
    plano: r.plano ?? undefined,
    planoConfirmado: r.plano_confirmado,
    respondidoEm: r.respondido_em ?? undefined,
    criadoEm: r.criado_em,
  }))
}

export async function criarEnvioFormulario(
  formularioId: string,
  clienteId: string,
): Promise<{ token: string }> {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const { data, error } = await supabase
    .from('formulario_respostas')
    .insert({ formulario_id: formularioId, cliente_id: clienteId })
    .select('token')
    .single()
  if (error) throw error
  return data as { token: string }
}

export async function confirmarPlano(respostaId: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('formulario_respostas')
    .update({ plano_confirmado: true })
    .eq('id', respostaId)
  if (error) throw error
}

export async function salvarFormulario(
  f: { id?: string; nome: string; descricao?: string; campos: CampoForm[] },
) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  if (f.id) {
    const { error } = await supabase
      .from('formularios')
      .update({ nome: f.nome, descricao: f.descricao, campos: f.campos })
      .eq('id', f.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('formularios')
      .insert({ nome: f.nome, descricao: f.descricao, campos: f.campos })
    if (error) throw error
  }
}

export async function salvarFaseConfig(f: FaseConfig) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('fase_config')
    .update({
      nome: f.nome,
      subtitulo: f.subtitulo,
      descricao: f.descricao,
      cor: f.cor,
      simbolo: f.simbolo,
    })
    .eq('fase', f.fase)
  if (error) throw error
}

export async function atualizarCliente(id: string, campos: Record<string, unknown>) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('clientes').update(campos).eq('id', id)
  if (error) throw error
}

export async function toggleAutomacao(id: string, ativa: boolean) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase
    .from('automacoes')
    .update({ ativa })
    .eq('id', id)
  if (error) throw error
}

export async function criarAutomacao(a: {
  nome: string
  descricao: string
  gatilho: string
  acao: string
}) {
  if (!SUPABASE_PRONTO) throw new Error('Supabase não configurado')
  const chave =
    'custom_' +
    a.nome.toLowerCase().normalize('NFD').replace(/[^\w]/g, '_').slice(0, 30) +
    '_' +
    Date.now().toString(36)
  const { error } = await supabase.from('automacoes').insert({
    chave,
    nome: a.nome,
    descricao: a.descricao,
    gatilho: a.gatilho,
    acao: a.acao,
    custom: true,
    ativa: true,
  })
  if (error) throw error
}

export async function excluirAutomacao(id: string) {
  if (!SUPABASE_PRONTO) return
  const { error } = await supabase.from('automacoes').delete().eq('id', id)
  if (error) throw error
}

export async function registrarExecucaoAutomacao(chave: string) {
  if (!SUPABASE_PRONTO) return
  const { data } = await supabase
    .from('automacoes')
    .select('id, execucoes')
    .eq('chave', chave)
    .maybeSingle()
  if (data) {
    await supabase
      .from('automacoes')
      .update({ execucoes: (data.execucoes ?? 0) + 1 })
      .eq('id', data.id)
  }
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
      logo_url: c.logoUrl || null,
      drive_url: c.driveUrl || null,
      meses_contrato: c.mesesContrato || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
