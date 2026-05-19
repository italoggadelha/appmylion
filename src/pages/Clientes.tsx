import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { useData } from '@/lib/data'
import { FASES_RUGIDO, faseById } from '@/data/rugido'
import type { ClienteStatus } from '@/lib/types'
import { brl, dataCurta } from '@/lib/format'
import { Avatar, Badge, PageHeader, ProgressBar, Valor } from '@/components/ui'
import NovoClienteModal from '@/components/NovoClienteModal'

const STATUS_COR: Record<ClienteStatus, string> = {
  ativo: '#10b981',
  onboarding: '#5b8def',
  pausado: '#f59e0b',
  finalizado: '#4a4a57',
}
const STATUS_LABEL: Record<ClienteStatus, string> = {
  ativo: 'Ativo',
  onboarding: 'Onboarding',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
}

export default function Clientes() {
  const { clientes, tarefas } = useData()
  const [modalAberto, setModalAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroFase, setFiltroFase] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const progresso = (clienteId: string) => {
    const ts = tarefas.filter((t) => t.clienteId === clienteId)
    if (!ts.length) return 0
    return Math.round(
      (ts.filter((t) => t.status === 'concluida').length / ts.length) * 100,
    )
  }

  const lista = clientes.filter((c) => {
    const okBusca =
      c.empresa.toLowerCase().includes(busca.toLowerCase()) ||
      c.nome.toLowerCase().includes(busca.toLowerCase())
    const okFase = filtroFase === 'todos' || c.faseAtual === filtroFase
    const okStatus = filtroStatus === 'todos' || c.status === filtroStatus
    return okBusca && okFase && okStatus
  })

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        subtitulo={`${clientes.length} clientes na operação`}
        acao={
          <button className="btn-gold" onClick={() => setModalAberto(true)}>
            <Plus size={16} /> Novo cliente
          </button>
        }
      />

      <NovoClienteModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            className="input pl-9"
            placeholder="Buscar cliente ou empresa…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={filtroFase}
          onChange={(e) => setFiltroFase(e.target.value)}
        >
          <option value="todos">Todas as fases</option>
          {FASES_RUGIDO.map((f) => (
            <option key={f.id} value={f.id}>
              {f.numero}. {f.nome}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((c, i) => {
          const fase = faseById(c.faseAtual)
          const prog = progresso(c.id)
          const ativos = [
            ...new Map(
              tarefas
                .filter(
                  (t) => t.clienteId === c.id && t.status !== 'concluida' && t.responsavelNome,
                )
                .map((t) => [t.responsavelId, t.responsavelNome!]),
            ).values(),
          ]
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/clientes/${c.id}`}
                className="panel panel-hover block p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar nome={c.empresa} url={c.logoUrl} size={60} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-base font-bold text-ink-50">
                      {c.empresa}
                    </div>
                    <div className="truncate text-xs text-ink-500">
                      {c.nome} · {c.segmento}
                    </div>
                  </div>
                  <Badge cor={STATUS_COR[c.status]}>
                    {STATUS_LABEL[c.status]}
                  </Badge>
                </div>

                {/* Equipe do projeto */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-ink-500">
                    Responsável
                  </span>
                  <Avatar nome={c.responsavelNome} size={22} />
                  <span className="truncate text-xs font-medium text-ink-200">
                    {c.responsavelNome}
                  </span>
                  {ativos.length > 0 && (
                    <div className="ml-auto flex items-center">
                      {ativos.slice(0, 4).map((nome, idx) => (
                        <span
                          key={nome}
                          style={{ marginLeft: idx ? -8 : 0 }}
                          className="ring-2 ring-ink-850"
                        >
                          <Avatar nome={nome} size={22} />
                        </span>
                      ))}
                      <span className="ml-1.5 text-[10px] text-ink-500">
                        ativos
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-900 px-3 py-2">
                  <span className="text-base">{fase.simbolo}</span>
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-wide text-ink-500">
                      Fase {fase.numero}
                    </div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: fase.cor }}
                    >
                      {fase.nome}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-ink-500">Progresso operacional</span>
                    <span className="font-bold text-gold-300">{prog}%</span>
                  </div>
                  <ProgressBar valor={prog} cor={fase.cor} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[11px]">
                  <span className="text-ink-500">
                    Entrada {dataCurta(c.dataEntrada)}
                  </span>
                  <span className="font-semibold text-ink-200">
                    <Valor>{brl(c.ticket)}</Valor>
                    <span className="text-ink-500">/mês</span>
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {lista.length === 0 && (
        <div className="panel grid place-items-center py-16 text-sm text-ink-500">
          Nenhum cliente encontrado com esses filtros.
        </div>
      )}
    </div>
  )
}
