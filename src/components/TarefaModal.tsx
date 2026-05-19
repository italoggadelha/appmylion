import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import { useData } from '@/lib/data'
import {
  FASES_RUGIDO,
  FUNCOES,
  STATUS_LABEL,
  type FaseId,
  type TarefaStatus,
  type Prioridade,
} from '@/data/rugido'
import type { Tarefa } from '@/lib/types'

const STATUSES: TarefaStatus[] = [
  'a_fazer',
  'fazendo',
  'aguardando_cliente',
  'aguardando_aprovacao',
  'concluida',
  'travada',
]
const PRIOS: Prioridade[] = ['baixa', 'media', 'alta', 'critica']

export default function TarefaModal({
  aberto,
  onFechar,
  clienteId,
  faseInicial,
  tarefa,
}: {
  aberto: boolean
  onFechar: () => void
  clienteId: string
  faseInicial?: FaseId
  tarefa?: Tarefa
}) {
  const { membros, salvarTarefa, removerTarefa } = useData()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const editando = !!tarefa

  const [f, setF] = useState({
    titulo: '',
    descricao: '',
    fase: (faseInicial ?? 'raiox') as FaseId,
    status: 'a_fazer' as TarefaStatus,
    prioridade: 'media' as Prioridade,
    responsavelId: '',
    funcao: '',
    prazo: '',
    precisaAprovacao: false,
  })

  useEffect(() => {
    if (!aberto) return
    if (tarefa) {
      setF({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao ?? '',
        fase: tarefa.fase,
        status: tarefa.status,
        prioridade: tarefa.prioridade,
        responsavelId: tarefa.responsavelId ?? '',
        funcao: tarefa.funcao ?? '',
        prazo: tarefa.prazo ? tarefa.prazo.slice(0, 10) : '',
        precisaAprovacao: tarefa.precisaAprovacao,
      })
    } else {
      setF((p) => ({
        ...p,
        titulo: '',
        descricao: '',
        fase: faseInicial ?? 'raiox',
        status: 'a_fazer',
        prioridade: 'media',
        responsavelId: '',
        funcao: '',
        prazo: '',
        precisaAprovacao: false,
      }))
    }
    setErro('')
  }, [aberto, tarefa, faseInicial])

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((p) => ({ ...p, [k]: v }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!f.titulo.trim()) {
      setErro('Informe o título da tarefa.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await salvarTarefa({ id: tarefa?.id, clienteId, ...f })
      onFechar()
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!tarefa) return
    if (!confirm('Excluir esta tarefa?')) return
    setSalvando(true)
    try {
      await removerTarefa(tarefa.id)
      onFechar()
    } finally {
      setSalvando(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
          className="fixed inset-0 z-[110] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvar}
            className="panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-50">
                {editando ? 'Editar tarefa' : 'Nova tarefa'}
              </h2>
              <button
                type="button"
                onClick={onFechar}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-300">
                  Título *
                </label>
                <input
                  className="input"
                  value={f.titulo}
                  onChange={(e) => set('titulo', e.target.value)}
                  placeholder="Ex.: Criar landing page"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-300">
                  Descrição
                </label>
                <textarea
                  className="input min-h-[70px] resize-y"
                  value={f.descricao}
                  onChange={(e) => set('descricao', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Fase RUGIDO
                  </label>
                  <select
                    className="input"
                    value={f.fase}
                    onChange={(e) => set('fase', e.target.value as FaseId)}
                  >
                    {FASES_RUGIDO.map((fa) => (
                      <option key={fa.id} value={fa.id}>
                        {fa.numero}. {fa.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Status
                  </label>
                  <select
                    className="input"
                    value={f.status}
                    onChange={(e) => set('status', e.target.value as TarefaStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Prioridade
                  </label>
                  <select
                    className="input capitalize"
                    value={f.prioridade}
                    onChange={(e) =>
                      set('prioridade', e.target.value as Prioridade)
                    }
                  >
                    {PRIOS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Prazo
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={f.prazo}
                    onChange={(e) => set('prazo', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Responsável
                  </label>
                  <select
                    className="input"
                    value={f.responsavelId}
                    onChange={(e) => set('responsavelId', e.target.value)}
                  >
                    <option value="">— Sem responsável —</option>
                    {membros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} · {m.cargo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Função responsável
                  </label>
                  <select
                    className="input"
                    value={f.funcao}
                    onChange={(e) => set('funcao', e.target.value)}
                  >
                    <option value="">— Função —</option>
                    {FUNCOES.map((fn) => (
                      <option key={fn.id} value={fn.id}>
                        {fn.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-200">
                <input
                  type="checkbox"
                  checked={f.precisaAprovacao}
                  onChange={(e) => set('precisaAprovacao', e.target.checked)}
                  className="h-4 w-4 accent-gold-500"
                />
                Requer aprovação do cliente
              </label>
            </div>

            {erro && (
              <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                {erro}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between">
              {editando ? (
                <button
                  type="button"
                  onClick={excluir}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={onFechar} className="btn-ghost">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="btn-gold">
                  {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar tarefa'}
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
