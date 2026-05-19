import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useData } from '@/lib/data'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { FASES_RUGIDO } from '@/data/rugido'
import type { ClienteStatus } from '@/lib/types'

const STATUS: { v: ClienteStatus; l: string }[] = [
  { v: 'onboarding', l: 'Onboarding' },
  { v: 'ativo', l: 'Ativo' },
  { v: 'pausado', l: 'Pausado' },
]

export default function NovoClienteModal({
  aberto,
  onFechar,
}: {
  aberto: boolean
  onFechar: () => void
}) {
  const { membros, novoCliente } = useData()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [f, setF] = useState({
    empresa: '',
    nome: '',
    segmento: '',
    plano: 'Performance',
    ticket: '',
    status: 'onboarding' as ClienteStatus,
    faseAtual: 'raiox',
    responsavelId: '',
  })

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((p) => ({ ...p, [k]: v }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!f.empresa.trim()) {
      setErro('Informe o nome da empresa.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      if (!SUPABASE_PRONTO) throw new Error('Backend não configurado (modo demo).')
      await novoCliente({
        ...f,
        faseAtual: f.faseAtual as any,
        ticket: Number(f.ticket) || 0,
        responsavelId: f.responsavelId || undefined,
      })
      onFechar()
      setF({
        empresa: '', nome: '', segmento: '', plano: 'Performance',
        ticket: '', status: 'onboarding', faseAtual: 'raiox', responsavelId: '',
      })
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvar}
            className="panel w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink-50">
                Novo cliente
              </h2>
              <button
                type="button"
                onClick={onFechar}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Campo label="Empresa *" full>
                <input
                  className="input"
                  value={f.empresa}
                  onChange={(e) => set('empresa', e.target.value)}
                  placeholder="Ex.: Clínica Vitalis"
                />
              </Campo>
              <Campo label="Contato">
                <input
                  className="input"
                  value={f.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Nome do responsável"
                />
              </Campo>
              <Campo label="Segmento">
                <input
                  className="input"
                  value={f.segmento}
                  onChange={(e) => set('segmento', e.target.value)}
                  placeholder="Ex.: Saúde"
                />
              </Campo>
              <Campo label="Plano">
                <select
                  className="input"
                  value={f.plano}
                  onChange={(e) => set('plano', e.target.value)}
                >
                  <option>Essencial</option>
                  <option>Performance</option>
                  <option>Escala</option>
                </select>
              </Campo>
              <Campo label="Ticket mensal (R$)">
                <input
                  className="input"
                  type="number"
                  value={f.ticket}
                  onChange={(e) => set('ticket', e.target.value)}
                  placeholder="0"
                />
              </Campo>
              <Campo label="Status">
                <select
                  className="input"
                  value={f.status}
                  onChange={(e) => set('status', e.target.value as ClienteStatus)}
                >
                  {STATUS.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Fase inicial">
                <select
                  className="input"
                  value={f.faseAtual}
                  onChange={(e) => set('faseAtual', e.target.value)}
                >
                  {FASES_RUGIDO.map((fa) => (
                    <option key={fa.id} value={fa.id}>
                      {fa.numero}. {fa.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Responsável" full>
                <select
                  className="input"
                  value={f.responsavelId}
                  onChange={(e) => set('responsavelId', e.target.value)}
                >
                  <option value="">— Sem responsável —</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} · {m.cargo}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            {erro && (
              <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                {erro}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onFechar} className="btn-ghost">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="btn-gold">
                {salvando ? 'Salvando…' : 'Criar cliente'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Campo({
  label,
  full,
  children,
}: {
  label: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1 block text-xs font-semibold text-ink-300">
        {label}
      </label>
      {children}
    </div>
  )
}
