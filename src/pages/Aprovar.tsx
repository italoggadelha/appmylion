import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, MessageSquareWarning, ShieldCheck, Image } from 'lucide-react'
import { APROVACOES, clienteById } from '@/data/mock'
import type { AprovacaoStatus } from '@/lib/types'

// ═══════════════════════════════════════════════════════════════════
// Página PÚBLICA de aprovação — acessada pelo cliente via link/token.
// Sem login. Visual premium, fora do shell do sistema.
// ═══════════════════════════════════════════════════════════════════

export default function Aprovar() {
  const { token } = useParams()
  const aprovacao = APROVACOES.find((a) => a.token === token)
  const cliente = aprovacao ? clienteById(aprovacao.clienteId) : null

  const [decisao, setDecisao] = useState<AprovacaoStatus | null>(null)
  const [feedback, setFeedback] = useState('')
  const [enviado, setEnviado] = useState(false)

  if (!aprovacao) {
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

  if (enviado) {
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
          <h1 className="mt-4 font-display text-lg font-bold">
            Resposta registrada!
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            A equipe da MyLion foi notificada. Obrigado pelo retorno.
          </p>
        </motion.div>
      </Wrapper>
    )
  }

  function responder() {
    if (!decisao) return
    // TODO: persistir via Edge Function (token + decisão + feedback)
    setEnviado(true)
  }

  return (
    <Wrapper>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="border-b border-white/[0.06] bg-ink-grad p-6">
          <div className="text-[11px] uppercase tracking-wide text-gold-500">
            {cliente?.empresa} · solicitação de aprovação
          </div>
          <h1 className="mt-1 font-display text-xl font-bold text-ink-50">
            {aprovacao.titulo}
          </h1>
          <span className="mt-2 inline-flex rounded-full bg-ink-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-300">
            {aprovacao.tipo}
          </span>
        </div>

        {/* Preview do material */}
        <div className="grid place-items-center border-b border-white/[0.06] bg-ink-900 p-10">
          <div className="flex flex-col items-center gap-2 text-ink-600">
            <Image size={42} />
            <span className="text-xs">Pré-visualização do material</span>
          </div>
        </div>

        {/* Decisão */}
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
            disabled={!decisao || (decisao !== 'aprovado' && !feedback.trim())}
            className="btn-gold mt-4 w-full"
          >
            Enviar resposta
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
