import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useData } from '@/lib/data'
import { uploadArquivo } from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { FASES_RUGIDO } from '@/data/rugido'
import { Avatar } from './ui'
import type { ClienteStatus, Cliente } from '@/lib/types'

const STATUS: { v: ClienteStatus; l: string }[] = [
  { v: 'onboarding', l: 'Onboarding' },
  { v: 'ativo', l: 'Ativo' },
  { v: 'pausado', l: 'Pausado' },
]

const VAZIO = {
  empresa: '',
  nome: '',
  segmento: '',
  plano: 'Performance',
  ticket: '',
  status: 'onboarding' as ClienteStatus,
  faseAtual: 'raiox',
  responsavelId: '',
  driveUrl: '',
  mesesContrato: '6',
  whatsapp: '',
  email: '',
}

export default function NovoClienteModal({
  aberto,
  onFechar,
  cliente,
}: {
  aberto: boolean
  onFechar: () => void
  cliente?: Cliente
}) {
  const { membros, novoCliente, editarCliente } = useData()
  const editando = !!cliente
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [foto, setFoto] = useState('')
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [f, setF] = useState({ ...VAZIO })

  useEffect(() => {
    if (!aberto) return
    if (cliente) {
      setF({
        empresa: cliente.empresa,
        nome: cliente.nome ?? '',
        segmento: cliente.segmento ?? '',
        plano: cliente.plano ?? 'Performance',
        ticket: String(cliente.ticket ?? ''),
        status: cliente.status,
        faseAtual: cliente.faseAtual,
        responsavelId: cliente.responsavelId ?? '',
        driveUrl: cliente.driveUrl ?? '',
        mesesContrato: String(cliente.mesesContrato ?? '6'),
        whatsapp: cliente.whatsapp ?? '',
        email: cliente.email ?? '',
      })
      setFoto(cliente.logoUrl ?? '')
    } else {
      setF({ ...VAZIO })
      setFoto('')
    }
    setErro('')
  }, [aberto, cliente])

  async function subirFoto(file: File) {
    setEnviandoFoto(true)
    try {
      setFoto(await uploadArquivo(file))
    } catch {
      setErro('Falha ao enviar a foto.')
    } finally {
      setEnviandoFoto(false)
    }
  }

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
      const dados = {
        ...f,
        faseAtual: f.faseAtual as any,
        ticket: Number(f.ticket) || 0,
        responsavelId: f.responsavelId || undefined,
        logoUrl: foto || undefined,
        driveUrl: f.driveUrl || undefined,
        mesesContrato: Number(f.mesesContrato) || undefined,
        whatsapp: f.whatsapp || undefined,
        email: f.email || undefined,
      }
      if (editando) await editarCliente(cliente!.id, dados)
      else await novoCliente(dados)
      onFechar()
      setFoto('')
      setF({ ...VAZIO })
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
          className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
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
                {editando ? 'Editar cliente' : 'Novo cliente'}
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
              <div className="flex items-center gap-3 sm:col-span-2">
                <Avatar nome={f.empresa || '?'} url={foto} size={56} />
                <label className="btn-ghost cursor-pointer text-xs">
                  {enviandoFoto
                    ? 'Enviando…'
                    : foto
                      ? 'Trocar foto'
                      : 'Foto de perfil'}
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
              <Campo label="WhatsApp (com DDD)">
                <input
                  className="input"
                  value={f.whatsapp}
                  onChange={(e) => set('whatsapp', e.target.value)}
                  placeholder="Ex.: 5511999990000"
                />
              </Campo>
              <Campo label="E-mail">
                <input
                  className="input"
                  type="email"
                  value={f.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="cliente@email.com"
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
              <Campo label="Responsável">
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
              <Campo label="Contrato (meses)">
                <select
                  className="input"
                  value={f.mesesContrato}
                  onChange={(e) => set('mesesContrato', e.target.value)}
                >
                  {['3', '6', '9', '12'].map((m) => (
                    <option key={m} value={m}>
                      {m} meses
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Link do Google Drive (materiais)" full>
                <input
                  className="input"
                  placeholder="https://drive.google.com/…"
                  value={f.driveUrl}
                  onChange={(e) => set('driveUrl', e.target.value)}
                />
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
                {salvando
                  ? 'Salvando…'
                  : editando
                    ? 'Salvar alterações'
                    : 'Criar cliente'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
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
