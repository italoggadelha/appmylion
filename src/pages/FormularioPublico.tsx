import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react'

const FN = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/formulario-publico`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` }

interface Campo {
  id: string
  label: string
  tipo: string
  opcoes?: string[]
}

export default function FormularioPublico() {
  const { token } = useParams()
  const [estado, setEstado] = useState<'carregando' | 'quiz' | 'erro' | 'feito'>(
    'carregando',
  )
  const [empresa, setEmpresa] = useState('')
  const [nome, setNome] = useState('')
  const [campos, setCampos] = useState<Campo[]>([])
  const [idx, setIdx] = useState(0)
  const [resp, setResp] = useState<Record<string, any>>({})
  const [tempos, setTempos] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)
  const inicio = useRef(Date.now())

  useEffect(() => {
    fetch(`${FN}?token=${encodeURIComponent(token ?? '')}`, { headers: H })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.status === 'respondido') return setEstado('feito')
        setEmpresa(d.empresa)
        setNome(d.formulario?.nome ?? 'Formulário')
        setCampos(d.formulario?.campos ?? [])
        setEstado('quiz')
        inicio.current = Date.now()
      })
      .catch(() => setEstado('erro'))
  }, [token])

  const campo = campos[idx]
  const ultimo = idx === campos.length - 1
  const respondido = (c: Campo) => {
    const v = resp[c.id]
    if (c.tipo === 'opcao_multipla') return Array.isArray(v) && v.length > 0
    return v !== undefined && String(v).trim() !== ''
  }

  function registrarTempo() {
    if (!campo) return
    const seg = Math.round((Date.now() - inicio.current) / 1000)
    setTempos((t) => ({ ...t, [campo.id]: (t[campo.id] ?? 0) + seg }))
    inicio.current = Date.now()
  }

  function avancar() {
    registrarTempo()
    if (ultimo) enviar()
    else setIdx((i) => i + 1)
  }
  function voltar() {
    registrarTempo()
    setIdx((i) => Math.max(0, i - 1))
  }

  async function enviar() {
    setEnviando(true)
    try {
      const r = await fetch(FN, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, respostas: resp, tempos }),
      })
      if (!r.ok) throw new Error()
      setEstado('feito')
    } catch {
      alert('Não foi possível enviar. Tente novamente.')
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-grad font-display text-lg font-extrabold text-ink-950">
            R
          </div>
          <span className="font-display text-sm font-bold tracking-wide">
            RUGIDO OS
          </span>
        </div>

        {estado === 'carregando' && (
          <div className="panel grid place-items-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
          </div>
        )}

        {estado === 'erro' && (
          <div className="panel p-8 text-center">
            <X className="mx-auto text-red-400" size={30} />
            <h1 className="mt-3 font-display text-lg font-bold">
              Formulário indisponível
            </h1>
          </div>
        )}

        {estado === 'feito' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel p-8 text-center"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={28} />
            </div>
            <h1 className="mt-4 font-display text-lg font-bold">
              Respostas enviadas!
            </h1>
            <p className="mt-1 text-sm text-ink-400">
              Obrigado. A equipe da MyLion vai montar a sua estratégia.
            </p>
          </motion.div>
        )}

        {estado === 'quiz' && campo && (
          <div className="panel overflow-hidden">
            {/* Progresso */}
            <div className="bg-ink-grad p-5">
              <div className="flex items-center justify-between text-[11px] text-ink-400">
                <span className="uppercase tracking-wide text-gold-500">
                  {empresa} · {nome}
                </span>
                <span>
                  {idx + 1} de {campos.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-gold-grad transition-all"
                  style={{ width: `${((idx + 1) / campos.length) * 100}%` }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={campo.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                <h2 className="font-display text-lg font-bold text-ink-50">
                  {campo.label}
                </h2>

                <div className="mt-4">
                  {campo.tipo === 'textarea' && (
                    <textarea
                      className="input min-h-[110px] resize-y"
                      value={resp[campo.id] ?? ''}
                      onChange={(e) =>
                        setResp((p) => ({ ...p, [campo.id]: e.target.value }))
                      }
                      autoFocus
                    />
                  )}
                  {campo.tipo === 'texto' && (
                    <input
                      className="input"
                      value={resp[campo.id] ?? ''}
                      onChange={(e) =>
                        setResp((p) => ({ ...p, [campo.id]: e.target.value }))
                      }
                      autoFocus
                    />
                  )}
                  {campo.tipo === 'opcao_unica' && (
                    <div className="space-y-2">
                      {(campo.opcoes ?? []).map((o) => (
                        <button
                          key={o}
                          onClick={() =>
                            setResp((p) => ({ ...p, [campo.id]: o }))
                          }
                          className={`flex w-full items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-all ${
                            resp[campo.id] === o
                              ? 'border-gold-500/50 bg-gold-500/10 text-ink-50'
                              : 'border-white/[0.07] bg-ink-850 text-ink-200 hover:border-white/15'
                          }`}
                        >
                          <span
                            className={`grid h-4 w-4 place-items-center rounded-full border ${
                              resp[campo.id] === o
                                ? 'border-gold-400 bg-gold-400'
                                : 'border-ink-500'
                            }`}
                          >
                            {resp[campo.id] === o && (
                              <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />
                            )}
                          </span>
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                  {campo.tipo === 'opcao_multipla' && (
                    <div className="space-y-2">
                      {(campo.opcoes ?? []).map((o) => {
                        const sel: string[] = Array.isArray(resp[campo.id])
                          ? resp[campo.id]
                          : []
                        const marcado = sel.includes(o)
                        return (
                          <button
                            key={o}
                            onClick={() =>
                              setResp((p) => ({
                                ...p,
                                [campo.id]: marcado
                                  ? sel.filter((x) => x !== o)
                                  : [...sel, o],
                              }))
                            }
                            className={`flex w-full items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-all ${
                              marcado
                                ? 'border-gold-500/50 bg-gold-500/10 text-ink-50'
                                : 'border-white/[0.07] bg-ink-850 text-ink-200 hover:border-white/15'
                            }`}
                          >
                            <span
                              className={`grid h-4 w-4 place-items-center rounded border ${
                                marcado
                                  ? 'border-gold-400 bg-gold-400 text-ink-950'
                                  : 'border-ink-500'
                              }`}
                            >
                              {marcado && <Check size={11} />}
                            </span>
                            {o}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={voltar}
                    disabled={idx === 0}
                    className="btn-ghost py-2 text-xs disabled:opacity-40"
                  >
                    <ArrowLeft size={14} /> Voltar
                  </button>
                  <button
                    onClick={avancar}
                    disabled={!respondido(campo) || enviando}
                    className="btn-gold"
                  >
                    {ultimo
                      ? enviando
                        ? 'Enviando…'
                        : 'Concluir'
                      : 'Próxima'}
                    {!ultimo && <ArrowRight size={15} />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-600">
          <ShieldCheck size={12} /> Formulário seguro · MyLion Digital
        </div>
      </div>
    </div>
  )
}
