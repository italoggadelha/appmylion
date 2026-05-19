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
import { MessageSquare, Paperclip } from 'lucide-react'
import { useData } from '@/lib/data'
import {
  STATUS_LABEL,
  STATUS_COR,
  PRIORIDADE_COR,
  faseById,
  type TarefaStatus,
} from '@/data/rugido'
import type { Tarefa } from '@/lib/types'
import { Avatar, Badge, PageHeader } from '@/components/ui'

const COLUNAS: TarefaStatus[] = [
  'a_fazer',
  'fazendo',
  'aguardando_cliente',
  'aguardando_aprovacao',
  'concluida',
]

function Card({ tarefa }: { tarefa: Tarefa }) {
  const { clientePorId } = useData()
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tarefa.id })
  const fase = faseById(tarefa.fase)
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
      className={`cursor-grab rounded-xl border border-white/[0.06] bg-ink-850 p-3 transition-shadow active:cursor-grabbing ${
        isDragging ? 'z-50 opacity-90 shadow-gold' : 'hover:border-white/15'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: fase.cor }}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          {cliente?.empresa}
        </span>
        <span
          className="ml-auto h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: PRIORIDADE_COR[tarefa.prioridade] }}
        />
      </div>
      <div className="mt-1.5 text-sm font-medium leading-snug text-ink-100">
        {tarefa.titulo}
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

function Coluna({
  status,
  tarefas,
}: {
  status: TarefaStatus
  tarefas: Tarefa[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: STATUS_COR[status] }}
        />
        <span className="text-sm font-semibold text-ink-100">
          {STATUS_LABEL[status]}
        </span>
        <span className="rounded-full bg-ink-700 px-1.5 text-[11px] font-bold text-ink-300">
          {tarefas.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver
            ? 'border-gold-500/40 bg-gold-500/[0.04]'
            : 'border-white/[0.05] bg-ink-900/50'
        }`}
      >
        {tarefas.map((t) => (
          <Card key={t.id} tarefa={t} />
        ))}
      </div>
    </div>
  )
}

export default function Kanban() {
  const { tarefas, clientes, moverTarefa } = useData()
  const [filtroCliente, setFiltroCliente] = useState('todos')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const visiveis = useMemo(
    () =>
      filtroCliente === 'todos'
        ? tarefas
        : tarefas.filter((t) => t.clienteId === filtroCliente),
    [tarefas, filtroCliente],
  )

  function onDragEnd(e: DragEndEvent) {
    const novoStatus = e.over?.id as TarefaStatus | undefined
    if (!novoStatus || !COLUNAS.includes(novoStatus)) return
    moverTarefa(e.active.id as string, novoStatus)
  }

  return (
    <div>
      <PageHeader
        titulo="Kanban Inteligente"
        subtitulo="Arraste tarefas entre os estágios da operação"
        acao={
          <select
            className="input w-auto"
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          >
            <option value="todos">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.empresa}
              </option>
            ))}
          </select>
        }
      />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUNAS.map((status) => (
            <Coluna
              key={status}
              status={status}
              tarefas={visiveis.filter((t) => t.status === status)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
