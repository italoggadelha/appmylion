import { Sparkles, ArrowRight } from 'lucide-react'
import { PageHeader, Badge } from '@/components/ui'

interface Agente {
  nome: string
  papel: string
  icone: string
  cor: string
  fase: string
  capacidades: string[]
}

const AGENTES: Agente[] = [
  {
    nome: 'Agente Estratégico',
    papel: 'Diagnóstico, ICP e posicionamento',
    icone: '🧠',
    cor: '#8b5cf6',
    fase: 'Ultravisão',
    capacidades: ['ICP & Avatar', 'Posicionamento', 'Análise de funil', 'Diagnóstico'],
  },
  {
    nome: 'Agente Copywriter',
    papel: 'Headlines, VSL, anúncios e conteúdo',
    icone: '✍️',
    cor: '#ec4899',
    fase: 'Demanda',
    capacidades: ['Headlines', 'VSL', 'Anúncios', 'Copies de conteúdo'],
  },
  {
    nome: 'Agente Designer',
    papel: 'Direções criativas e conceitos visuais',
    icone: '🎨',
    cor: '#f59e0b',
    fase: 'Implementação',
    capacidades: ['Ideias visuais', 'Conceitos', 'Layouts', 'Direção de arte'],
  },
  {
    nome: 'Agente Web Designer',
    papel: 'Estrutura de páginas, wireframes e UX',
    icone: '🖥️',
    cor: '#5b8def',
    fase: 'Implementação',
    capacidades: ['Wireframes', 'Estrutura de páginas', 'Sessões', 'UX'],
  },
  {
    nome: 'Agente Gestor de Tráfego',
    papel: 'Campanhas, públicos e otimização',
    icone: '📈',
    cor: '#10b981',
    fase: 'Demanda',
    capacidades: ['Estrutura de campanhas', 'Públicos', 'Métricas', 'Otimizações'],
  },
  {
    nome: 'Agente SEO',
    papel: 'SEO local e Google Meu Negócio',
    icone: '🔎',
    cor: '#06b6d4',
    fase: 'Implementação',
    capacidades: ['SEO local', 'Palavras-chave', 'Google Meu Negócio'],
  },
  {
    nome: 'Agente Operacional',
    papel: 'Gargalos, atrasos e dependências',
    icone: '⚡',
    cor: '#ef4444',
    fase: 'Todas as fases',
    capacidades: ['Detecção de gargalos', 'Tarefas travadas', 'Dependências', 'Redistribuição'],
  },
]

export default function AgentesIA() {
  return (
    <div>
      <PageHeader
        titulo="Agentes de IA"
        subtitulo="Inteligência especializada conectada ao contexto de cada cliente"
        acao={
          <Badge cor="#b8943f">
            <Sparkles size={12} /> Powered by Claude
          </Badge>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {AGENTES.map((a) => (
          <div key={a.nome} className="panel panel-hover flex flex-col p-5">
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
                style={{ backgroundColor: `${a.cor}1f` }}
              >
                {a.icone}
              </div>
              <div>
                <div className="font-display text-sm font-bold text-ink-50">
                  {a.nome}
                </div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: a.cor }}>
                  {a.fase}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-400">{a.papel}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.capacidades.map((c) => (
                <span
                  key={c}
                  className="rounded-md bg-ink-800 px-2 py-0.5 text-[11px] text-ink-300"
                >
                  {c}
                </span>
              ))}
            </div>
            <button className="btn-ghost mt-4 w-full">
              Conversar com o agente <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="panel mt-4 flex items-center gap-3 p-4 text-sm text-ink-400">
        <Sparkles size={16} className="text-gold-400" />
        Os agentes serão ligados via Edge Function ao Claude API na Fase 2,
        lendo o histórico e os ativos de cada cliente para sugerir ações e gerar
        entregas.
      </div>
    </div>
  )
}
