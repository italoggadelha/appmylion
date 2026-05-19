import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Lock,
  TrendingUp,
  Wallet,
  Users,
  Target,
  Eye,
  MousePointerClick,
  Activity,
  Flame,
  ShieldCheck,
} from 'lucide-react'
import { brl } from '@/lib/format'
import { FASES_RUGIDO } from '@/data/rugido'

const FN = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/relatorio-publico`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` }

interface Dados {
  empresa: string
  segmento: string
  plano: string
  faseAtual: string
  periodo: string
  metricas: Record<string, any>
  progresso: { fase: string; total: number; concluidas: number }[]
}

const num = (v: any) => Number(v) || 0

export default function RelatorioPublico() {
  const { token } = useParams()
  const [empresa, setEmpresa] = useState('')
  const [estado, setEstado] = useState<'carregando' | 'senha' | 'ok' | 'erro'>(
    'carregando',
  )
  const [senha, setSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [dados, setDados] = useState<Dados | null>(null)

  useEffect(() => {
    fetch(`${FN}?token=${encodeURIComponent(token ?? '')}`, { headers: H })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setEmpresa(d.empresa)
        setEstado(d.publicado ? 'senha' : 'erro')
      })
      .catch(() => setEstado('erro'))
  }, [token])

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErroSenha('')
    try {
      const r = await fetch(FN, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      })
      if (!r.ok) {
        setErroSenha('Senha incorreta.')
        return
      }
      setDados(await r.json())
      setEstado('ok')
    } catch {
      setErroSenha('Erro ao acessar. Tente novamente.')
    }
  }

  if (estado === 'carregando')
    return (
      <Centro>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
      </Centro>
    )

  if (estado === 'erro')
    return (
      <Centro>
        <div className="panel p-8 text-center">
          <Lock className="mx-auto text-red-400" size={30} />
          <h1 className="mt-3 font-display text-lg font-bold">
            Relatório indisponível
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Link inválido ou ainda não publicado.
          </p>
        </div>
      </Centro>
    )

  if (estado === 'senha')
    return (
      <Centro>
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={entrar}
          className="panel w-full max-w-sm p-7"
        >
          <Marca />
          <h1 className="mt-5 font-display text-lg font-bold text-ink-50">
            Relatório de {empresa}
          </h1>
          <p className="text-sm text-ink-400">
            Acesso restrito — informe a senha enviada pela equipe.
          </p>
          <input
            type="password"
            className="input mt-4"
            placeholder="Senha de acesso"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
          />
          {erroSenha && (
            <p className="mt-2 text-xs text-red-400">{erroSenha}</p>
          )}
          <button type="submit" className="btn-gold mt-4 w-full">
            Acessar relatório
          </button>
        </motion.form>
      </Centro>
    )

  // ── Relatório completo ──────────────────────────────────────────
  const m = dados!.metricas
  const KPIS = [
    { l: 'Investimento', v: brl(num(m.investimento)), icon: Wallet, c: '#b8943f' },
    { l: 'Faturamento', v: brl(num(m.faturamento)), icon: TrendingUp, c: '#10b981' },
    { l: 'Leads gerados', v: String(num(m.leads)), icon: Users, c: '#5b8def' },
    { l: 'Custo por lead', v: brl(num(m.cpl)), icon: Target, c: '#ec4899' },
    { l: 'Impressões', v: num(m.impressoes).toLocaleString('pt-BR'), icon: Eye, c: '#8b5cf6' },
    { l: 'Cliques', v: num(m.cliques).toLocaleString('pt-BR'), icon: MousePointerClick, c: '#06b6d4' },
    { l: 'CTR', v: `${num(m.ctr)}%`, icon: Activity, c: '#f59e0b' },
    { l: 'ROAS', v: `${num(m.roas)}x`, icon: Flame, c: '#ef4444' },
  ]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Marca />
          <span className="rounded-full bg-ink-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-400">
            {dados!.periodo}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel mt-5 overflow-hidden"
        >
          <div className="bg-ink-grad p-7">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold-500">
              Relatório de Tráfego Pago
            </div>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-ink-50">
              {dados!.empresa}
            </h1>
            <p className="text-sm text-ink-400">
              {dados!.segmento} · Plano {dados!.plano}
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
            {KPIS.map((k) => (
              <div
                key={k.l}
                className="rounded-xl border border-white/[0.06] bg-ink-850 p-3"
              >
                <k.icon size={16} style={{ color: k.c }} />
                <div className="mt-2 font-display text-lg font-bold text-ink-50">
                  {k.v}
                </div>
                <div className="text-[11px] text-ink-500">{k.l}</div>
              </div>
            ))}
          </div>

          {/* Progresso do projeto */}
          <div className="border-t border-white/[0.06] p-6">
            <h2 className="font-display text-sm font-bold text-ink-100">
              Andamento do projeto · Método RUGIDO
            </h2>
            <div className="mt-3 space-y-2.5">
              {FASES_RUGIDO.map((f) => {
                const p = dados!.progresso.find((x) => x.fase === f.id)
                const pct =
                  p && p.total ? Math.round((p.concluidas / p.total) * 100) : 0
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <span className="w-7 text-base">{f.simbolo}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-200">{f.nome}</span>
                        <span className="text-ink-500">{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: f.cor }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Observações */}
          {m.observacoes && (
            <div className="border-t border-white/[0.06] p-6">
              <h2 className="font-display text-sm font-bold text-ink-100">
                Análise da equipe
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-300">
                {m.observacoes}
              </p>
            </div>
          )}
        </motion.div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-600">
          <ShieldCheck size={12} /> Relatório confidencial · MyLion Digital
        </div>
      </div>
    </div>
  )
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-4">{children}</div>
}

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-grad font-display text-lg font-extrabold text-ink-950">
        R
      </div>
      <span className="font-display text-sm font-bold tracking-wide">
        RUGIDO OS
      </span>
    </div>
  )
}
