import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ChevronDown } from 'lucide-react'
import { useData } from '@/lib/data'
import LionIcon from './LionIcon'
import { executarAgenteIA } from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'

// Widget do Agente Operacional — aparece no canto inferior ao entrar.
export default function AgenteOperacionalWidget() {
  const { tarefas, membroAtual } = useData()
  const [aberto, setAberto] = useState(true)
  const [fechado, setFechado] = useState(false)
  const [sugestao, setSugestao] = useState('')

  const minhas = useMemo(() => {
    if (!membroAtual) return []
    const fimHoje = new Date()
    fimHoje.setHours(23, 59, 59, 999)
    return tarefas
      .filter(
        (t) =>
          t.responsavelId === membroAtual.id &&
          t.status !== 'concluida' &&
          t.prazo &&
          new Date(t.prazo).getTime() <= fimHoje.getTime(),
      )
      .sort((a, b) => (a.prazo! < b.prazo! ? -1 : 1))
  }, [tarefas, membroAtual])

  const atrasadas = minhas.filter(
    (t) => new Date(t.prazo!).getTime() < Date.now() - 86400000,
  ).length

  useEffect(() => {
    if (!membroAtual) return
    const chave = `rugido.op.${membroAtual.id}.${new Date().toDateString()}`
    const salvo = sessionStorage.getItem(chave)
    if (salvo) {
      setSugestao(salvo)
      return
    }
    if (!SUPABASE_PRONTO || minhas.length === 0) return
    const lista = minhas.map((t) => `- ${t.titulo}`).join('\n')
    executarAgenteIA({
      agente: 'Lion (Agente Operacional)',
      papel: 'organização operacional e produtividade',
      mensagem:
        `Hoje ${membroAtual.nome} tem ${minhas.length} tarefa(s) com prazo até hoje ` +
        `(${atrasadas} atrasada(s)):\n${lista}\n\n` +
        `Em no máximo 2 frases curtas e diretas, dê uma sugestão de organização ` +
        `para o dia render melhor. Sem saudações.`,
    })
      .then((r) => {
        if (r?.resposta) {
          setSugestao(r.resposta)
          sessionStorage.setItem(chave, r.resposta)
        }
      })
      .catch(() => {})
  }, [membroAtual, minhas, atrasadas])

  if (fechado || !membroAtual) return null

  const hora = new Date().getHours()
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[330px] max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {aberto ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="panel overflow-hidden shadow-gold"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-gold-500/[0.06] px-4 py-2.5">
              <LionIcon size={30} />
              <div className="leading-tight">
                <div className="text-xs font-bold text-ink-50">Lion</div>
                <div className="text-[10px] text-ink-500">
                  {saud}, {membroAtual.nome.split(' ')[0]}
                </div>
              </div>
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => setAberto(false)}
                  className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:bg-ink-700"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => setFechado(true)}
                  className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:bg-ink-700"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              <p className="text-sm text-ink-200">
                {minhas.length === 0 ? (
                  'Você está sem tarefas com prazo para hoje. 🎯'
                ) : (
                  <>
                    Você tem{' '}
                    <span className="font-bold text-gold-300">
                      {minhas.length}
                    </span>{' '}
                    tarefa(s) para hoje
                    {atrasadas > 0 && (
                      <>
                        {' '}
                        ·{' '}
                        <span className="font-bold text-red-400">
                          {atrasadas} atrasada(s)
                        </span>
                      </>
                    )}
                    .
                  </>
                )}
              </p>

              {minhas.length > 0 && (
                <div className="mt-2 space-y-1">
                  {minhas.slice(0, 6).map((t) => (
                    <div
                      key={t.id}
                      className="truncate rounded-lg bg-ink-850 px-2.5 py-1.5 text-xs text-ink-200"
                    >
                      • {t.titulo}
                    </div>
                  ))}
                </div>
              )}

              {sugestao && (
                <div className="mt-3 flex gap-2 rounded-xl border border-gold-500/20 bg-gold-500/[0.05] p-2.5">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-gold-400" />
                  <p className="text-xs leading-relaxed text-ink-200">
                    {sugestao}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setAberto(true)}
            className="ml-auto flex items-center gap-2 rounded-full bg-gold-grad px-4 py-2.5 text-sm font-bold text-ink-950 shadow-gold"
          >
            <LionIcon size={20} />
            Lion
            {minhas.length > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-ink-950 text-[11px] text-gold-300">
                {minhas.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
