import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Check,
  Pencil,
  Send,
  Copy,
  Trash2,
  Plus,
  FileText,
  Link2,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Play,
  Square,
  Clock,
  Trophy,
  FileCode,
  Sparkles,
} from 'lucide-react'
import { useData } from '@/lib/data'
import { faseById, PRIORIDADE_COR } from '@/data/rugido'
import {
  listarAnexos,
  criarAnexo,
  excluirAnexo,
  atualizarAnexo,
  uploadArquivo,
  criarAprovacao,
  executarAgente,
} from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { confirmar } from '@/lib/confirmar'
import { AGENTES_IA } from '@/data/agentes'
import { executarAgenteIA } from '@/lib/repo'
import type { Anexo, AnexoCategoria, AnexoTipo, Tarefa } from '@/lib/types'
import { dataCurta, duracao, cronometro } from '@/lib/format'
import { Avatar } from './ui'
import TarefaModal from './TarefaModal'

const CATEGORIAS: {
  id: AnexoCategoria
  nome: string
  icon: typeof FileText
  cor: string
}[] = [
  { id: 'aprovacao', nome: 'Para aprovação', icon: CheckCircle2, cor: '#8b5cf6' },
  { id: 'ideia', nome: 'Ideias', icon: Lightbulb, cor: '#f59e0b' },
  { id: 'apoio', nome: 'Material de apoio', icon: BookOpen, cor: '#5b8def' },
]

