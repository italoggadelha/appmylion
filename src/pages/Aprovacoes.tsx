import { useState } from 'react'
import { Copy, ExternalLink, Image, FileText, Video, Layout, UserCircle } from 'lucide-react'
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
  const { aprovacoes, clientePorId, clientes, membros } = useData()
  const [filtro, setFiltro] = useState('todos')
  const [cliente, setCliente] = useState('todos')
  const [membro, setMembro] = useState('todos')

  const lista = aprovacoes.filter((a) => {
    const okStatus = filtro === 'todos' || a.status === filtro
    const okCliente = cliente === 'todos' || a.clienteId === cliente
    const okMembro = membro === 'todos' || a.solicitadoPor === membro
    return okStatus && okCliente && okMembro
  })

  return (
    <div>
      <PageHeader
        titulo="Aprovações"
        subtitulo="Entregas enviadas para validação dos clientes"
      />

      {/* Filtros de status */}
      <div className="mb-3 flex flex-wrap gap-2">
        {['todos', 'pendente', 'ajustes', 'aprovado', 'reprovado'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtro === f
                ? 'bg-gold-500/15 text-gold-200'
                : 'bg-ink-800 text-ink-400 hover:text-ink-100'
            }`}
          >
            {f === 'todos' ? 'Todos' : STATUS_LABEL[f as AprovacaoStatus]}
          </button>
        ))}
      </div>

      {/* Filtros por cliente e membro */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="input w-auto"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        >
          <option value="todos">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.empresa}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={membro}
          onChange={(e) => setMembro(e.target.value)}
        >
          <option value="todos">Solicitado por (todos)</option>
          {membros.map((mb) => (
            <option key={mb.id} value={mb.id}>
              {mb.nome}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-xs text-ink-500">
          {lista.length} aprovação(ões)
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {lista.map((a) => {
          const cli = clientePorId(a.clienteId)
          const Icon = TIPO_ICON[a.tipo] ?? FileText
          const link = `${window.location.origin}/aprovar/${a.token}`
          return (
            <div key={a.id} className="panel panel-hover p-4">
              {/* Cliente em destaque */}
              <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
                <Avatar
                  nome={cli?.empresa ?? '?'}
                  url={cli?.logoUrl}
                  size={32}
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-ink-500">
                    Cliente
                  </div>
                  <div className="truncate font-display text-sm font-bold text-ink-50">
                    {cli?.empresa ?? '—'}
                  </div>
                </div>
                <Badge cor={STATUS_COR[a.status]} className="ml-auto">
                  {STATUS_LABEL[a.status]}
                </Badge>
              </div>

              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-700 text-ink-300">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-100">
                    {a.titulo}
                  </div>
                  <div className="text-xs text-ink-500">
                    Enviado {dataCurta(a.enviadaEm)}
                  </div>
                </div>
              </div>

              {/* Solicitante */}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-500">
                <UserCircle size={13} />
                Solicitado por{' '}
                <span className="font-semibold text-ink-300">
                  {a.solicitanteNome ?? 'equipe'}
                </span>
              </div>

              {a.feedback && (
                <div className="mt-2 rounded-lg border border-white/[0.05] bg-ink-900 p-2.5 text-xs text-ink-300">
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
                  title="Copiar link"
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
        {lista.length === 0 && (
          <div className="panel col-span-full grid place-items-center py-12 text-sm text-ink-500">
            Nenhuma aprovação com esses filtros.
          </div>
        )}
      </div>
    </div>
  )
}
