import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2 } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// Confirmação global de exclusão. Uso:
//   if (await confirmar({ titulo, mensagem, dependencias, perigoso })) { ... }
// O <ConfirmHost/> precisa estar montado uma vez na app.
// ═══════════════════════════════════════════════════════════════════

export interface ConfirmOpts {
  titulo: string
  mensagem?: string
  dependencias?: string[]
  perigoso?: boolean
  confirmar?: string
}

type Listener = (o: ConfirmOpts) => void
let resolver: ((v: boolean) => void) | null = null
let listener: Listener | null = null

export function confirmar(opts: ConfirmOpts): Promise<boolean> {
  return new Promise((res) => {
    resolver = res
    listener?.(opts)
  })
}

export function ConfirmHost() {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null)

  useEffect(() => {
    listener = (o) => setOpts(o)
    return () => {
      listener = null
    }
  }, [])

  function responder(ok: boolean) {
    resolver?.(ok)
    resolver = null
    setOpts(null)
  }

  return createPortal(
    <AnimatePresence>
      {opts && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => responder(false)}
          className="fixed inset-0 z-[200] grid place-items-center bg-ink-950/75 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="panel w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  opts.perigoso
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {opts.perigoso ? (
                  <Trash2 size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <h2 className="font-display text-base font-bold text-ink-50">
                {opts.titulo}
              </h2>
            </div>

            {opts.mensagem && (
              <p className="mt-3 text-sm text-ink-300">{opts.mensagem}</p>
            )}

            {opts.dependencias && opts.dependencias.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300">
                  ⚠ Itens vinculados
                </div>
                <ul className="mt-1.5 space-y-0.5 text-xs text-ink-300">
                  {opts.dependencias.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => responder(false)} className="btn-ghost">
                Cancelar
              </button>
              <button
                onClick={() => responder(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98]"
              >
                {opts.confirmar ?? 'Excluir'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
