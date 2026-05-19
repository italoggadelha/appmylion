import { useState } from 'react'
import { Copy, ExternalLink, Image, FileText, Video, Layout } from 'lucide-react'
import { useData } from '@/lib/data'
import type { AprovacaoStatus } from '@/lib/types'
import { dataCurta } from '@/lib/format'
import { Avatar, Badge, PageHeader } from '@/components/ui'

const STATUS_COR: Record<AprovacaoStatus, string> = {
  pendente: '#8b5cf6',
  aprovado: '#10b981',
  reprovado: '#ef4444',
  ajustes: '#f59e0b',
}
const STATUS_LABEL: Record<AprovacaoStatus, string> = {
  pendente: 'Aguardando cliente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  ajustes: 'Ajustes solicitados',
}
const TIPO_ICON: Record<string, typeof Image> = {
  arte: Image,
  copy: FileText,
  video: Video,
  pagina: Layout,
  post: Image,
}

export default function Aprovacoes() {
  const { aprovacoes, clientePorId } = useData()
  const [filtro, setFiltro] = useState<string>('todos')
  const lista =
    filtro === 'todos'
      ? aprovacoes
      : aprovacoes.filter((a) => a.status === filtro)

  return (
    <div>
      <PageHeader
        titulo="Aprovações"
        subtitulo="Entregas enviadas para validação dos clientes"
      />

      <div className="mb-4 flex gap-2">
        {['todos', 'pendente', 'ajustes', 'aprovado', 'reprovado'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filtro === f
                ? 'bg-gold-500/15 text-gold-200'
                : 'bg-ink-800 text-ink-400 hover:text-ink-100'
            }`}
          >
            {f === 'todos' ? 'Todos' : STATUS_LABEL[f as AprovacaoStatus]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {lista.map((a) => {
          const cliente = clientePorId(a.clienteId)
          const Icon = TIPO_ICON[a.tipo] ?? FileText
          const link = `https://app.mylion.com.br/aprovar/${a.token}`
          return (
            <div key={a.id} className="panel panel-hover p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-700 text-ink-300">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-100">
                    {a.titulo}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <Avatar nome={cliente?.empresa ?? '?'} size={16} />
                    {cliente?.empresa} · enviado {dataCurta(a.enviadaEm)}
                  </div>
                </div>
                <Badge cor={STATUS_COR[a.status]}>
                  {STATUS_LABEL[a.status]}
                </Badge>
              </div>

              {a.feedback && (
                <div className="mt-3 rounded-lg border border-white/[0.05] bg-ink-900 p-2.5 text-xs text-ink-300">
                  <span className="font-semibold text-ink-400">Feedback: </span>
                  {a.feedback}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-900 px-2.5 py-2">
                <span className="truncate font-mono text-[11px] text-ink-500">
                  {link}
                </span>
                <button
                  className="ml-auto text-ink-400 hover:text-gold-300"
                  title="Copiar link de aprovação"
                  onClick={() => navigator.clipboard?.writeText(link)}
                >
                  <Copy size={14} />
                </button>
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-400 hover:text-gold-300"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
