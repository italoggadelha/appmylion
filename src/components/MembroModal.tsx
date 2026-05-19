import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import { useData } from '@/lib/data'
import { atualizarMembro, excluirMembro, uploadArquivo } from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import type { Membro } from '@/lib/types'
import { Avatar } from './ui'

export default function MembroModal({
  membro,
  onFechar,
}: {
  membro: Membro | null
  onFechar: () => void
}) {
  const { recarregar, perfis } = useData()
  const [f, setF] = useState({ nome: '', cargo: '', perfil: 'operacional' })
  const [foto, setFoto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  useEffect(() => {
    if (membro) {
      setF({
        nome: membro.nome,
        cargo: membro.cargo ?? '',
        perfil: membro.perfil,
      })
      setFoto(membro.avatarUrl ?? '')
    }
  }, [membro])

  async function subirFoto(file: File) {
    setEnviandoFoto(true)
    try {
      setFoto(await uploadArquivo(file))
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function salvar() {
    if (!membro) return
    setSalvando(true)
    try {
      await atualizarMembro(membro.id, { ...f, avatarUrl: foto })
      await recarregar()
      onFechar()
    } catch {
      alert('Falha ao salvar o membro.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover() {
    if (!membro) return
    if (!confirm(`Remover ${membro.nome} da equipe? O acesso será revogado.`))
      return
    setSalvando(true)
    try {
      await excluirMembro(membro.id)
      await recarregar()
      onFechar()
    } finally {
      setSalvando(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {membro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
          className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="panel w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-50">
                Editar membro
              </h2>
              <button
                onClick={onFechar}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar nome={f.nome || '?'} url={foto} size={56} />
                <label className="btn-ghost cursor-pointer text-xs">
                  {enviandoFoto ? 'Enviando…' : 'Trocar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && subirFoto(e.target.files[0])
                    }
                  />
                </label>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-300">
                  Nome
                </label>
                <input
                  className="input"
                  value={f.nome}
                  onChange={(e) => setF((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Cargo / Função
                  </label>
                  <input
                    className="input"
                    value={f.cargo}
                    onChange={(e) =>
                      setF((p) => ({ ...p, cargo: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-300">
                    Perfil de acesso
                  </label>
                  <select
                    className="input"
                    value={f.perfil}
                    onChange={(e) =>
                      setF((p) => ({ ...p, perfil: e.target.value }))
                    }
                  >
                    {perfis.map((p) => (
                      <option key={p.chave} value={p.chave}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-xs text-ink-500">{membro.email}</div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={remover}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} /> Remover da equipe
              </button>
              <div className="flex gap-2">
                <button onClick={onFechar} className="btn-ghost">
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando || !SUPABASE_PRONTO}
                  className="btn-gold"
                >
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
