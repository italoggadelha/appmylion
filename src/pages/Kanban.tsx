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
import { MessageSquare, Paperclip, LayoutGrid, User, Users } from 'lucide-react'
import { useData } from '@/lib/data'
import {
  FASES_RUGIDO,
  STATUS_LABEL,
  STATUS_COR,
  PRIORIDADE_COR,
  type FaseId,
} from '@/data/rugido'
import type { Tarefa } from '@/lib/types'
import { Avatar, Badge, PageHeader } from '@/components/ui'

type Modo = 'geral' | 'cliente' | 'membro'

// ── Card de tarefa (arrastável entre fases) ─────────────────────────
function Card({ tarefa }: { tarefa: Tarefa }) {
  const { clientePorId, abrirTarefa, statusInfo } = useData()
  const si = statusInfo(tarefa.status)
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tarefa.id })
  const cliente = clientePorId(tarefa.clienteId)
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined

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
          {cliente?.empresa ?? '—'}
        </span>
        <span
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: PRIORIDADE_COR[tarefa.prioridade] }}
          title={`Prioridade ${tarefa.prioridade}`}
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
          <Avatar nome={tarefa.responsavelNome} size={24} />
        )}
      </div>
    </div>
  )
}

// ── Coluna = uma fase do RUGIDO ─────────────────────────────────────
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

export default function Kanban() {
  const { tarefas, clientes, membros, moverTarefaFase } = useData()
  const [modo, setModo] = useState<Modo>('geral')
  const [alvoCliente, setAlvoCliente] = useState('')
  const [alvoMembro, setAlvoMembro] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // alvos padrão
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

  const MODOS: { id: Modo; label: string; icon: typeof Users }[] = [
    { id: 'geral', label: 'Geral', icon: LayoutGrid },
    { id: 'cliente', label: 'Por cliente', icon: User },
    { id: 'membro', label: 'Por membro', icon: Users },
  ]

  return (
    <div>
      <PageHeader
        titulo="Kanban · Pipeline RUGIDO"
        subtitulo="Arraste tarefas entre as 6 fases do método"
      />

      {/* Seletor de visão */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-white/[0.07] bg-ink-850 p-1">
          {MODOS.map((mo) => (
            <button
              key={mo.id}
              onClick={() => setModo(mo.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                modo === mo.id
                  ? 'bg-gold-grad text-ink-950'
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
          {visiveis.length} tarefa(s) na visão
        </span>
      </div>

      {/* Pipeline de fases */}
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
    </div>
  )
}
