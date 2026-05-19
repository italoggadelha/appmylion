import { useState } from 'react'
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Plus, Trash2, GripVertical, Save, Tag, Layers } from 'lucide-react'
import { useData } from '@/lib/data'
import {
  salvarStatus,
  excluirStatus,
  salvarTemplate,
  excluirTemplate,
  moverTemplateFase,
} from '@/lib/repo'
import { FASES_RUGIDO, type FaseId } from '@/data/rugido'
import type { StatusTarefa, TarefaTemplate } from '@/lib/types'
import { PageHeader } from '@/components/ui'

type Aba = 'status' | 'fases'

export default function Configuracoes() {
  const [aba, setAba] = useState<Aba>('status')

  return (
    <div>
      <PageHeader
        titulo="Configurações do Sistema"
        subtitulo="Ajustes globais — valem para todos os clientes"
      />

      <div className="mb-4 flex rounded-xl border border-white/[0.07] bg-ink-850 p-1">
        {[
          { id: 'status' as Aba, label: 'Status de tarefa', icon: Tag },
          { id: 'fases' as Aba, label: 'Fases & Tarefas padrão', icon: Layers },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              aba === t.id
                ? 'bg-gold-grad text-ink-950'
                : 'text-ink-400 hover:text-ink-100'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'status' ? <AbaStatus /> : <AbaFases />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ABA 1 — Status de tarefa
// ════════════════════════════════════════════════════════════════════
function AbaStatus() {
  const { status, recarregar } = useData()
  const [novo, setNovo] = useState({ nome: '', cor: '#5b8def' })

  async function criar() {
    if (!novo.nome.trim()) return
    const chave = novo.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w]/g, '_')
    await salvarStatus({ chave, nome: novo.nome, cor: novo.cor, ordem: status.length + 1 })
    setNovo({ nome: '', cor: '#5b8def' })
    await recarregar()
  }

  return (
    <div className="panel p-5">
      <h3 className="font-display text-sm font-bold text-ink-100">
        Status disponíveis
      </h3>
      <p className="text-xs text-ink-500">
        Esses status aparecem no Kanban e nas tarefas de todos os clientes.
      </p>

      <div className="mt-4 space-y-2">
        {status.map((s) => (
          <LinhaStatus key={s.id} status={s} onMudou={recarregar} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.05] pt-4">
        <input
          type="color"
          value={novo.cor}
          onChange={(e) => setNovo((p) => ({ ...p, cor: e.target.value }))}
          className="h-9 w-12 cursor-pointer rounded-lg border border-white/[0.07] bg-ink-900"
        />
        <input
          className="input flex-1"
          placeholder="Nome do novo status…"
          value={novo.nome}
          onChange={(e) => setNovo((p) => ({ ...p, nome: e.target.value }))}
        />
        <button onClick={criar} className="btn-gold">
          <Plus size={15} /> Adicionar
        </button>
      </div>
    </div>
  )
}

function LinhaStatus({
  status,
  onMudou,
}: {
  status: StatusTarefa
  onMudou: () => void
}) {
  const [nome, setNome] = useState(status.nome)
  const [cor, setCor] = useState(status.cor)
  const mudou = nome !== status.nome || cor !== status.cor

  async function salvar() {
    await salvarStatus({ id: status.id, nome, cor, ordem: status.ordem })
    onMudou()
  }
  async function remover() {
    if (!confirm(`Remover o status "${status.nome}"?`)) return
    await excluirStatus(status.id)
    onMudou()
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-ink-850 p-2.5">
      <input
        type="color"
        value={cor}
        onChange={(e) => setCor(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded-lg border border-white/[0.07] bg-ink-900"
      />
      <input
        className="input flex-1 py-1.5"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <code className="hidden text-[11px] text-ink-600 sm:block">
        {status.chave}
      </code>
      {mudou && (
        <button onClick={salvar} className="btn-gold py-1.5 text-xs">
          <Save size={13} /> Salvar
        </button>
      )}
      <button
        onClick={remover}
        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-700 hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ABA 2 — Fases & Templates de tarefa (arraste entre fases)
// ════════════════════════════════════════════════════════════════════
function TemplateCard({ tpl }: { tpl: TarefaTemplate }) {
  const { recarregar } = useData()
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tpl.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined

  async function remover(e: React.MouseEvent) {
    e.stopPropagation()
    await excluirTemplate(tpl.id)
    await recarregar()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-ink-850 p-2 ${
        isDragging ? 'z-50 opacity-90 shadow-gold' : ''
      }`}
    >
      <span
        {...listeners}
        {...attributes}
        className="cursor-grab text-ink-600 active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-ink-100">
        {tpl.titulo}
      </span>
      <button
        onClick={remover}
        className="text-ink-600 hover:text-red-400"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

function ColunaFaseTpl({
  fase,
  templates,
}: {
  fase: (typeof FASES_RUGIDO)[number]
  templates: TarefaTemplate[]
}) {
  const { recarregar } = useData()
  const { setNodeRef, isOver } = useDroppable({ id: fase.id })
  const [novo, setNovo] = useState('')

  async function adicionar() {
    if (!novo.trim()) return
    await salvarTemplate({ titulo: novo, fase: fase.id, ordem: templates.length + 1 })
    setNovo('')
    await recarregar()
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className="mb-2 rounded-xl p-2.5 shadow-md"
        style={{
          background: `linear-gradient(135deg, ${fase.cor}, ${fase.cor}cc)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span>{fase.simbolo}</span>
          <span className="truncate font-display text-xs font-extrabold text-white">
            {fase.nome}
          </span>
          <span className="ml-auto rounded-full bg-black/30 px-1.5 text-[10px] font-bold text-white">
            {templates.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-1.5 rounded-xl border p-2 transition-colors ${
          isOver
            ? 'border-gold-500/40 bg-gold-500/[0.04]'
            : 'border-white/[0.05] bg-ink-900/50'
        }`}
      >
        {templates.map((t) => (
          <TemplateCard key={t.id} tpl={t} />
        ))}
        <div className="mt-1 flex gap-1">
          <input
            className="input py-1.5 text-xs"
            placeholder="+ tarefa padrão"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          />
        </div>
      </div>
    </div>
  )
}

function AbaFases() {
  const { templates, recarregar } = useData()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  async function onDragEnd(e: DragEndEvent) {
    const novaFase = e.over?.id as FaseId | undefined
    if (!novaFase || !FASES_RUGIDO.some((f) => f.id === novaFase)) return
    const tpl = templates.find((t) => t.id === e.active.id)
    if (tpl && tpl.fase !== novaFase) {
      await moverTemplateFase(tpl.id, novaFase)
      await recarregar()
    }
  }

  return (
    <div className="panel p-5">
      <h3 className="font-display text-sm font-bold text-ink-100">
        Tarefas padrão por fase
      </h3>
      <p className="text-xs text-ink-500">
        Arraste uma tarefa para mudá-la de fase. Ao avançar um cliente de fase,
        estas tarefas são criadas automaticamente.
      </p>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="mt-4 flex gap-2 pb-3">
          {FASES_RUGIDO.map((fase) => (
            <ColunaFaseTpl
              key={fase.id}
              fase={fase}
              templates={templates
                .filter((t) => t.fase === fase.id)
                .sort((a, b) => a.ordem - b.ordem)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
