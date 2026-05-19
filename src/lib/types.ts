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
  driveUrl?: string
  mesesContrato?: number
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
  tempoGastoSeg: number
  tempoEstimadoMin?: number
  iniciadaEm?: string | null
  pontos: number
  funcao?: string | null
  avulsa?: boolean
  aprovacao?: string
}

export interface Conversa {
  id: string
  clienteId?: string
  titulo?: string
  tipo: 'cliente' | 'grupo' | 'interno'
  canal: 'interno' | 'whatsapp'
  status: string
  ultimaMsg?: string
  ultimaEm: string
}

export interface Mensagem {
  id: string
  conversaId: string
  autorId?: string
  autorNome: string
  autorFuncao?: string
  doCliente: boolean
  tipo: string
  conteudo?: string
  url?: string
  criadoEm: string
}

export interface WppConexao {
  status: 'desconectado' | 'conectando' | 'conectado'
  numero?: string
  nomeConta?: string
  ultimaSync?: string
}

export interface NotifConfig {
  id: string
  chave: string
  nome: string
  gatilho: string
  canalWhatsapp: boolean
  canalEmail: boolean
  canalInterno: boolean
  mensagem?: string
  ativa: boolean
  custom: boolean
}

export interface Documento {
  id: string
  clienteId: string
  nome: string
  tipo: string
  conteudo?: string
  criadoEm: string
}

export type AprovacaoStatus = 'pendente' | 'aprovado' | 'reprovado' | 'ajustes'

export interface StatusTarefa {
  id: string
  chave: string
  nome: string
  cor: string
  ordem: number
  ativo: boolean
}

export interface FaseConfig {
  fase: FaseId
  nome: string
  subtitulo?: string
  descricao?: string
  cor: string
  simbolo: string
  ordem: number
}

export interface TarefaTemplate {
  id: string
  fase: FaseId
  titulo: string
  ordem: number
  funcao?: string | null
  aprovacao?: string
}

export type AnexoCategoria = 'aprovacao' | 'ideia' | 'apoio'
export type AnexoTipo = 'texto' | 'link' | 'arquivo' | 'imagem' | 'html' | 'video'

export interface Anexo {
  id: string
  tarefaId: string
  categoria: AnexoCategoria
  tipo: AnexoTipo
  titulo: string
  conteudo?: string
  aprovado?: boolean
  criadoEm: string
}

export interface AgenteExterno {
  id: string
  nome: string
  descricao?: string
  webhookUrl: string
}

export interface PerfilAcesso {
  id: string
  chave: string
  nome: string
  permissoes: Record<string, boolean>
  ordem: number
}

export interface Automacao {
  id: string
  chave: string
  nome: string
  descricao?: string
  gatilho: string
  acao?: string
  ativa: boolean
  custom?: boolean
  execucoes: number
}

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
  solicitadoPor?: string
  solicitanteNome?: string
}
