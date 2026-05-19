import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  carregarTudo,
  atualizarStatusTarefa,
  atualizarFaseTarefa,
  criarTarefa,
  atualizarTarefa,
  excluirTarefa,
  setSubtarefa,
  type Snapshot,
} from './repo'
import type { Cliente, Membro, Tarefa } from './types'
import type { FaseId } from '@/data/rugido'

// ═══════════════════════════════════════════════════════════════════
// Estado de dados global, carregado uma vez após o login.
// ═══════════════════════════════════════════════════════════════════

interface DataCtx extends Snapshot {
  carregando: boolean
  erro: string | null
  recarregar: () => Promise<void>
  moverTarefa: (id: string, status: Tarefa['status']) => void
  moverTarefaFase: (id: string, fase: FaseId) => void
  salvarTarefa: (t: Partial<Tarefa> & { id?: string }) => Promise<void>
  removerTarefa: (id: string) => Promise<void>
  alternarSubtarefa: (subId: string, concluida: boolean) => void
  // helpers
  clientePorId: (id: string) => Cliente | undefined
  membroPorId: (id: string) => Membro | undefined
  tarefasDoCliente: (id: string) => Tarefa[]
}

const Ctx = createContext<DataCtx>(null!)
export const useData = () => useContext(Ctx)

const VAZIO: Snapshot = { membros: [], clientes: [], tarefas: [], aprovacoes: [] }

export function DataProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setSnap(await carregarTudo())
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao carregar dados')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // Atualizações otimistas do Kanban
  function moverTarefa(id: string, status: Tarefa['status']) {
    setSnap((s) => ({
      ...s,
      tarefas: s.tarefas.map((t) => (t.id === id ? { ...t, status } : t)),
    }))
    atualizarStatusTarefa(id, status).catch(() => recarregar())
  }

  function moverTarefaFase(id: string, fase: FaseId) {
    setSnap((s) => ({
      ...s,
      tarefas: s.tarefas.map((t) => (t.id === id ? { ...t, fase } : t)),
    }))
    atualizarFaseTarefa(id, fase).catch(() => recarregar())
  }

  async function salvarTarefa(t: Partial<Tarefa> & { id?: string }) {
    if (t.id) await atualizarTarefa(t.id, t)
    else await criarTarefa(t)
    await recarregar()
  }

  async function removerTarefa(id: string) {
    await excluirTarefa(id)
    await recarregar()
  }

  function alternarSubtarefa(subId: string, concluida: boolean) {
    setSnap((s) => ({
      ...s,
      tarefas: s.tarefas.map((t) => ({
        ...t,
        subtarefas: t.subtarefas.map((sub) =>
          sub.id === subId ? { ...sub, concluida } : sub,
        ),
      })),
    }))
    setSubtarefa(subId, concluida).catch(() => recarregar())
  }

  const valor: DataCtx = {
    ...snap,
    carregando,
    erro,
    recarregar,
    moverTarefa,
    moverTarefaFase,
    salvarTarefa,
    removerTarefa,
    alternarSubtarefa,
    clientePorId: (id) => snap.clientes.find((c) => c.id === id),
    membroPorId: (id) => snap.membros.find((m) => m.id === id),
    tarefasDoCliente: (id) => snap.tarefas.filter((t) => t.clienteId === id),
  }

  if (carregando) {
    return (
      <div className="grid h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
          <span className="text-xs text-ink-500">Carregando operação…</span>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="grid h-screen place-items-center px-6">
        <div className="panel max-w-sm p-6 text-center">
          <p className="font-display text-sm font-bold text-red-300">
            Erro ao carregar dados
          </p>
          <p className="mt-1 text-xs text-ink-400">{erro}</p>
          <button onClick={recarregar} className="btn-ghost mt-4">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}
