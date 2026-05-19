import type { FaseId, TarefaStatus, Prioridade, Perfil } from '@/data/rugido'

export interface Membro {
  id: string
  nome: string
  email: string
  perfil: Perfil
  avatarUrl?: string
  cargo?: string
}

export type ClienteStatus = 'ativo' | 'pausado' | 'finalizado' | 'onboarding'

export interface Cliente {
  id: string
  nome: string
  empresa: string
  segmento: string
  status: ClienteStatus
  faseAtual: FaseId
  plano: string
  ticket: number // mensalidade R$
  receitaGerada: number
  dataEntrada: string // ISO
  responsavelId: string
  responsavelNome: string
  healthScore: number // 0-100
  logoUrl?: string
  observacoes?: string
}

export interface Subtarefa {
  id: string
  titulo: string
  concluida: boolean
}

export interface Tarefa {
  id: string
  clienteId: string
  fase: FaseId
  titulo: string
  descricao?: string
  status: TarefaStatus
  prioridade: Prioridade
  responsavelId?: string
  responsavelNome?: string
  prazo?: string // ISO
  subtarefas: Subtarefa[]
  precisaAprovacao: boolean
  comentarios: number
  anexos: number
  criadaEm: string
}

export type AprovacaoStatus = 'pendente' | 'aprovado' | 'reprovado' | 'ajustes'

export interface Aprovacao {
  id: string
  clienteId: string
  tarefaId?: string
  titulo: string
  tipo: string // arte, copy, video, pagina...
  status: AprovacaoStatus
  enviadaEm: string
  token: string
  feedback?: string
}
