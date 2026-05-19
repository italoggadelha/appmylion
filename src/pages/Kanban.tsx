import { useState, useMemo } from 'react'
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  MessageSquare,
  Paperclip,
  LayoutGrid,
  User,
  Users,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { useData } from '@/lib/data'
import {
  FASES_RUGIDO,
  faseById,
  PRIORIDADE_COR,
  type FaseId,
} from '@/data/rugido'
import type { Tarefa } from '@/lib/types'
import { dataCurta } from '@/lib/format'
import { Avatar, Badge, PageHeader } from '@/components/ui'
import TarefaModal from '@/components/TarefaModal'

type Modo = 'geral' | 'cliente' | 'membro'
type Vista = 'kanban' | 'lista' | 'calendario'

// ── Card do Kanban ──────────────────────────────────────────────────
function Card({ tarefa }: { tarefa: Tarefa }) {
  const { clientePorId, abrirTarefa, statusInfo } = useData()
  const si = statusInfo(tarefa.status)
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tarefa.id })
  const cliente = clientePorId(tarefa.clienteId)
  const style = {
    borderLeft: `3px solid ${si.cor}`,
    background: `linear-gradient(100deg, ${si.cor}14, transparent 38%)`,
    ...(transform
      ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
      : {}),
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => abrirTarefa(tarefa.id)}
      className={`cursor-grab rounded-xl border border-white/[0.06] bg-ink-850 p-3 transition-shadow active:cursor-grabbing ${
        isDragging ? 'z-50 opacity-90 shadow-gold' : 'hover:border-white/15'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          {tarefa.avulsa ? 'Avulsa' : (cliente?.empresa ?? '—')}
        </span>
        <span
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: PRIORIDADE_COR[tarefa.prioridade] }}
        />
      </div>
      <div className="mt-1.5 text-sm font-medium leading-snug text-ink-100">
        {tarefa.titulo}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: `${si.cor}1f`, color: si.cor }}
        >
          {si.nome}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-ink-500">
          {tarefa.comentarios > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare size={11} /> {tarefa.comentarios}
            </span>
          )}
          {tarefa.anexos > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip size={11} /> {tarefa.anexos}
            </span>
          )}
          {tarefa.precisaAprovacao && <Badge cor="#8b5cf6">aprov</Badge>}
        </div>
        {tarefa.responsavelNome && (
          <div className="flex items-center gap-1.5">
            <Avatar nome={tarefa.responsavelNome} size={20} />
            <span className="max-w-[90px] truncate text-[11px] font-medium text-ink-300">
              {tarefa.responsavelNome.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ColunaFase({
  fase,
  tarefas,
}: {
  fase: (typeof FASES_RUGIDO)[number]
  tarefas: Tarefa[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: fase.id })
  const concluidas = tarefas.filter((t) => t.status === 'concluida').length
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div
        className="mb-2 rounded-xl p-3 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${fase.cor}, ${fase.cor}cc)`,
          boxShadow: `0 6px 18px -6px ${fase.cor}88`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/25 text-sm font-extrabold text-white">
            {fase.numero}
          </span>
          <span className="text-lg">{fase.simbolo}</span>
          <span className="ml-auto rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-bold text-white">
            {tarefas.length}
          </span>
        </div>
        <div className="mt-2 font-display text-sm font-extrabold leading-tight text-white">
          {fase.nome}
        </div>
        <div className="text-[11px] font-medium text-white/75">
          {concluidas} concluída(s) · {fase.subtitulo}
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[180px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver
            ? 'border-gold-500/40 bg-gold-500/[0.04]'
            : 'border-white/[0.05] bg-ink-900/50'
        }`}
      >
        {tarefas.map((t) => (
          <Card key={t.id} tarefa={t} />
        ))}
        {tarefas.length === 0 && (
          <div className="grid flex-1 place-items-center py-6 text-[11px] text-ink-600">
            Sem tarefas
          </div>
        )}
      </div>
    </div>
  )
}

// ── Vista Lista ─────────────────────────────────────────────────────
function VistaLista({ tarefas }: { tarefas: Tarefa[] }) {
  const { abrirTarefa, statusInfo, clientePorId } = useData()
  if (!tarefas.length)
    return (
      <div className="panel grid place-items-center py-12 text-sm text-ink-500">
        Nenhuma tarefa nesta visão.
      </div>
    )
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-ink-500">
            <th className="px-4 py-2.5 text-left">Tarefa</th>
            <th className="px-3 py-2.5 text-left">Cliente</th>
            <th className="px-3 py-2.5 text-left">Fase</th>
            <th className="px-3 py-2.5 text-left">Status</th>
            <th className="px-3 py-2.5 text-left">Responsável</th>
            <th className="px-3 py-2.5 text-left">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {tarefas.map((t) => {
            const si = statusInfo(t.status)
            const fase = faseById(t.fase)
            return (
              <tr
                key={t.id}
                onClick={() => abrirTarefa(t.id)}
                className="cursor-pointer border-t border-white/[0.04] hover:bg-ink-800/40"
              >
                <td className="px-4 py-2.5 font-medium text-ink-100">
                  {t.titulo}
                </td>
                <td className="px-3 py-2.5 text-ink-400">
                  {t.avulsa ? 'Avulsa' : (clientePorId(t.clienteId)?.empresa ?? '—')}
                </td>
                <td className="px-3 py-2.5">
                  <span style={{ color: fase.cor }}>{fase.nome}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: `${si.cor}1f`, color: si.cor }}
                  >
                    {si.nome}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-ink-300">
                  {t.responsavelNome ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-ink-400">
                  {t.prazo ? dataCurta(t.prazo) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Vista Calendário (mês) ──────────────────────────────────────────
function VistaCalendario({ tarefas }: { tarefas: Tarefa[] }) {
  const { abrirTarefa, statusInfo } = useData()
  const [ref, setRef] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const ano = ref.getFullYear()
  const mes = ref.getMonth()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]
  const porDia = (dia: number) =>
    tarefas.filter((t) => {
      if (!t.prazo) return false
      const p = new Date(t.prazo)
      return (
        p.getFullYear() === ano && p.getMonth() === mes && p.getDate() === dia
      )
    })

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setRef(new Date(ano, mes - 1, 1))}
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ink-700"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-sm font-bold capitalize text-ink-100">
          {ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setRef(new Date(ano, mes + 1, 1))}
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ink-700"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-bold uppercase text-ink-500"
          >
            {d}
          </div>
        ))}
        {celulas.map((dia, i) => (
          <div
            key={i}
            className={`min-h-[88px] rounded-lg border border-white/[0.04] p-1 ${
              dia ? 'bg-ink-900/50' : ''
            }`}
          >
            {dia && (
              <>
                <div className="mb-1 text-[10px] font-semibold text-ink-500">
                  {dia}
                </div>
                <div className="space-y-1">
                  {porDia(dia)
                    .slice(0, 4)
                    .map((t) => {
                      const si = statusInfo(t.status)
                      return (
                        <button
                          key={t.id}
                          onClick={() => abrirTarefa(t.id)}
                          className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium"
                          style={{
                            backgroundColor: `${si.cor}22`,
                            color: si.cor,
                          }}
                        >
                          {t.titulo}
                        </button>
                      )
                    })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Tarefas() {
  const { tarefas, clientes, membros, moverTarefaFase } = useData()
  const [vista, setVista] = useState<Vista>('kanban')
  const [modo, setModo] = useState<Modo>('geral')
  const [alvoCliente, setAlvoCliente] = useState('')
  const [alvoMembro, setAlvoMembro] = useState('')
  const [avulsaAberta, setAvulsaAberta] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const cliente = alvoCliente || clientes[0]?.id || ''
  const membro = alvoMembro || membros[0]?.id || ''

  const visiveis = useMemo(() => {
    if (modo === 'cliente') return tarefas.filter((t) => t.clienteId === cliente)
    if (modo === 'membro') return tarefas.filter((t) => t.responsavelId === membro)
    return tarefas
  }, [tarefas, modo, cliente, membro])

  function onDragEnd(e: DragEndEvent) {
    const novaFase = e.over?.id as FaseId | undefined
    if (!novaFase || !FASES_RUGIDO.some((f) => f.id === novaFase)) return
    const t = tarefas.find((x) => x.id === e.active.id)
    if (t && t.fase !== novaFase) moverTarefaFase(t.id, novaFase)
  }

  const VISTAS: { id: Vista; label: string; icon: typeof List }[] = [
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'lista', label: 'Lista', icon: List },
    { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  ]
  const MODOS: { id: Modo; label: string; icon: typeof Users }[] = [
    { id: 'geral', label: 'Geral', icon: LayoutGrid },
    { id: 'cliente', label: 'Por cliente', icon: User },
    { id: 'membro', label: 'Por membro', icon: Users },
  ]

  return (
    <div>
      <PageHeader
        titulo="Tarefas"
        subtitulo="Toda a operação — Kanban, lista ou calendário"
        acao={
          <button className="btn-gold" onClick={() => setAvulsaAberta(true)}>
            <Plus size={15} /> Tarefa avulsa
          </button>
        }
      />

      <TarefaModal
        aberto={avulsaAberta}
        onFechar={() => setAvulsaAberta(false)}
        clienteId=""
        avulsa
      />

      {/* Vista + escopo */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-white/[0.07] bg-ink-850 p-1">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVista(v.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                vista === v.id
                  ? 'bg-gold-grad text-ink-950'
                  : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              <v.icon size={14} />
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-xl border border-white/[0.07] bg-ink-850 p-1">
          {MODOS.map((mo) => (
            <button
              key={mo.id}
              onClick={() => setModo(mo.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                modo === mo.id
                  ? 'bg-ink-700 text-ink-50'
                  : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              <mo.icon size={14} />
              {mo.label}
            </button>
          ))}
        </div>

        {modo === 'cliente' && (
          <select
            className="input w-auto"
            value={cliente}
            onChange={(e) => setAlvoCliente(e.target.value)}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.empresa}
              </option>
            ))}
          </select>
        )}
        {modo === 'membro' && (
          <select
            className="input w-auto"
            value={membro}
            onChange={(e) => setAlvoMembro(e.target.value)}
          >
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        )}
        <span className="ml-auto text-xs text-ink-500">
          {visiveis.length} tarefa(s)
        </span>
      </div>

      {vista === 'kanban' && (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {FASES_RUGIDO.map((fase) => (
              <ColunaFase
                key={fase.id}
                fase={fase}
                tarefas={visiveis.filter((t) => t.fase === fase.id)}
              />
            ))}
          </div>
        </DndContext>
      )}
      {vista === 'lista' && <VistaLista tarefas={visiveis} />}
      {vista === 'calendario' && <VistaCalendario tarefas={visiveis} />}
    </div>
  )
}
