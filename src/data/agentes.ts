// Catálogo dos agentes de IA internos (Claude). Usado na página de Agentes
// e na execução de agente dentro de uma tarefa.

export interface AgenteIA {
  id: string
  nome: string
  papel: string
  icone: string
  cor: string
  fase: string
  capacidades: string[]
  /** true = entrega em HTML (ex.: páginas) */
  html?: boolean
}

export const AGENTES_IA: AgenteIA[] = [
  {
    id: 'estrategico',
    nome: 'Agente Estratégico',
    papel: 'Diagnóstico, ICP e posicionamento',
    icone: '🧠',
    cor: '#8b5cf6',
    fase: 'Ultravisão',
    capacidades: ['ICP & Avatar', 'Posicionamento', 'Análise de funil', 'Diagnóstico'],
  },
  {
    id: 'copywriter',
    nome: 'Agente Copywriter',
    papel: 'Headlines, VSL, anúncios e conteúdo',
    icone: '✍️',
    cor: '#ec4899',
    fase: 'Demanda',
    capacidades: ['Headlines', 'VSL', 'Anúncios', 'Copies de conteúdo'],
  },
  {
    id: 'designer',
    nome: 'Agente Designer',
    papel: 'Direções criativas e conceitos visuais',
    icone: '🎨',
    cor: '#f59e0b',
    fase: 'Implementação',
    capacidades: ['Ideias visuais', 'Conceitos', 'Layouts', 'Direção de arte'],
  },
  {
    id: 'webdesigner',
    nome: 'Agente Web Designer',
    papel: 'Estrutura de páginas, wireframes e UX',
    icone: '🖥️',
    cor: '#5b8def',
    fase: 'Implementação',
    capacidades: ['Wireframes', 'Páginas HTML', 'Estrutura', 'UX'],
    html: true,
  },
  {
    id: 'trafego',
    nome: 'Agente Gestor de Tráfego',
    papel: 'Campanhas, públicos e otimização',
    icone: '📈',
    cor: '#10b981',
    fase: 'Demanda',
    capacidades: ['Estrutura de campanhas', 'Públicos', 'Métricas', 'Otimizações'],
  },
  {
    id: 'operacional',
    nome: 'Lion',
    papel: 'Agente operacional — gargalos, atrasos e organização',
    icone: '🦁',
    cor: '#b8943f',
    fase: 'Todas as fases',
    capacidades: ['Detecção de gargalos', 'Tarefas travadas', 'Dependências', 'Redistribuição'],
  },
]
