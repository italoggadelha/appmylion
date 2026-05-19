import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Minus } from 'lucide-react'
import { useData } from '@/lib/data'
import { supabase, SUPABASE_PRONTO } from '@/lib/supabase'

const PERMISSOES = [
  { k: 'visualizar', l: 'Visualizar' },
  { k: 'editar', l: 'Editar' },
  { k: 'aprovar', l: 'Aprovar' },
  { k: 'financeiro', l: 'Financeiro' },
  { k: 'ia', l: 'IA' },
  { k: 'relatorios', l: 'Relatórios' },
]

export default function ConvidarMembroModal({
  aberto,
  onFechar,
}: {
  aberto: boolean
  onFechar: () => void
}) {
  const { recarregar, perfis } = useData()
  const [f, setF] = useState({
    nome: '',
    email: '',
    cargo: '',
    perfil: 'operacional',
    senha: 'Rugido@2026',
  })
  const permsDoF =
    perfis.find((p) => p.chave === f.perfil)?.permissoes ?? {}
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((p) => ({ ...p, [k]: v }))
  }

  async function convidar(e: React.FormEvent) {
    e.preventDefault()
    if (!f.nome.trim() || !f.email.trim()) {
      setErro('Preencha nome e e-mail.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      if (!SUPABASE_PRONTO) throw new Error('Backend não configurado.')
      const { data, error } = await supabase.functions.invoke('convidar-membro', {
        body: f,
      })
      if (error || data?.erro) throw new Error(data?.erro ?? 'falha')
      setOk(true)
      await recarregar()
    } catch (e: any) {
      setErro(
        e?.message === 'email_exists' || String(e).includes('exists')
          ? 'Já existe um usuário com esse e-mail.'
          : 'Falha ao convidar o membro.',
      )
    } finally {
      setSalvando(false)
    }
  }

  function fechar() {
    setOk(false)
    setF({ nome: '', email: '', cargo: '', perfil: 'operacional', senha: 'Rugido@2026' })
    setErro('')
    onFechar()
  }

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fechar}
          className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="panel max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-50">
                Convidar membro
              </h2>
              <button
                onClick={fechar}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
              >
                <X size={16} />
              </button>
            </div>

            {ok ? (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check size={26} />
                </div>
                <p className="mt-3 font-display text-sm font-bold text-ink-100">
                  Membro convidado!
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  Login: <b>{f.email}</b>
                  <br />
                  Senha: <b>{f.senha}</b>
                </p>
                <button onClick={fechar} className="btn-gold mt-4">
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={convidar} className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Nome *">
                    <input
                      className="input"
                      value={f.nome}
                      onChange={(e) => set('nome', e.target.value)}
                    />
                  </Campo>
                  <Campo label="Cargo / Função">
                    <input
                      className="input"
                      placeholder="Ex.: Designer"
                      value={f.cargo}
                      onChange={(e) => set('cargo', e.target.value)}
                    />
                  </Campo>
                </div>
                <Campo label="E-mail *">
                  <input
                    type="email"
                    className="input"
                    value={f.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Perfil de acesso">
                    <select
                      className="input"
                      value={f.perfil}
                      onChange={(e) => set('perfil', e.target.value)}
                    >
                      {perfis.map((p) => (
                        <option key={p.chave} value={p.chave}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </Campo>
                  <Campo label="Senha inicial">
                    <input
                      className="input"
                      value={f.senha}
                      onChange={(e) => set('senha', e.target.value)}
                    />
                  </Campo>
                </div>

                {/* Parâmetros de acesso do perfil */}
                <div className="rounded-xl border border-white/[0.06] bg-ink-900 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">
                    Parâmetros de acesso
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {PERMISSOES.map((p) => {
                      const tem = !!permsDoF[p.k]
                      return (
                        <div key={p.k} className="flex items-center gap-1.5 text-xs">
                          {tem ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Minus size={13} className="text-ink-600" />
                          )}
                          <span className={tem ? 'text-ink-200' : 'text-ink-600'}>
                            {p.l}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {erro && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                    {erro}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={fechar} className="btn-ghost">
                    Cancelar
                  </button>
                  <button type="submit" disabled={salvando} className="btn-gold">
                    {salvando ? 'Convidando…' : 'Convidar membro'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ink-300">
        {label}
      </label>
      {children}
    </div>
  )
}
