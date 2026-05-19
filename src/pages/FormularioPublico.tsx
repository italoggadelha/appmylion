import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, ShieldCheck } from 'lucide-react'

const FN = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/formulario-publico`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` }

interface Campo {
  id: string
  label: string
  tipo: string
}

export default function FormularioPublico() {
  const { token } = useParams()
  const [estado, setEstado] = useState<
    'carregando' | 'form' | 'erro' | 'feito'
  >('carregando')
  const [empresa, setEmpresa] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [campos, setCampos] = useState<Campo[]>([])
  const [resp, setResp] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetch(`${FN}?token=${encodeURIComponent(token ?? '')}`, { headers: H })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.status === 'respondido') {
          setEstado('feito')
          return
        }
        setEmpresa(d.empresa)
        setNome(d.formulario?.nome ?? 'Formulário')
        setDescricao(d.formulario?.descricao ?? '')
        setCampos(d.formulario?.campos ?? [])
        setEstado('form')
      })
      .catch(() => setEstado('erro'))
  }, [token])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const r = await fetch(FN, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, respostas: resp }),
      })
      if (!r.ok) throw new Error()
      setEstado('feito')
    } catch {
      alert('Não foi possível enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl">
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
            <p className="mt-1 text-sm text-ink-400">Link inválido.</p>
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
              Obrigado. A equipe da MyLion vai analisar e montar a sua
              estratégia.
            </p>
          </motion.div>
        )}

        {estado === 'form' && (
          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={enviar}
            className="panel overflow-hidden"
          >
            <div className="bg-ink-grad p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold-500">
                {empresa}
              </div>
              <h1 className="mt-1 font-display text-xl font-bold text-ink-50">
                {nome}
              </h1>
              {descricao && (
                <p className="mt-1 text-sm text-ink-400">{descricao}</p>
              )}
            </div>

            <div className="space-y-4 p-6">
              {campos.map((c) => (
                <div key={c.id}>
                  <label className="mb-1.5 block text-sm font-medium text-ink-200">
                    {c.label}
                  </label>
                  {c.tipo === 'textarea' ? (
                    <textarea
                      className="input min-h-[80px] resize-y"
                      value={resp[c.id] ?? ''}
                      onChange={(e) =>
                        setResp((p) => ({ ...p, [c.id]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      className="input"
                      value={resp[c.id] ?? ''}
                      onChange={(e) =>
                        setResp((p) => ({ ...p, [c.id]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={enviando}
                className="btn-gold w-full"
              >
                {enviando ? 'Enviando…' : 'Enviar respostas'}
              </button>
            </div>
          </motion.form>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-600">
          <ShieldCheck size={12} /> Formulário seguro · MyLion Digital
        </div>
      </div>
    </div>
  )
}
