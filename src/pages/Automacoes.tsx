import { Zap, ArrowRight } from 'lucide-react'
import { useData } from '@/lib/data'
import { PageHeader, Badge } from '@/components/ui'

export default function Automacoes() {
  const { automacoes, alternarAutomacao } = useData()
  const ativas = automacoes.filter((a) => a.ativa).length

  return (
    <div>
      <PageHeader
        titulo="Automações"
        subtitulo="Regras que a operação executa sozinha"
        acao={
          <Badge cor="#10b981">
            {ativas} de {automacoes.length} ativas
          </Badge>
        }
      />

      {automacoes.length === 0 && (
        <div className="panel grid place-items-center py-16 text-sm text-ink-500">
          Nenhuma automação configurada.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {automacoes.map((a) => (
          <div key={a.id} className="panel p-5">
            <div className="flex items-start gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  a.ativa
                    ? 'bg-gold-500/15 text-gold-300'
                    : 'bg-ink-700 text-ink-500'
                }`}
              >
                <Zap size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-bold text-ink-50">
                  {a.nome}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
                  {a.descricao}
                </p>
              </div>

              {/* Toggle */}
              <button
                onClick={() => alternarAutomacao(a.id, !a.ativa)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  a.ativa ? 'bg-gold-500' : 'bg-ink-600'
                }`}
                aria-label="Ativar/desativar"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    a.ativa ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
                <ArrowRight size={12} className="text-gold-500" />
                Gatilho: <span className="text-ink-300">{a.gatilho}</span>
              </span>
              <span className="text-[11px] text-ink-500">
                {a.execucoes} execução(ões)
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="panel mt-4 flex items-center gap-3 p-4 text-sm text-ink-400">
        <Zap size={16} className="text-gold-400" />
        Automações de gatilho diário (alerta de atraso) rodam por rotina no
        servidor. As demais são executadas em tempo real conforme a operação
        acontece.
      </div>
    </div>
  )
}
