import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Lock,
  Check,
  MessageSquare,
  Paperclip,
  Send,
  ChevronRight,
  Pencil,
  Plus,
  Copy,
  HardDrive,
} from 'lucide-react'
import { useData } from '@/lib/data'
import { criarAprovacao } from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import TarefaModal from '@/components/TarefaModal'
import {
  FASES_RUGIDO,
  faseById,
  STATUS_LABEL,
  STATUS_COR,
  PRIORIDADE_COR,
  type FaseId,
} from '@/data/rugido'
import type { Tarefa } from '@/lib/types'
import { brl, dataCurta } from '@/lib/format'
import { Avatar, Badge, ProgressRing, ProgressBar } from '@/components/ui'

export default function ClienteDetalhe() {
  const { id } = useParams()
  const { clientePorId, tarefasDoCliente, avancarFase } = useData()
  const cliente = clientePorId(id ?? '')
  const tarefas = cliente ? tarefasDoCliente(cliente.id) : []
  const [avancando, setAvancando] = useState(false)
  const faseAtualIdx = cliente
    ? FASES_RUGIDO.findIndex((f) => f.id === cliente.faseAtual)
    : 0
  const [faseSel, setFaseSel] = useState<FaseId>(cliente?.faseAtual ?? 'raiox')
  const [modal, setModal] = useState<{ aberto: boolean; tarefa?: Tarefa }>({
    aberto: false,
  })

  if (!cliente) {
    return (
      <div className="panel grid place-items-center py-20 text-sm text-ink-500">
        Cliente não encontrado.{' '}
        <Link to="/clientes" className="text-gold-400">
          Voltar
        </Link>
      </div>
    )
  }

  const faseSelObj = faseById(faseSel)
  const faseSelIdx = FASES_RUGIDO.findIndex((f) => f.id === faseSel)
  const tarefasFase = tarefas.filter((t) => t.fase === faseSel)
  const concluidasFase = tarefasFase.filter((t) => t.status === 'concluida').length
  const progFase = tarefasFase.length
    ? Math.round((concluidasFase / tarefasFase.length) * 100)
    : 0
  const faseBloqueada = faseSelIdx > faseAtualIdx
  const progGeral = tarefas.length
    ? Math.round(
        (tarefas.filter((t) => t.status === 'concluida').length / tarefas.length) *
          100,
      )
    : 0

  async function confirmarAvanco() {
    if (!cliente) return
    const prox = FASES_RUGIDO[faseAtualIdx + 1]
    if (!prox) return
    if (!confirm(`Aprovar a fase atual e avançar para "${prox.nome}"?`)) return
    setAvancando(true)
    try {
      const geradas = await avancarFase(cliente.id, prox.id)
      setFaseSel(prox.id)
      if (geradas > 0)
        alert(`Cliente avançou para ${prox.nome}. ${geradas} tarefas criadas automaticamente.`)
    } catch {
      alert('Não foi possível avançar a fase.')
    } finally {
      setAvancando(false)
    }
  }

  return (
    <div>
      <Link
        to="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-100"
      >
        <ArrowLeft size={14} /> Clientes
      </Link>

      {/* Cabeçalho do cliente */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar nome={cliente.empresa} url={cliente.logoUrl} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink-50">
                {cliente.empresa}
              </h1>
              <Badge cor={cliente.status === 'ativo' ? '#10b981' : '#f59e0b'}>
                {cliente.status}
              </Badge>
            </div>
            <p className="text-sm text-ink-400">
              {cliente.nome} · {cliente.segmento}
              {cliente.mesesContrato ? ` · contrato ${cliente.mesesContrato} meses` : ''}
            </p>
            {cliente.driveUrl && (
              <a
                href={cliente.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300"
              >
                <HardDrive size={13} /> Materiais no Google Drive
              </a>
            )}
          </div>

          <div className="flex items-center gap-5">
            {[
              { l: 'Plano', v: cliente.plano },
              { l: 'Ticket', v: `${brl(cliente.ticket)}/mês` },
              { l: 'Receita gerada', v: brl(cliente.receitaGerada) },
              { l: 'Responsável', v: cliente.responsavelNome },
            ].map((s) => (
              <div key={s.l} className="hidden sm:block">
                <div className="text-[10px] uppercase tracking-wide text-ink-500">
                  {s.l}
                </div>
                <div className="text-sm font-semibold text-ink-100">{s.v}</div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="relative">
                <ProgressRing
                  valor={cliente.healthScore}
                  cor={
                    cliente.healthScore >= 70
                      ? '#10b981'
                      : cliente.healthScore >= 50
                        ? '#f59e0b'
                        : '#ef4444'
                  }
                />
                <span className="absolute inset-0 grid place-items-center text-sm font-bold text-ink-50">
                  {cliente.healthScore}
                </span>
              </div>
              <div className="text-[10px] uppercase leading-tight tracking-wide text-ink-500">
                Health
                <br />
                Score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jornada RUGIDO — stepper */}
      <div className="panel mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-ink-100">
              Jornada RUGIDO
            </h2>
            <p className="text-xs text-ink-500">
              {progGeral}% concluído · nenhuma fase avança sem aprovação da
              anterior
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {FASES_RUGIDO.map((f, i) => {
            const concluida = i < faseAtualIdx
            const atual = i === faseAtualIdx
            const bloqueada = i > faseAtualIdx
            const sel = f.id === faseSel
            return (
              <button
                key={f.id}
                onClick={() => setFaseSel(f.id)}
                className={`relative rounded-xl border p-3 text-left transition-all ${
                  sel
                    ? 'border-gold-500/40 bg-ink-800 shadow-gold'
                    : 'border-white/[0.06] bg-ink-850 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: `${f.cor}22`,
                      color: f.cor,
                    }}
                  >
                    {concluida ? <Check size={15} /> : f.numero}
                  </span>
                  {bloqueada && <Lock size={12} className="text-ink-500" />}
                  {atual && (
                    <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
                  )}
                </div>
                <div className="mt-2 text-lg">{f.simbolo}</div>
                <div className="mt-0.5 text-xs font-semibold leading-tight text-ink-100">
                  {f.nome}
                </div>
                <div className="text-[10px] text-ink-500">{f.subtitulo}</div>
                {/* connector */}
                {i < 5 && (
                  <ChevronRight
                    size={14}
                    className="absolute -right-[11px] top-1/2 z-10 hidden -translate-y-1/2 text-ink-600 lg:block"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalhe da fase selecionada */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Coluna esquerda — info da fase */}
        <div className="panel h-fit p-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{faseSelObj.simbolo}</span>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: faseSelObj.cor }}
              >
                Fase {faseSelObj.numero}
              </div>
              <h3 className="font-display text-base font-bold text-ink-50">
                {faseSelObj.nome}
              </h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-400">
            {faseSelObj.descricao}
          </p>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-ink-500">Progresso da fase</span>
              <span className="font-bold text-gold-300">{progFase}%</span>
            </div>
            <ProgressBar valor={progFase} cor={faseSelObj.cor} />
            <div className="mt-1 text-[11px] text-ink-500">
              {concluidasFase} de {tarefasFase.length} tarefas concluídas
            </div>
          </div>

          {faseBloqueada ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              <Lock size={14} className="mt-0.5 shrink-0" />
              Fase bloqueada. Conclua e aprove as fases anteriores para liberar.
            </div>
          ) : faseAtualIdx >= FASES_RUGIDO.length - 1 ? (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-xs font-semibold text-emerald-300">
              🚀 Última fase do RUGIDO — cliente em escala.
            </div>
          ) : (
            <button
              disabled={
                faseSelIdx !== faseAtualIdx || progFase < 100 || avancando
              }
              onClick={confirmarAvanco}
              className="btn-gold mt-4 w-full disabled:cursor-not-allowed"
            >
              {avancando
                ? 'Avançando…'
                : progFase < 100
                  ? 'Conclua as tarefas para avançar'
                  : 'Aprovar fase e avançar →'}
            </button>
          )}
        </div>

        {/* Coluna direita — tarefas */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink-100">
              Tarefas da fase
            </h3>
            <button
              className="btn-ghost py-1.5 text-xs"
              onClick={() => setModal({ aberto: true })}
            >
              <Plus size={13} /> Tarefa
            </button>
          </div>
          <div className="space-y-2">
            {tarefasFase.length === 0 && (
              <div className="panel grid place-items-center py-10 text-sm text-ink-500">
                Sem tarefas nesta fase ainda.
              </div>
            )}
            {tarefasFase.map((t) => (
              <TarefaCard key={t.id} tarefa={t} />
            ))}
          </div>
        </div>
      </div>

      <TarefaModal
        aberto={modal.aberto}
        onFechar={() => setModal({ aberto: false })}
        clienteId={cliente.id}
        faseInicial={faseSel}
        tarefa={modal.tarefa}
      />
    </div>
  )
}


// ── Card de tarefa (clicável → abre o detalhe global) ───────────────
function TarefaCard({ tarefa }: { tarefa: Tarefa }) {
  const { abrirTarefa, statusInfo } = useData()
  const si = statusInfo(tarefa.status)
  const subFeitas = tarefa.subtarefas.filter((s) => s.concluida).length
  const atrasada =
    tarefa.status !== 'concluida' &&
    tarefa.prazo &&
    new Date(tarefa.prazo).getTime() < Date.now()

  return (
    <button
      onClick={() => abrirTarefa(tarefa.id)}
      className="panel panel-hover flex w-full items-center gap-3 p-3.5 text-left"
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: si.cor }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink-100">
            {tarefa.titulo}
          </span>
          {tarefa.precisaAprovacao && <Badge cor="#8b5cf6">aprovação</Badge>}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink-500">
          <span style={{ color: si.cor }}>{si.nome}</span>
          <span className="flex items-center gap-1">
            <Check size={11} /> {subFeitas}/{tarefa.subtarefas.length}
          </span>
          {tarefa.prazo && (
            <span className={atrasada ? 'font-semibold text-red-400' : ''}>
              {atrasada ? '⚠ ' : ''}
              {dataCurta(tarefa.prazo)}
            </span>
          )}
        </div>
      </div>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: PRIORIDADE_COR[tarefa.prioridade] }}
      />
      {tarefa.responsavelNome && (
        <Avatar nome={tarefa.responsavelNome} size={28} />
      )}
    </button>
  )
}
