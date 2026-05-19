import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, MessageSquareWarning, ShieldCheck, Image } from 'lucide-react'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { APROVACOES, clienteById } from '@/data/mock'
import type { AprovacaoStatus } from '@/lib/types'

// ═══════════════════════════════════════════════════════════════════
// Página PÚBLICA de aprovação. Lê/grava via Edge Function "aprovacao"
// (o token é o segredo). Sem login.
// ═══════════════════════════════════════════════════════════════════

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/aprovacao`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

interface Item {
  titulo: string
  tipo: string
  status: AprovacaoStatus
  empresa: string
  feedback?: string | null
}

export default function Aprovar() {
  const { token } = useParams()
  const [item, setItem] = useState<Item | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [decisao, setDecisao] = useState<AprovacaoStatus | null>(null)
  const [feedback, setFeedback] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    async function carregar() {
      if (!SUPABASE_PRONTO) {
        const a = APROVACOES.find((x) => x.token === token)
        setItem(
          a
            ? {
                titulo: a.titulo,
                tipo: a.tipo,
                status: a.status,
                empresa: clienteById(a.clienteId)?.empresa ?? '',
                feedback: a.feedback,
              }
            : null,
        )
        setCarregando(false)
        return
      }
      try {
        const r = await fetch(`${FN_URL}?token=${encodeURIComponent(token ?? '')}`, {
          headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        })
        if (!r.ok) {
          setItem(null)
        } else {
          const d = await r.json()
          setItem({
            titulo: d.aprovacao.titulo,
            tipo: d.aprovacao.tipo,
            status: d.aprovacao.status,
            empresa: d.cliente?.empresa ?? '',
            feedback: d.aprovacao.feedback,
          })
        }
      } catch {
        setItem(null)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [token])

  async function responder() {
    if (!decisao) return
    setEnviando(true)
    try {
      if (SUPABASE_PRONTO) {
        const r = await fetch(FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: ANON,
            Authorization: `Bearer ${ANON}`,
          },
          body: JSON.stringify({ token, decisao, feedback }),
        })
        if (!r.ok) throw new Error()
      }
      setEnviado(true)
    } catch {
      alert('Não foi possível registrar sua resposta. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <Wrapper>
        <div className="panel grid place-items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
        </div>
      </Wrapper>
    )
  }

  if (!item) {
    return (
      <Wrapper>
        <div className="panel p-8 text-center">
          <X className="mx-auto text-red-400" size={32} />
          <h1 className="mt-3 font-display text-lg font-bold">
            Link inválido ou expirado
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Solicite um novo link de aprovação à equipe.
          </p>
        </div>
      </Wrapper>
    )
  }

  const jaRespondido = item.status !== 'pendente' && !enviado

  if (enviado || jaRespondido) {
    const txt = enviado
      ? 'Resposta registrada!'
      : 'Esta solicitação já foi respondida.'
    return (
      <Wrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="panel p-8 text-center"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check size={28} />
          </div>
          <h1 className="mt-4 font-display text-lg font-bold">{txt}</h1>
          <p className="mt-1 text-sm text-ink-400">
            A equipe da MyLion foi notificada. Obrigado pelo retorno.
          </p>
        </motion.div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel overflow-hidden"
      >
        <div className="border-b border-white/[0.06] bg-ink-grad p-6">
          <div className="text-[11px] uppercase tracking-wide text-gold-500">
            {item.empresa} · solicitação de aprovação
          </div>
          <h1 className="mt-1 font-display text-xl font-bold text-ink-50">
            {item.titulo}
          </h1>
          <span className="mt-2 inline-flex rounded-full bg-ink-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
            {item.tipo}
          </span>
        </div>

        <div className="grid place-items-center border-b border-white/[0.06] bg-ink-900 p-10">
          <div className="flex flex-col items-center gap-2 text-ink-600">
            <Image size={42} />
            <span className="text-xs">Pré-visualização do material</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm font-semibold text-ink-200">Sua decisão</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Opcao
              ativo={decisao === 'aprovado'}
              cor="#10b981"
              icone={<Check size={18} />}
              label="Aprovar"
              onClick={() => setDecisao('aprovado')}
            />
            <Opcao
              ativo={decisao === 'ajustes'}
              cor="#f59e0b"
              icone={<MessageSquareWarning size={18} />}
              label="Ajustes"
              onClick={() => setDecisao('ajustes')}
            />
            <Opcao
              ativo={decisao === 'reprovado'}
              cor="#ef4444"
              icone={<X size={18} />}
              label="Reprovar"
              onClick={() => setDecisao('reprovado')}
            />
          </div>

          <textarea
            className="input mt-4 min-h-[90px] resize-y"
            placeholder={
              decisao === 'aprovado'
                ? 'Comentário (opcional)…'
                : 'Descreva os ajustes ou o motivo…'
            }
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button
            onClick={responder}
            disabled={
              !decisao ||
              enviando ||
              (decisao !== 'aprovado' && !feedback.trim())
            }
            className="btn-gold mt-4 w-full"
          >
            {enviando ? 'Enviando…' : 'Enviar resposta'}
          </button>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-600">
        <ShieldCheck size={12} />
        Aprovação segura · RUGIDO OS · MyLion Digital
      </div>
    </Wrapper>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-grad font-display text-lg font-extrabold text-ink-950">
            R
          </div>
          <span className="font-display text-sm font-bold tracking-wide">
            RUGIDO OS
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

function Opcao({
  ativo,
  cor,
  icone,
  label,
  onClick,
}: {
  ativo: boolean
  cor: string
  icone: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all"
      style={{
        borderColor: ativo ? cor : 'rgba(255,255,255,0.07)',
        backgroundColor: ativo ? `${cor}1a` : '#15151b',
        color: ativo ? cor : '#a0a0ad',
      }}
    >
      {icone}
      {label}
    </button>
  )
}
