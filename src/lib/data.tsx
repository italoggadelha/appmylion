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
  iniciarTarefa,
  pararTarefa,
  setTempoTarefa,
  criarCliente,
  gerarTarefasFase,
  atualizarCliente,
  toggleAutomacao,
  registrarExecucaoAutomacao,
  type Snapshot,
} from './repo'
import type { Cliente, Membro, Tarefa } from './types'
import type { FaseId } from '@/data/rugido'
import { useAuth } from './auth'

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
  iniciarTimer: (id: string) => Promise<void>
  pararTimer: (id: string) => Promise<void>
  definirTempo: (id: string, seg: number) => Promise<void>
  novoCliente: (dados: Partial<Cliente>) => Promise<void>
  avancarFase: (clienteId: string, novaFase: FaseId) => Promise<number>
  alternarAutomacao: (id: string, ativa: boolean) => void
  automacaoAtiva: (chave: string) => boolean
  statusInfo: (chave: string) => { nome: string; cor: string }
  tarefaAberta: string | null
  abrirTarefa: (id: string) => void
  fecharTarefa: () => void
  membroAtual: Membro | null
  // helpers
  clientePorId: (id: string) => Cliente | undefined
  membroPorId: (id: string) => Membro | undefined
  tarefasDoCliente: (id: string) => Tarefa[]
}

const Ctx = createContext<DataCtx>(null!)
export const useData = () => useContext(Ctx)

const VAZIO: Snapshot = {
  membros: [],
  clientes: [],
  tarefas: [],
  aprovacoes: [],
  automacoes: [],
  status: [],
  fases: [],
  templates: [],
  perfis: [],
  agentesExternos: [],
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [snap, setSnap] = useState<Snapshot>(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tarefaAberta, setTarefaAberta] = useState<string | null>(null)

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

  async function iniciarTimer(id: string) {
    await iniciarTarefa(id)
    await recarregar()
  }

  async function pararTimer(id: string) {
    const t = snap.tarefas.find((x) => x.id === id)
    if (!t) return
    let total = t.tempoGastoSeg
    if (t.iniciadaEm) {
      total += Math.max(
        0,
        Math.round((Date.now() - new Date(t.iniciadaEm).getTime()) / 1000),
      )
    }
    await pararTarefa(id, total)
    await recarregar()
  }

  async function definirTempo(id: string, seg: number) {
    await setTempoTarefa(id, seg)
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

  const automacaoAtiva = (chave: string) =>
    snap.automacoes.find((a) => a.chave === chave)?.ativa ?? false

  async function novoCliente(dados: Partial<Cliente>) {
    const criado = await criarCliente(dados)
    // Automação: gera as tarefas da fase inicial
    if (criado?.id && automacaoAtiva('onboarding_cliente')) {
      await gerarTarefasFase(criado.id, (dados.faseAtual ?? 'raiox') as FaseId)
      await registrarExecucaoAutomacao('onboarding_cliente')
    }
    await recarregar()
  }

  async function avancarFase(clienteId: string, novaFase: FaseId) {
    await atualizarCliente(clienteId, { fase_atual: novaFase })
    let geradas = 0
    if (automacaoAtiva('tarefas_da_fase')) {
      geradas = await gerarTarefasFase(clienteId, novaFase)
      await registrarExecucaoAutomacao('tarefas_da_fase')
    }
    await recarregar()
    return geradas
  }

  function alternarAutomacao(id: string, ativa: boolean) {
    setSnap((s) => ({
      ...s,
      automacoes: s.automacoes.map((a) => (a.id === id ? { ...a, ativa } : a)),
    }))
    toggleAutomacao(id, ativa).catch(() => recarregar())
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
    iniciarTimer,
    pararTimer,
    definirTempo,
    novoCliente,
    avancarFase,
    alternarAutomacao,
    automacaoAtiva,
    statusInfo: (chave) => {
      const s = snap.status.find((x) => x.chave === chave)
      return s
        ? { nome: s.nome, cor: s.cor }
        : { nome: chave, cor: '#4a4a57' }
    },
    tarefaAberta,
    abrirTarefa: (id) => setTarefaAberta(id),
    fecharTarefa: () => setTarefaAberta(null),
    membroAtual:
      snap.membros.find((m) => m.email === usuario?.email) ?? null,
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
