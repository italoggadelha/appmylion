import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles } from 'lucide-react'
import { useData } from '@/lib/data'
import { supabase, SUPABASE_PRONTO } from '@/lib/supabase'
import { Avatar } from './ui'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

export interface AgenteInfo {
  nome: string
  papel: string
  icone: string
  cor: string
}

export default function AgenteChat({
  agente,
  onFechar,
}: {
  agente: AgenteInfo | null
  onFechar: () => void
}) {
  const { clientes } = useData()
  const [clienteId, setClienteId] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMsgs([])
    setTexto('')
  }, [agente])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, pensando])

  async function enviar() {
    const m = texto.trim()
    if (!m || pensando || !agente) return
    const novoHist = [...msgs, { role: 'user' as const, content: m }]
    setMsgs(novoHist)
    setTexto('')
    setPensando(true)
    try {
      if (!SUPABASE_PRONTO) throw new Error('sem_backend')
      const { data, error } = await supabase.functions.invoke('agente-ia', {
        body: {
          agente: agente.nome,
          papel: agente.papel,
          clienteId: clienteId || undefined,
          mensagem: m,
          historico: msgs,
        },
      })
      if (error) throw error
      const resposta =
        data?.resposta ??
        (data?.erro === 'sem_chave'
          ? '⚙️ O agente está pronto, mas falta configurar a chave de IA (ANTHROPIC_API_KEY) no servidor. Assim que ela for adicionada, eu respondo de verdade.'
          : data?.erro === 'falha_ia'
            ? 'A IA recusou a requisição. Verifique a chave configurada.'
            : 'Não consegui responder agora.')
      setMsgs([...novoHist, { role: 'assistant', content: resposta }])
    } catch {
      setMsgs([
        ...novoHist,
        {
          role: 'assistant',
          content:
            '⚙️ Não foi possível falar com o agente. Confira a configuração da IA no servidor.',
        },
      ])
    } finally {
      setPensando(false)
    }
  }

  return (
    <AnimatePresence>
      {agente && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="panel flex h-[80vh] max-h-[640px] w-full max-w-lg flex-col overflow-hidden"
          >
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl text-xl"
                style={{ backgroundColor: `${agente.cor}1f` }}
              >
                {agente.icone}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-bold text-ink-50">
                  {agente.nome}
                </div>
                <div className="truncate text-[11px] text-ink-500">
                  {agente.papel}
                </div>
              </div>
              <button
                onClick={onFechar}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contexto de cliente */}
            <div className="border-b border-white/[0.06] p-3">
              <select
                className="input text-xs"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">Sem contexto de cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Contexto: {c.empresa}
                  </option>
                ))}
              </select>
            </div>

            {/* Conversa */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.length === 0 && (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <Sparkles
                      size={28}
                      className="mx-auto text-gold-400"
                    />
                    <p className="mt-2 text-sm text-ink-400">
                      Converse com o {agente.nome}.
                    </p>
                    <p className="text-xs text-ink-600">
                      Peça ideias, estratégias ou entregas prontas.
                    </p>
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    m.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm"
                      style={{ backgroundColor: `${agente.cor}1f` }}
                    >
                      {agente.icone}
                    </div>
                  ) : (
                    <Avatar nome="Você" size={28} />
                  )}
                  <div
                    className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-gold-grad text-ink-950'
                        : 'border border-white/[0.06] bg-ink-850 text-ink-100'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {pensando && (
                <div className="flex gap-2">
                  <div
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm"
                    style={{ backgroundColor: `${agente.cor}1f` }}
                  >
                    {agente.icone}
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-ink-850 px-3.5 py-2.5">
                    <div className="flex gap-1">
                      {[0, 0.15, 0.3].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400"
                          style={{ animationDelay: `${d}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={fimRef} />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 border-t border-white/[0.06] p-3">
              <textarea
                className="input max-h-28 min-h-[42px] resize-none"
                placeholder={`Mensagem para o ${agente.nome}…`}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
              />
              <button
                onClick={enviar}
                disabled={pensando || !texto.trim()}
                className="btn-gold h-[42px] px-3"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