export default function TarefaDetalhe() {
  const {
    tarefaAberta,
    fecharTarefa,
    tarefas,
    clientePorId,
    statusInfo,
    status,
    salvarTarefa,
    alternarSubtarefa,
    iniciarTimer,
    pararTimer,
    definirTempo,
    membroAtual,
    aprovacoes,
    agentesExternos,
  } = useData()
  const tarefa = tarefas.find((t) => t.id === tarefaAberta)
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [editar, setEditar] = useState(false)
  const [linkAprov, setLinkAprov] = useState('')
  const [agenteSel, setAgenteSel] = useState('')
  const [execAgente, setExecAgente] = useState(false)

  const recarregarAnexos = useCallback(async () => {
    if (!tarefa) return
    try {
      setAnexos(await listarAnexos(tarefa.id))
    } catch {
      setAnexos([])
    }
  }, [tarefa?.id])

  useEffect(() => {
    setLinkAprov('')
    recarregarAnexos()
  }, [tarefaAberta, recarregarAnexos])

  if (!tarefa) return null
  const cliente = clientePorId(tarefa.clienteId)
  const fase = faseById(tarefa.fase)
  const si = statusInfo(tarefa.status)
  const subFeitas = tarefa.subtarefas.filter((s) => s.concluida).length
  const aprovDaTarefa = aprovacoes.filter((a) => a.tarefaId === tarefa.id)

  async function rodarAgente() {
    if (!tarefa || !agenteSel) return
    if (!SUPABASE_PRONTO) return alert('Disponível com o backend conectado.')
    setExecAgente(true)
    try {
      if (agenteSel.startsWith('ia:')) {
        // Agente de IA interno (Claude)
        const ag = AGENTES_IA.find((a) => a.id === agenteSel.slice(3))
        if (!ag) return
        const msg =
          `Produza a entrega completa desta tarefa de uma agência de marketing.\n` +
          `Tarefa: "${tarefa.titulo}".\n${tarefa.descricao ?? ''}\n` +
          (ag.html
            ? 'Entregue SOMENTE o código HTML completo da página, pronto para publicar, sem explicações fora do código.'
            : 'Entregue o material final, pronto para uso.')
        const r = await executarAgenteIA({
          agente: ag.nome,
          papel: ag.papel,
          clienteId: tarefa.clienteId,
          mensagem: msg,
        })
        if (r?.resposta) {
          await criarAnexo({
            tarefaId: tarefa.id,
            categoria: 'aprovacao',
            tipo: ag.html ? 'html' : 'texto',
            titulo: `${ag.nome} · ${tarefa.titulo}`,
            conteudo: r.resposta,
          })
          await recarregarAnexos()
        } else {
          alert(
            r?.erro === 'sem_chave'
              ? 'A chave de IA não está configurada.'
              : 'O agente não conseguiu gerar a entrega.',
          )
        }
      } else {
        // Agente externo (webhook)
        const r = await executarAgente(tarefa.id, agenteSel.slice(4))
        if (r?.ok) await recarregarAnexos()
        else
          alert(
            'O agente não retornou um resultado válido.\n' + (r?.erro ?? ''),
          )
      }
    } catch {
      alert('Falha ao executar o agente.')
    } finally {
      setExecAgente(false)
    }
  }

  async function enviarAprovacao() {
    if (!tarefa) return
    if (!SUPABASE_PRONTO) return alert('Disponível com o backend conectado.')
    try {
      const { token } = await criarAprovacao({
        clienteId: tarefa.clienteId,
        tarefaId: tarefa.id,
        titulo: tarefa.titulo,
        tipo: 'entrega',
        solicitadoPor: membroAtual?.id,
      })
      await salvarTarefa({ id: tarefa.id, status: 'aguardando_aprovacao' })
      setLinkAprov(`${window.location.origin}/aprovar/${token}`)
    } catch {
      alert('Falha ao gerar o link.')
    }
  }

  return createPortal(
    <AnimatePresence>
      {tarefaAberta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fecharTarefa}
          className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
          >
            {/* Cabeçalho */}
            <div
              className="border-b border-white/[0.06] p-5"
              style={{
                background: `linear-gradient(160deg, ${fase.cor}1a, transparent)`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-500">
                    <span>{fase.simbolo}</span>
                    <span style={{ color: fase.cor }}>{fase.nome}</span>
                    {cliente && <span>· {cliente.empresa}</span>}
                  </div>
                  <h2 className="mt-1 font-display text-lg font-bold text-ink-50">
                    {tarefa.titulo}
                  </h2>
                </div>
                <button
                  onClick={fecharTarefa}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {tarefa.descricao && (
                <p className="text-sm text-ink-300">{tarefa.descricao}</p>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-500">
                    Status
                  </div>
                  <select
                    value={tarefa.status}
                    onChange={(e) =>
                      salvarTarefa({ id: tarefa.id, status: e.target.value as any })
                    }
                    className="mt-1 w-full rounded-lg border border-white/[0.07] bg-ink-900 px-2 py-1 text-xs font-semibold outline-none"
                    style={{ color: si.cor }}
                  >
                    {status.map((s) => (
                      <option key={s.chave} value={s.chave}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <Meta label="Prioridade">
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold capitalize"
                    style={{ color: PRIORIDADE_COR[tarefa.prioridade] }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PRIORIDADE_COR[tarefa.prioridade] }}
                    />
                    {tarefa.prioridade}
                  </span>
                </Meta>
                <Meta label="Responsável">
                  {tarefa.responsavelNome ? (
                    <span className="flex items-center gap-1.5 text-xs text-ink-200">
                      <Avatar nome={tarefa.responsavelNome} size={20} />
                      {tarefa.responsavelNome.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-500">—</span>
                  )}
                </Meta>
                <Meta label="Prazo">
                  <span className="text-xs text-ink-200">
                    {tarefa.prazo ? dataCurta(tarefa.prazo) : '—'}
                  </span>
                </Meta>
              </div>

              {/* Cronômetro */}
              <Cronometro
                tarefa={tarefa}
                onIniciar={() => iniciarTimer(tarefa.id)}
                onParar={() => pararTimer(tarefa.id)}
                onManual={(seg) => definirTempo(tarefa.id, seg)}
              />

              {/* Checklist */}
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">
                  Checklist · {subFeitas}/{tarefa.subtarefas.length}
                </div>
                <div className="space-y-1.5">
                  {tarefa.subtarefas.length === 0 && (
                    <p className="text-xs text-ink-600">Sem itens.</p>
                  )}
                  {tarefa.subtarefas.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => alternarSubtarefa(s.id, !s.concluida)}
                      className="flex w-full items-center gap-2.5 text-left text-sm"
                    >
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                          s.concluida
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-ink-500'
                        }`}
                      >
                        {s.concluida && <Check size={11} />}
                      </span>
                      <span
                        className={
                          s.concluida
                            ? 'text-ink-500 line-through'
                            : 'text-ink-200'
                        }
                      >
                        {s.titulo}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agente conectado */}
              <div className="rounded-xl border border-gold-500/20 bg-gold-500/[0.04] p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gold-300">
                  <Send size={12} /> Executar agente nesta tarefa
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input flex-1"
                    value={agenteSel}
                    onChange={(e) => setAgenteSel(e.target.value)}
                  >
                    <option value="">Escolha o agente…</option>
                    <optgroup label="Agentes de IA (Claude)">
                      {AGENTES_IA.map((ag) => (
                        <option key={ag.id} value={`ia:${ag.id}`}>
                          {ag.icone} {ag.nome}
                        </option>
                      ))}
                    </optgroup>
                    {agentesExternos.length > 0 && (
                      <optgroup label="Agentes conectados (webhook)">
                        {agentesExternos.map((ag) => (
                          <option key={ag.id} value={`ext:${ag.id}`}>
                            {ag.nome}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button
                    onClick={rodarAgente}
                    disabled={!agenteSel || execAgente}
                    className="btn-gold py-2 text-xs"
                  >
                    {execAgente ? 'Gerando…' : 'Executar'}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-ink-500">
                  O resultado entra como anexo desta tarefa (HTML abre página
                  para aprovar).
                </p>
              </div>

              {/* Anexos por categoria */}
              {CATEGORIAS.map((cat) => (
                <SecaoAnexos
                  key={cat.id}
                  categoria={cat}
                  tarefaId={tarefa.id}
                  anexos={anexos.filter((a) => a.categoria === cat.id)}
                  onMudou={recarregarAnexos}
                />
              ))}

              {/* Aprovações vinculadas à tarefa */}
              {aprovDaTarefa.length > 0 && (
                <div className="rounded-xl border border-white/[0.05] bg-ink-900/50 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">
                    <Send size={12} /> Links de aprovação
                  </div>
                  <div className="space-y-1.5">
                    {aprovDaTarefa.map((a) => {
                      const url = `${window.location.origin}/aprovar/${a.token}`
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-2 rounded-lg bg-ink-850 px-2.5 py-1.5"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                a.status === 'aprovado'
                                  ? '#10b981'
                                  : a.status === 'reprovado'
                                    ? '#ef4444'
                                    : a.status === 'ajustes'
                                      ? '#f59e0b'
                                      : '#8b5cf6',
                            }}
                          />
                          <span className="truncate font-mono text-[11px] text-ink-400">
                            {url}
                          </span>
                          <button
                            onClick={() => navigator.clipboard?.writeText(url)}
                            className="ml-auto shrink-0 text-ink-400 hover:text-gold-300"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {linkAprov && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="text-[11px] font-semibold text-emerald-300">
                    Link de aprovação gerado:
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="truncate font-mono text-[11px] text-ink-300">
                      {linkAprov}
                    </span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(linkAprov)}
                      className="ml-auto text-ink-400 hover:text-gold-300"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="flex flex-wrap gap-2 border-t border-white/[0.06] p-4">
              <button
                onClick={() => setEditar(true)}
                className="btn-ghost py-2 text-xs"
              >
                <Pencil size={13} /> Editar tarefa
              </button>
              <button
                onClick={enviarAprovacao}
                className="btn-gold py-2 text-xs"
              >
                <Send size={13} /> Enviar para aprovação
              </button>
            </div>
          </motion.div>

          {/* Modal de edição sobreposto */}
          <TarefaModal
            aberto={editar}
            onFechar={() => setEditar(false)}
            clienteId={tarefa.clienteId}
            tarefa={tarefa}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Meta({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

// ── Seção de anexos de uma categoria ────────────────────────────────
function SecaoAnexos({
  categoria,
  tarefaId,
  anexos,
  onMudou,
}: {
  categoria: { id: AnexoCategoria; nome: string; icon: typeof FileText; cor: string }
  tarefaId: string
  anexos: Anexo[]
  onMudou: () => void
}) {
  const [adicionando, setAdicionando] = useState(false)
  const [tipo, setTipo] = useState<AnexoTipo>('texto')
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editId, setEditId] = useState('')
  const [editTexto, setEditTexto] = useState('')
  const [modificandoId, setModificandoId] = useState('')

  async function salvarEdicao(id: string) {
    await atualizarAnexo(id, { conteudo: editTexto })
    setEditId('')
    onMudou()
  }

  async function modificarComIA(a: Anexo) {
    const feedback = window.prompt(
      'O que você quer ajustar nesta entrega da IA?',
    )
    if (!feedback?.trim()) return
    const ag =
      a.tipo === 'html'
        ? AGENTES_IA.find((x) => x.id === 'webdesigner')
        : AGENTES_IA.find((x) => x.id === 'copywriter')
    if (!ag) return
    setModificandoId(a.id)
    try {
      const r = await executarAgenteIA({
        agente: ag.nome,
        papel: ag.papel,
        mensagem:
          `Conteúdo atual da entrega:\n${a.conteudo}\n\n` +
          `Ajuste solicitado: ${feedback}\n\n` +
          `Refaça o conteúdo completo aplicando o ajuste pedido.` +
          (a.tipo === 'html'
            ? ' Entregue SOMENTE o código HTML completo.'
            : ''),
      })
      if (r?.resposta) {
        await atualizarAnexo(a.id, { conteudo: r.resposta })
        onMudou()
      } else {
        alert('A IA não conseguiu gerar a modificação.')
      }
    } catch {
      alert('Falha ao modificar com a IA.')
    } finally {
      setModificandoId('')
    }
  }

  async function adicionar(file?: File) {
    if (!SUPABASE_PRONTO) return alert('Disponível com o backend conectado.')
    setSalvando(true)
    try {
      let valor = conteudo
      let tipoFinal = tipo
      if (file) {
        valor = await uploadArquivo(file)
        tipoFinal = file.type.startsWith('image/') ? 'imagem' : 'arquivo'
      }
      await criarAnexo({
        tarefaId,
        categoria: categoria.id,
        tipo: tipoFinal,
        titulo: titulo || file?.name || 'Sem título',
        conteudo: valor,
      })
      setTitulo('')
      setConteudo('')
      setAdicionando(false)
      onMudou()
    } catch {
      alert('Falha ao adicionar o anexo.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(a: Anexo) {
    const ok = await confirmar({
      titulo: 'Excluir anexo?',
      mensagem: `"${a.titulo}" será removido desta tarefa.`,
      perigoso: true,
    })
    if (!ok) return
    await excluirAnexo(a.id)
    onMudou()
  }

  const Icon = categoria.icon
  return (
    <div className="rounded-xl border border-white/[0.05] bg-ink-900/50 p-3">
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color: categoria.cor }} />
        <span className="text-xs font-bold text-ink-200">{categoria.nome}</span>
        <span className="rounded-full bg-ink-700 px-1.5 text-[10px] font-bold text-ink-400">
          {anexos.length}
        </span>
        <button
          onClick={() => setAdicionando((v) => !v)}
          className="ml-auto text-ink-400 hover:text-gold-300"
        >
          <Plus size={15} />
        </button>
      </div>

      {anexos.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {anexos.map((a) => (
            <div key={a.id} className="rounded-lg bg-ink-850 px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              {a.tipo === 'link' && <Link2 size={13} className="text-ink-500" />}
              {a.tipo === 'imagem' && <ImageIcon size={13} className="text-ink-500" />}
              {a.tipo === 'arquivo' && <Upload size={13} className="text-ink-500" />}
              {a.tipo === 'texto' && <FileText size={13} className="text-ink-500" />}
              {a.tipo === 'html' && <FileCode size={13} className="text-gold-400" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-ink-100">
                    {a.titulo}
                  </span>
                  {a.aprovado && (
                    <Check size={12} className="shrink-0 text-emerald-400" />
                  )}
                </div>
                {a.tipo === 'texto' ? (
                  <div className="truncate text-[11px] text-ink-500">
                    {a.conteudo}
                  </div>
                ) : a.tipo === 'html' ? (
                  <a
                    href={`/preview/${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-gold-400 hover:underline"
                  >
                    Abrir página para ver e aprovar →
                  </a>
                ) : (
                  <a
                    href={a.conteudo}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[11px] text-gold-400 hover:underline"
                  >
                    {a.conteudo}
                  </a>
                )}
              </div>
              {(a.tipo === 'imagem' || a.tipo === 'video') && a.conteudo && (
                <a href={a.conteudo} target="_blank" rel="noreferrer">
                  {a.tipo === 'imagem' ? (
                    <img
                      src={a.conteudo}
                      alt=""
                      className="h-9 w-9 rounded object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-gold-400">ver vídeo</span>
                  )}
                </a>
              )}
              {(a.tipo === 'texto' || a.tipo === 'html') && (
                <>
                  <button
                    onClick={() => {
                      setEditId(editId === a.id ? '' : a.id)
                      setEditTexto(a.conteudo ?? '')
                    }}
                    title="Editar"
                    className="text-ink-500 hover:text-gold-300"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => modificarComIA(a)}
                    disabled={modificandoId === a.id}
                    title="Pedir modificação à IA"
                    className="text-ink-500 hover:text-gold-300"
                  >
                    <Sparkles
                      size={13}
                      className={modificandoId === a.id ? 'animate-pulse' : ''}
                    />
                  </button>
                </>
              )}
              <button
                onClick={() => remover(a)}
                className="text-ink-500 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {editId === a.id && (
              <div className="mt-2 space-y-2">
                <textarea
                  className="input min-h-[120px] py-1.5 text-xs"
                  value={editTexto}
                  onChange={(e) => setEditTexto(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditId('')}
                    className="btn-ghost py-1 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => salvarEdicao(a.id)}
                    className="btn-gold py-1 text-xs"
                  >
                    Salvar edição
                  </button>
                </div>
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {adicionando && (
        <div className="mt-2 space-y-2 rounded-lg border border-white/[0.06] bg-ink-850 p-2.5">
          <div className="flex gap-1">
            {(['texto', 'link', 'arquivo', 'imagem', 'html'] as AnexoTipo[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 rounded-md px-1 py-1 text-[10px] font-semibold capitalize ${
                    tipo === t
                      ? 'bg-gold-500/15 text-gold-200'
                      : 'bg-ink-800 text-ink-400'
                  }`}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          <input
            className="input py-1.5 text-xs"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          {(tipo === 'texto' || tipo === 'html') && (
            <textarea
              className="input min-h-[60px] py-1.5 text-xs"
              placeholder={
                tipo === 'html'
                  ? 'Cole o código HTML…'
                  : 'Escreva o conteúdo / a ideia…'
              }
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          )}
          {tipo === 'link' && (
            <input
              className="input py-1.5 text-xs"
              placeholder="https://…"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          )}
          {(tipo === 'arquivo' || tipo === 'imagem') && (
            <input
              type="file"
              accept={tipo === 'imagem' ? 'image/*' : undefined}
              onChange={(e) => e.target.files?.[0] && adicionar(e.target.files[0])}
              className="text-xs text-ink-400 file:mr-2 file:rounded-md file:border-0 file:bg-ink-700 file:px-2 file:py-1 file:text-ink-200"
            />
          )}
          {(tipo === 'texto' || tipo === 'link' || tipo === 'html') && (
            <button
              onClick={() => adicionar()}
              disabled={salvando || !titulo.trim()}
              className="btn-gold w-full py-1.5 text-xs"
            >
              {salvando ? 'Salvando…' : 'Adicionar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Cronômetro da tarefa ────────────────────────────────────────────
function Cronometro({
  tarefa,
  onIniciar,
  onParar,
  onManual,
}: {
  tarefa: Tarefa
  onIniciar: () => void
  onParar: () => void
  onManual: (seg: number) => void
}) {
  const rodando = !!tarefa.iniciadaEm
  const [agora, setAgora] = useState(Date.now())
  const [manual, setManual] = useState(false)
  const [horas, setHoras] = useState('')
  const [mins, setMins] = useState('')

  useEffect(() => {
    if (!rodando) return
    const i = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(i)
  }, [rodando])

  const extra = rodando
    ? Math.max(0, Math.round((agora - new Date(tarefa.iniciadaEm!).getTime()) / 1000))
    : 0
  const total = tarefa.tempoGastoSeg + extra

  function salvarManual() {
    const seg = (Number(horas) || 0) * 3600 + (Number(mins) || 0) * 60
    onManual(seg)
    setManual(false)
    setHoras('')
    setMins('')
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-900/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">
          <Clock size={13} /> Tempo de execução
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-gold-300">
          <Trophy size={12} /> {tarefa.pontos} pts
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div
          className={`font-display text-2xl font-bold tabular-nums ${
            rodando ? 'text-emerald-400' : 'text-ink-50'
          }`}
        >
          {cronometro(total)}
        </div>
        {rodando ? (
          <button onClick={onParar} className="btn-ghost py-1.5 text-xs">
            <Square size={13} /> Parar
          </button>
        ) : (
          <button onClick={onIniciar} className="btn-gold py-1.5 text-xs">
            <Play size={13} /> Iniciar
          </button>
        )}
        <button
          onClick={() => setManual((v) => !v)}
          className="text-[11px] font-semibold text-ink-400 hover:text-gold-300"
        >
          Tempo manual
        </button>
      </div>

      {manual && (
        <div className="mt-3 flex items-end gap-2">
          <div>
            <label className="text-[10px] text-ink-500">Horas</label>
            <input
              type="number"
              className="input w-20 py-1.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-ink-500">Minutos</label>
            <input
              type="number"
              className="input w-20 py-1.5"
              value={mins}
              onChange={(e) => setMins(e.target.value)}
            />
          </div>
          <button onClick={salvarManual} className="btn-gold py-1.5 text-xs">
            Definir
          </button>
        </div>
      )}

      <div className="mt-1.5 text-[11px] text-ink-500">
        Registrado: {duracao(tarefa.tempoGastoSeg)}
        {rodando && ' · cronômetro em andamento'}
      </div>
    </div>
  )
}
