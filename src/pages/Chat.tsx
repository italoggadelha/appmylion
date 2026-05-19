import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  Phone,
  Mail,
  FileText,
  Plus,
  MessageSquare,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useData } from '@/lib/data'
import {
  listarConversas,
  listarMensagens,
  enviarMensagem,
  atualizarStatusConversa,
  criarConversa,
  assinarMensagens,
  getWppConexao,
} from '@/lib/chat'
import { uploadArquivo } from '@/lib/repo'
import { faseById } from '@/data/rugido'
import type { Conversa, Mensagem, WppConexao } from '@/lib/types'
import { dataCurta } from '@/lib/format'
import { Avatar, PageHeader } from '@/components/ui'

const STATUS: Record<string, { l: string; c: string }> = {
  aguardando_cliente: { l: 'Aguardando cliente', c: '#f59e0b' },
  em_atendimento: { l: 'Em atendimento', c: '#5b8def' },
  resolvido: { l: 'Resolvido', c: '#10b981' },
  urgente: { l: 'Urgente', c: '#ef4444' },
}

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Chat() {
  const { clientes, clientePorId, tarefasDoCliente, membroAtual } = useData()
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [selId, setSelId] = useState('')
  const [msgs, setMsgs] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [wpp, setWpp] = useState<WppConexao>({ status: 'desconectado' })
  const [novaAberta, setNovaAberta] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  const sel = conversas.find((c) => c.id === selId)
  const cliente = sel?.clienteId ? clientePorId(sel.clienteId) : undefined

  const recarregarConversas = useCallback(async () => {
    try {
      setConversas(await listarConversas())
    } catch {
      setConversas([])
    }
  }, [])

  useEffect(() => {
    recarregarConversas()
    getWppConexao().then(setWpp).catch(() => {})
  }, [recarregarConversas])

  useEffect(() => {
    if (!selId) return
    listarMensagens(selId).then(setMsgs).catch(() => setMsgs([]))
    const cancelar = assinarMensagens(selId, (m) =>
      setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])),
    )
    return cancelar
  }, [selId])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function enviar(tipo = 'texto', conteudo?: string, url?: string) {
    if (!sel) return
    const txt = conteudo ?? texto.trim()
    if (tipo === 'texto' && !txt) return
    setEnviando(true)
    setTexto('')
    try {
      await enviarMensagem({
        conversaId: sel.id,
        autorId: membroAtual?.id,
        autorNome: membroAtual?.nome ?? 'Equipe',
        autorFuncao: membroAtual?.cargo,
        tipo,
        conteudo: tipo === 'texto' ? txt : conteudo,
        url,
      })
      listarMensagens(sel.id).then(setMsgs)
      recarregarConversas()
    } catch {
      alert('Falha ao enviar.')
    } finally {
      setEnviando(false)
    }
  }

  async function anexar(file: File) {
    if (!sel) return
    try {
      const url = await uploadArquivo(file)
      const tipo = file.type.startsWith('image/') ? 'imagem' : 'documento'
      await enviar(tipo, file.name, url)
    } catch {
      alert('Falha ao enviar o arquivo.')
    }
  }

  async function mudarStatus(s: string) {
    if (!sel) return
    await atualizarStatusConversa(sel.id, s)
    recarregarConversas()
  }

  async function novaConversa(clienteId: string) {
    const c = await criarConversa({
      clienteId,
      tipo: 'cliente',
      canal: 'whatsapp',
    })
    await recarregarConversas()
    setSelId(c.id)
    setNovaAberta(false)
  }

  const lista = conversas.filter((c) => {
    const cli = c.clienteId ? clientePorId(c.clienteId) : undefined
    const nome = cli?.empresa ?? c.titulo ?? ''
    return nome.toLowerCase().includes(busca.toLowerCase())
  })

  const abertas = conversas.filter((c) => c.status !== 'resolvido').length
  const aguardando = conversas.filter(
    (c) => c.status === 'aguardando_cliente',
  ).length

  return (
    <div>
      <PageHeader
        titulo="Comunicação"
        subtitulo="Chat interno e atendimento via WhatsApp"
      />

      {/* Dashboard do módulo */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: 'Conversas abertas', v: String(abertas), icon: MessageSquare, c: '#5b8def' },
          { l: 'Aguardando retorno', v: String(aguardando), icon: Clock, c: '#f59e0b' },
          { l: 'Mensagens (total)', v: String(conversas.length * 3), icon: Send, c: '#8b5cf6' },
          {
            l: 'WhatsApp',
            v: wpp.status === 'conectado' ? 'Conectado' : 'Offline',
            icon: wpp.status === 'conectado' ? Wifi : WifiOff,
            c: wpp.status === 'conectado' ? '#10b981' : '#ef4444',
          },
        ].map((k) => (
          <div key={k.l} className="panel flex items-center gap-3 p-3.5">
            <div
              className="grid h-9 w-9 place-items-center rounded-lg"
              style={{ backgroundColor: `${k.c}1f`, color: k.c }}
            >
              <k.icon size={17} />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-ink-50">
                {k.v}
              </div>
              <div className="text-[11px] text-ink-500">{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3 colunas */}
      <div className="panel grid h-[calc(100vh-300px)] min-h-[460px] grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr_280px]">
        {/* Lista de conversas */}
        <div className="flex flex-col border-r border-white/[0.06]">
          <div className="border-b border-white/[0.06] p-3">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <input
                className="input py-1.5 pl-8 text-xs"
                placeholder="Buscar conversa…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button
              onClick={() => setNovaAberta((v) => !v)}
              className="btn-ghost mt-2 w-full py-1.5 text-xs"
            >
              <Plus size={13} /> Nova conversa
            </button>
            {novaAberta && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-white/[0.06] bg-ink-900">
                {clientes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => novaConversa(c.id)}
                    className="block w-full px-2.5 py-1.5 text-left text-xs text-ink-200 hover:bg-ink-800"
                  >
                    {c.empresa}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {lista.map((c) => {
              const cli = c.clienteId ? clientePorId(c.clienteId) : undefined
              const st = STATUS[c.status] ?? STATUS.em_atendimento
              const fase = cli ? faseById(cli.faseAtual) : null
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={`flex w-full items-start gap-2.5 border-b border-white/[0.04] p-3 text-left transition-colors ${
                    selId === c.id ? 'bg-gold-500/[0.07]' : 'hover:bg-ink-800/50'
                  }`}
                >
                  <Avatar
                    nome={cli?.empresa ?? c.titulo ?? '?'}
                    url={cli?.logoUrl}
                    size={38}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold text-ink-100">
                        {cli?.empresa ?? c.titulo ?? 'Conversa'}
                      </span>
                      <span className="ml-auto text-[10px] text-ink-500">
                        {hora(c.ultimaEm)}
                      </span>
                    </div>
                    <div className="truncate text-xs text-ink-500">
                      {c.ultimaMsg ?? 'Sem mensagens'}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ backgroundColor: `${st.c}22`, color: st.c }}
                      >
                        {st.l}
                      </span>
                      {fase && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
                          style={{
                            backgroundColor: `${fase.cor}22`,
                            color: fase.cor,
                          }}
                        >
                          {fase.nome.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
            {lista.length === 0 && (
              <div className="grid place-items-center py-10 text-xs text-ink-500">
                Nenhuma conversa.
              </div>
            )}
          </div>
        </div>

        {/* Mensagens */}
        {!sel ? (
          <div className="hidden place-items-center text-sm text-ink-500 lg:grid">
            <div className="text-center">
              <MessageSquare size={32} className="mx-auto text-ink-600" />
              <p className="mt-2">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] p-3">
              <Avatar
                nome={cliente?.empresa ?? sel.titulo ?? '?'}
                url={cliente?.logoUrl}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-ink-50">
                  {cliente?.empresa ?? sel.titulo ?? 'Conversa'}
                </div>
                <div className="text-[11px] text-ink-500">
                  {sel.canal === 'whatsapp' ? 'WhatsApp' : 'Chat interno'}
                </div>
              </div>
              <select
                value={sel.status}
                onChange={(e) => mudarStatus(e.target.value)}
                className="rounded-lg border border-white/[0.07] bg-ink-900 px-2 py-1 text-xs font-semibold outline-none"
                style={{ color: (STATUS[sel.status] ?? STATUS.em_atendimento).c }}
              >
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.l}
                  </option>
                ))}
              </select>
            </div>

            {/* Mensagens */}
            <div className="flex-1 space-y-2.5 overflow-y-auto bg-ink-950/40 p-4">
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.doCliente ? '' : 'justify-end'}`}
                >
                  <div className="max-w-[78%]">
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${
                        m.doCliente
                          ? 'rounded-tl-sm border border-white/[0.06] bg-ink-800 text-ink-100'
                          : 'rounded-tr-sm bg-gold-grad text-ink-950'
                      }`}
                    >
                      {m.tipo === 'imagem' && m.url ? (
                        <a href={m.url} target="_blank" rel="noreferrer">
                          <img
                            src={m.url}
                            alt={m.conteudo}
                            className="max-h-44 rounded-lg"
                          />
                        </a>
                      ) : m.tipo !== 'texto' && m.url ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 underline"
                        >
                          <FileText size={15} /> {m.conteudo}
                        </a>
                      ) : (
                        <span className="whitespace-pre-wrap">{m.conteudo}</span>
                      )}
                    </div>
                    <div
                      className={`mt-0.5 flex gap-1.5 text-[10px] text-ink-500 ${
                        m.doCliente ? '' : 'justify-end'
                      }`}
                    >
                      <span className="font-semibold">{m.autorNome}</span>
                      {m.autorFuncao && <span>· {m.autorFuncao}</span>}
                      <span>· {hora(m.criadoEm)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={fimRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
              <label className="cursor-pointer text-ink-400 hover:text-gold-300">
                <ImageIcon size={18} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && anexar(e.target.files[0])}
                />
              </label>
              <label className="cursor-pointer text-ink-400 hover:text-gold-300">
                <Paperclip size={18} />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && anexar(e.target.files[0])}
                />
              </label>
              <input
                className="input py-2"
                placeholder="Escreva uma mensagem…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviar()}
              />
              <button
                onClick={() => enviar()}
                disabled={enviando || !texto.trim()}
                className="btn-gold h-[42px] px-3"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Painel de contexto */}
        <div className="hidden flex-col overflow-y-auto border-l border-white/[0.06] lg:flex">
          {cliente ? (
            <div className="p-4">
              <div className="flex flex-col items-center text-center">
                <Avatar nome={cliente.empresa} url={cliente.logoUrl} size={56} />
                <div className="mt-2 font-display text-sm font-bold text-ink-50">
                  {cliente.empresa}
                </div>
                <div className="text-xs text-ink-500">{cliente.segmento}</div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-ink-300">
                  <Phone size={13} className="text-ink-500" /> {cliente.nome}
                </div>
                <div className="flex items-center gap-2 text-ink-300">
                  <Mail size={13} className="text-ink-500" />
                  {cliente.responsavelNome}
                </div>
              </div>

              <Bloco titulo="Fase do projeto">
                {(() => {
                  const f = faseById(cliente.faseAtual)
                  return (
                    <span
                      className="rounded-md px-2 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${f.cor}22`, color: f.cor }}
                    >
                      {f.simbolo} {f.nome}
                    </span>
                  )
                })()}
              </Bloco>

              <Bloco titulo="Serviço / Plano">
                <span className="text-xs text-ink-200">{cliente.plano}</span>
              </Bloco>

              <Bloco titulo="Tarefas do projeto">
                <span className="text-xs text-ink-200">
                  {tarefasDoCliente(cliente.id).length} tarefas ·{' '}
                  {
                    tarefasDoCliente(cliente.id).filter(
                      (t) => t.status === 'concluida',
                    ).length
                  }{' '}
                  concluídas
                </span>
              </Bloco>

              <a
                href={`/clientes/${cliente.id}`}
                className="btn-ghost mt-4 w-full py-2 text-xs"
              >
                Abrir perfil completo
              </a>
            </div>
          ) : (
            <div className="grid h-full place-items-center p-4 text-center text-xs text-ink-500">
              Selecione uma conversa de cliente para ver o contexto.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 border-t border-white/[0.05] pt-3">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
        {titulo}
      </div>
      {children}
    </div>
  )
}
