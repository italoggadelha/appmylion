import { useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { PageHeader, Badge } from '@/components/ui'
import AgenteChat, { type AgenteInfo } from '@/components/AgenteChat'
import { AGENTES_IA } from '@/data/agentes'
import LionIcon from '@/components/LionIcon'

export default function AgentesIA() {
  const [ativo, setAtivo] = useState<AgenteInfo | null>(null)
  const AGENTES = AGENTES_IA
  return (
    <div>
      <AgenteChat agente={ativo} onFechar={() => setAtivo(null)} />
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
                {a.id === 'operacional' ? <LionIcon size={34} /> : a.icone}
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
            <button
              className="btn-ghost mt-4 w-full"
              onClick={() => setAtivo(a)}
            >
              Conversar com o agente <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="panel mt-4 flex items-center gap-3 p-4 text-sm text-ink-400">
        <Sparkles size={16} className="text-gold-400" />
        Os agentes já estão conectados ao Claude via Edge Function e leem o
        contexto de cada cliente. Basta adicionar a chave ANTHROPIC_API_KEY no
        servidor para ativar as respostas.
      </div>
    </div>
  )
}
