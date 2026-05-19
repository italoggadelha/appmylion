// ═══════════════════════════════════════════════════════════════════
// MÉTODO RUGIDO — definição das 6 fases e templates de tarefas
// ═══════════════════════════════════════════════════════════════════

export type FaseId =
  | 'raiox'
  | 'ultra'
  | 'gameplan'
  | 'impl'
  | 'demanda'
  | 'escala'

export interface FaseRugido {
  id: FaseId
  numero: number
  nome: string
  subtitulo: string
  cor: string // hex
  classe: string // tailwind text color
  simbolo: string // emoji/ícone representativo
  descricao: string
  tarefasPadrao: string[]
}

export const FASES_RUGIDO: FaseRugido[] = [
  {
    id: 'raiox',
    numero: 1,
    nome: 'Raio-X & Mapeamento',
    subtitulo: 'Entender o terreno',
    cor: '#5b8def',
    classe: 'text-fase-raiox',
    simbolo: '🔍',
    descricao:
      'Onboarding completo, coleta de acessos e ativos, diagnóstico inicial do cliente.',
    tarefasPadrao: [
      'Onboarding do cliente',
      'Coleta de acessos',
      'Formulários de entrada',
      'Reunião de Kickoff',
      'Inventário digital',
      'Coleta de ativos',
      'Diagnóstico inicial',
    ],
  },
  {
    id: 'ultra',
    numero: 2,
    nome: 'Ultravisão Estratégica',
    subtitulo: 'Enxergar além',
    cor: '#8b5cf6',
    classe: 'text-fase-ultra',
    simbolo: '🦅',
    descricao:
      'Definição de ICP, avatar, posicionamento e arquitetura estratégica.',
    tarefasPadrao: [
      'Definição de ICP',
      'Avatar / Persona',
      'Posicionamento',
      'Análise de concorrência',
      'Diagnóstico estratégico',
      'Tom de voz',
      'Proposta de valor',
      'Arquitetura estratégica',
    ],
  },
  {
    id: 'gameplan',
    numero: 3,
    nome: 'Game Plan Estratégico',
    subtitulo: 'O plano de guerra',
    cor: '#ec4899',
    classe: 'text-fase-gameplan',
    simbolo: '♟️',
    descricao:
      'Desenho de funil, jornada, canais, automações e plano de tráfego.',
    tarefasPadrao: [
      'Desenho do funil',
      'Arquitetura de conversão',
      'Definição de produtos',
      'Estratégia geral',
      'Jornada do cliente',
      'Estrutura de CRM',
      'Canais de aquisição',
      'Automações',
      'Estratégia de conteúdo',
      'Plano de tráfego',
    ],
  },
  {
    id: 'impl',
    numero: 4,
    nome: 'Implementação & Validação',
    subtitulo: 'Construir e testar',
    cor: '#f59e0b',
    classe: 'text-fase-impl',
    simbolo: '⚙️',
    descricao:
      'Construção de páginas, integrações, automações e validação com testes.',
    tarefasPadrao: [
      'Landing pages',
      'Site institucional',
      'Configuração de CRM',
      'Integrações',
      'Área de membros',
      'Checkout',
      'SEO local',
      'Google Meu Negócio',
      'Automações',
      'Copy',
      'Design',
      'Aprovação do cliente',
      'Testes',
    ],
  },
  {
    id: 'demanda',
    numero: 5,
    nome: 'Demanda & Alcance',
    subtitulo: 'Gerar movimento',
    cor: '#10b981',
    classe: 'text-fase-demanda',
    simbolo: '📡',
    descricao:
      'Campanhas, criativos, conteúdo e gestão de tráfego pago e orgânico.',
    tarefasPadrao: [
      'Campanhas',
      'Criativos',
      'Reels',
      'Conteúdo',
      'Google Ads',
      'Meta Ads',
      'Publicações',
      'Calendário editorial',
      'Gestão de social',
      'Gestão de tráfego',
    ],
  },
  {
    id: 'escala',
    numero: 6,
    nome: 'Otimização & Escala',
    subtitulo: 'Dominar o mercado',
    cor: '#ef4444',
    classe: 'text-fase-escala',
    simbolo: '🚀',
    descricao:
      'Relatórios, KPIs, testes A/B, otimização de funil e expansão.',
    tarefasPadrao: [
      'Relatórios',
      'Análise de KPIs',
      'Otimização de ROAS',
      'Otimização de CPL',
      'Escala de campanhas',
      'Testes A/B',
      'Análise de funil',
      'Hipóteses',
      'Implementação de melhorias',
      'Expansão',
    ],
  },
]

export const faseById = (id: FaseId): FaseRugido =>
  FASES_RUGIDO.find((f) => f.id === id)!

export const faseByNumero = (n: number): FaseRugido =>
  FASES_RUGIDO.find((f) => f.numero === n) ?? FASES_RUGIDO[0]

// Status possíveis de uma tarefa
export type TarefaStatus =
  | 'a_fazer'
  | 'fazendo'
  | 'aguardando_cliente'
  | 'aguardando_aprovacao'
  | 'concluida'
  | 'travada'

export const STATUS_LABEL: Record<TarefaStatus, string> = {
  a_fazer: 'A fazer',
  fazendo: 'Em execução',
  aguardando_cliente: 'Aguardando cliente',
  aguardando_aprovacao: 'Aguardando aprovação',
  concluida: 'Concluída',
  travada: 'Travada',
}

export const STATUS_COR: Record<TarefaStatus, string> = {
  a_fazer: '#4a4a57',
  fazendo: '#5b8def',
  aguardando_cliente: '#f59e0b',
  aguardando_aprovacao: '#8b5cf6',
  concluida: '#10b981',
  travada: '#ef4444',
}

export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica'

export const PRIORIDADE_COR: Record<Prioridade, string> = {
  baixa: '#4a4a57',
  media: '#5b8def',
  alta: '#f59e0b',
  critica: '#ef4444',
}

// Funções da equipe (níveis responsáveis por tarefas)
export const FUNCOES = [
  { id: 'estrategia', nome: 'Estrategista', cor: '#8b5cf6' },
  { id: 'design', nome: 'Design', cor: '#ec4899' },
  { id: 'conteudo', nome: 'Gestor de Conteúdo', cor: '#5b8def' },
  { id: 'trafego', nome: 'Gestor de Tráfego', cor: '#10b981' },
  { id: 'webdesign', nome: 'Web Designer', cor: '#f59e0b' },
  { id: 'copy', nome: 'Copywriter', cor: '#06b6d4' },
] as const

export const funcaoInfo = (id?: string | null) =>
  FUNCOES.find((f) => f.id === id)

// Perfis de acesso
export type Perfil =
  | 'ceo'
  | 'gestor'
  | 'coordenador'
  | 'operacional'
  | 'freelancer'
  | 'cliente'

export const PERFIL_LABEL: Record<Perfil, string> = {
  ceo: 'CEO',
  gestor: 'Gestor',
  coordenador: 'Coordenador',
  operacional: 'Operacional',
  freelancer: 'Freelancer',
  cliente: 'Cliente',
}
