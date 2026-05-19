import { useState, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  Mail,
  Bell,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  listarNotifConfig,
  salvarNotifConfig,
  criarNotifConfig,
  excluirNotifConfig,
} from '@/lib/chat'
import { confirmar } from '@/lib/confirmar'
import type { NotifConfig } from '@/lib/types'

const CANAIS = [
  { k: 'canalWhatsapp' as const, l: 'WhatsApp', icon: MessageCircle, c: '#10b981' },
  { k: 'canalEmail' as const, l: 'E-mail', icon: Mail, c: '#5b8def' },
  { k: 'canalInterno' as const, l: 'Interno', icon: Bell, c: '#b8943f' },
]

export default function AbaNotificacoes() {
  const [lista, setLista] = useState<NotifConfig[]>([])
  const [criando, setCriando] = useState(false)
  const [novo, setNovo] = useState({ nome: '', gatilho: '', mensagem: '' })

  const recarregar = useCallback(async () => {
    try {
      setLista(await listarNotifConfig())
    } catch {
      setLista([])
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  async function patch(n: NotifConfig, campos: Partial<NotifConfig>) {
    setLista((l) => l.map((x) => (x.id === n.id ? { ...x, ...campos } : x)))
    await salvarNotifConfig({ ...n, ...campos, id: n.id })
  }

  async function criar() {
    if (!novo.nome.trim()) return
    await criarNotifConfig({
      nome: novo.nome,
      gatilho: novo.gatilho || 'Manual',
      mensagem: novo.mensagem,
    })
    setNovo({ nome: '', gatilho: '', mensagem: '' })
    setCriando(false)
    await recarregar()
  }

  async function remover(id: string, nome: string) {
    const ok = await confirmar({
      titulo: 'Remover notificação?',
      mensagem: `A notificação "${nome}" será excluída.`,
      perigoso: true,
      confirmar: 'Remover',
    })
    if (!ok) return
    await excluirNotifConfig(id)
    await recarregar()
  }

  return (
    <div className="space-y-3">
      <div className="panel p-4 text-xs leading-relaxed text-ink-400">
        Escolha por quais canais cada evento do sistema gera notificação. Use{' '}
        <code className="text-gold-300">{'{{nome_cliente}}'}</code> e{' '}
        <code className="text-gold-300">{'{{fase_projeto}}'}</code> como
        variáveis dinâmicas na mensagem.
      </div>

      <div className="flex justify-end">
        <button className="btn-gold" onClick={() => setCriando((v) => !v)}>
          <Plus size={15} /> Nova notificação
        </button>
      </div>

      {criando && (
        <div className="panel space-y-3 p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Notificação personalizada
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input"
              placeholder="Nome da notificação"
              value={novo.nome}
              onChange={(e) => setNovo((p) => ({ ...p, nome: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Gatilho (quando dispara)"
              value={novo.gatilho}
              onChange={(e) => setNovo((p) => ({ ...p, gatilho: e.target.value }))}
            />
          </div>
          <textarea
            className="input min-h-[60px] resize-y"
            placeholder="Mensagem — ex.: Olá {{nome_cliente}}, seu projeto entrou na fase {{fase_projeto}}."
            value={novo.mensagem}
            onChange={(e) => setNovo((p) => ({ ...p, mensagem: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setCriando(false)} className="btn-ghost">
              <X size={14} /> Cancelar
            </button>
            <button onClick={criar} className="btn-gold">
              Criar
            </button>
          </div>
        </div>
      )}

      <div className="panel overflow-hidden">
        {lista.map((n) => (
          <div
            key={n.id}
            className="flex flex-wrap items-center gap-3 border-b border-white/[0.04] p-3.5 last:border-0"
          >
            <button
              onClick={() => patch(n, { ativa: !n.ativa })}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                n.ativa ? 'bg-gold-500' : 'bg-ink-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                  n.ativa ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-100">
                {n.nome}
                {n.custom && (
                  <span className="rounded bg-fase-raiox/20 px-1.5 text-[10px] font-bold text-fase-raiox">
                    personalizada
                  </span>
                )}
              </div>
              <div className="text-[11px] text-ink-500">
                Gatilho: {n.gatilho}
              </div>
            </div>
            <div className="flex gap-1.5">
              {CANAIS.map((ca) => {
                const on = n[ca.k]
                return (
                  <button
                    key={ca.k}
                    onClick={() => patch(n, { [ca.k]: !on } as any)}
                    title={ca.l}
                    className="grid h-8 w-8 place-items-center rounded-lg transition-all"
                    style={{
                      backgroundColor: on ? `${ca.c}22` : '#15151b',
                      color: on ? ca.c : '#4a4a57',
                    }}
                  >
                    <ca.icon size={15} />
                  </button>
                )
              })}
            </div>
            {n.custom && (
              <button
                onClick={() => remover(n.id, n.nome)}
                className="text-ink-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
