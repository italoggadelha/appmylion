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
import { Plus, Trash2, GripVertical, Save, Tag, Layers, ShieldCheck, Check, Minus, Bot } from 'lucide-react'
import { useData } from '@/lib/data'
import {
  salvarStatus,
  excluirStatus,
  salvarTemplate,
  excluirTemplate,
  moverTemplateFase,
  salvarPerfil,
  excluirPerfil,
  salvarAgenteExterno,
  excluirAgenteExterno,
} from '@/lib/repo'
import type { PerfilAcesso, AgenteExterno } from '@/lib/types'
import { FASES_RUGIDO, FUNCOES, type FaseId } from '@/data/rugido'
import type { StatusTarefa, TarefaTemplate } from '@/lib/types'
import { PageHeader } from '@/components/ui'

type Aba = 'status' | 'fases' | 'perfis' | 'agentes'

const PERMS = [
  { k: 'visualizar', l: 'Visualizar' },
  { k: 'editar', l: 'Editar' },
  { k: 'aprovar', l: 'Aprovar' },
  { k: 'financeiro', l: 'Financeiro' },
  { k: 'ia', l: 'IA' },
  { k: 'relatorios', l: 'Relatórios' },
]

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
          { id: 'perfis' as Aba, label: 'Perfis de acesso', icon: ShieldCheck },
          { id: 'agentes' as Aba, label: 'Agentes conectados', icon: Bot },
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

      {aba === 'status' && <AbaStatus />}
      {aba === 'fases' && <AbaFases />}
      {aba === 'perfis' && <AbaPerfis />}
      {aba === 'agentes' && <AbaAgentes />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ABA 4 — Agentes conectados (webhooks externos)
// ════════════════════════════════════════════════════════════════════
function AbaAgentes() {
  const { agentesExternos, recarregar } = useData()
  const [novo, setNovo] = useState({ nome: '', descricao: '', webhookUrl: '' })

  async function criar() {
    if (!novo.nome.trim() || !novo.webhookUrl.trim()) return
    await salvarAgenteExterno(novo)
    setNovo({ nome: '', descricao: '', webhookUrl: '' })
    await recarregar()
  }
  async function remover(id: string) {
    if (!confirm('Remover este agente?')) return
    await excluirAgenteExterno(id)
    await recarregar()
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 text-xs leading-relaxed text-ink-400">
        <span className="font-semibold text-ink-200">Como funciona:</span>{' '}
        cadastre o webhook do seu agente (n8n, Make, API própria…). Numa tarefa,
        clique em <b>Executar agente</b>: o sistema envia o contexto da tarefa e
        o agente deve responder em JSON{' '}
        <code className="text-gold-300">
          {'{ tipo: "html|imagem|video|texto", titulo, conteudo }'}
        </code>
        . O retorno entra como anexo da tarefa.
      </div>

      <div className="panel overflow-hidden">
        {agentesExternos.length === 0 && (
          <div className="p-6 text-center text-sm text-ink-500">
            Nenhum agente conectado ainda.
          </div>
        )}
        {agentesExternos.map((ag: AgenteExterno) => (
          <div
            key={ag.id}
            className="flex items-center gap-3 border-b border-white/[0.04] p-3.5 last:border-0"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold-500/15 text-gold-300">
              <Bot size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink-100">
                {ag.nome}
              </div>
              <div className="truncate font-mono text-[11px] text-ink-500">
                {ag.webhookUrl}
              </div>
            </div>
            <button
              onClick={() => remover(ag.id)}
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="panel space-y-3 p-5">
        <h3 className="font-display text-sm font-bold text-ink-100">
          Conectar novo agente
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Nome do agente"
            value={novo.nome}
            onChange={(e) => setNovo((p) => ({ ...p, nome: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Descrição (opcional)"
            value={novo.descricao}
            onChange={(e) =>
              setNovo((p) => ({ ...p, descricao: e.target.value }))
            }
          />
        </div>
        <input
          className="input"
          placeholder="URL do webhook (https://…)"
          value={novo.webhookUrl}
          onChange={(e) =>
            setNovo((p) => ({ ...p, webhookUrl: e.target.value }))
          }
        />
        <button onClick={criar} className="btn-gold">
          <Plus size={15} /> Conectar agente
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// ABA 3 — Perfis de acesso (matriz de permissões customizável)
// ════════════════════════════════════════════════════════════════════
function AbaPerfis() {
  const { perfis, recarregar } = useData()
  const [novoNome, setNovoNome] = useState('')

  async function criar() {
    if (!novoNome.trim()) return
    await salvarPerfil({
      nome: novoNome,
      permissoes: { visualizar: true, editar: false, aprovar: false, financeiro: false, ia: false, relatorios: false },
    })
    setNovoNome('')
    await recarregar()
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-white/[0.06] p-4">
        <h3 className="font-display text-sm font-bold text-ink-100">
          Perfis e permissões
        </h3>
        <p className="text-xs text-ink-500">
          Clique nas células para liberar ou bloquear cada permissão.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-ink-500">
            <th className="px-4 py-2.5 text-left font-semibold">Perfil</th>
            {PERMS.map((p) => (
              <th key={p.k} className="px-2 py-2.5 text-center font-semibold">
                {p.l}
              </th>
            ))}
            <th className="px-2" />
          </tr>
        </thead>
        <tbody>
          {perfis.map((perfil) => (
            <LinhaPerfil key={perfil.id} perfil={perfil} onMudou={recarregar} />
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 border-t border-white/[0.06] p-4">
        <input
          className="input flex-1"
          placeholder="Nome do novo perfil…"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button onClick={criar} className="btn-gold">
          <Plus size={15} /> Criar perfil
        </button>
      </div>
    </div>
  )
}

function LinhaPerfil({
  perfil,
  onMudou,
}: {
  perfil: PerfilAcesso
  onMudou: () => void
}) {
  const [perms, setPerms] = useState<Record<string, boolean>>(perfil.permissoes)
  const mudou = JSON.stringify(perms) !== JSON.stringify(perfil.permissoes)
  const fixo = ['ceo', 'gestor', 'coordenador', 'operacional', 'freelancer', 'cliente'].includes(
    perfil.chave,
  )

  async function salvar() {
    await salvarPerfil({ id: perfil.id, nome: perfil.nome, permissoes: perms })
    onMudou()
  }
  async function remover() {
    if (!confirm(`Remover o perfil "${perfil.nome}"?`)) return
    await excluirPerfil(perfil.id)
    onMudou()
  }

  return (
    <tr className="border-t border-white/[0.04] hover:bg-ink-800/40">
      <td className="px-4 py-2.5 font-medium text-ink-100">{perfil.nome}</td>
      {PERMS.map((p) => (
        <td key={p.k} className="px-2 py-2.5 text-center">
          <button
            onClick={() => setPerms((x) => ({ ...x, [p.k]: !x[p.k] }))}
            className="mx-auto block"
          >
            {perms[p.k] ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Minus size={16} className="text-ink-600" />
            )}
          </button>
        </td>
      ))}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1">
          {mudou && (
            <button
              onClick={salvar}
              className="btn-gold px-2 py-1 text-[11px]"
            >
              <Save size={12} />
            </button>
          )}
          {!fixo && (
            <button
              onClick={remover}
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
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

  async function mudarFuncao(funcao: string) {
    await salvarTemplate({ id: tpl.id, titulo: tpl.titulo, fase: tpl.fase, ordem: tpl.ordem, funcao, aprovacao: tpl.aprovacao })
    await recarregar()
  }
  async function mudarAprovacao(aprovacao: string) {
    await salvarTemplate({ id: tpl.id, titulo: tpl.titulo, fase: tpl.fase, ordem: tpl.ordem, funcao: tpl.funcao, aprovacao })
    await recarregar()
  }

  const cor = FUNCOES.find((f) => f.id === tpl.funcao)?.cor ?? '#4a4a57'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-white/[0.06] bg-ink-850 p-2 ${
        isDragging ? 'z-50 opacity-90 shadow-gold' : ''
      }`}
    >
      <div className="flex items-center gap-1.5">
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
        <button onClick={remover} className="text-ink-600 hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>
      <select
        value={tpl.funcao ?? ''}
        onChange={(e) => mudarFuncao(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-white/[0.06] bg-ink-900 px-1.5 py-1 text-[10px] font-semibold outline-none"
        style={{ color: cor }}
      >
        <option value="">— Função responsável —</option>
        {FUNCOES.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome}
          </option>
        ))}
      </select>
      <select
        value={tpl.aprovacao ?? 'nenhum'}
        onChange={(e) => mudarAprovacao(e.target.value)}
        className="mt-1 w-full rounded-md border border-white/[0.06] bg-ink-900 px-1.5 py-1 text-[10px] font-semibold text-ink-300 outline-none"
      >
        <option value="nenhum">Sem aprovação</option>
        <option value="lider">Aprova: líder</option>
        <option value="cliente">Aprova: cliente</option>
        <option value="ambos">Aprova: líder + cliente</option>
      </select>
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
