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
  Flame,
  ShieldCheck,
  BarChart3,
  Route,
  Trophy,
  Check,
} from 'lucide-react'
import { brl } from '@/lib/format'
import { FASES_RUGIDO } from '@/data/rugido'

const FN = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/relatorio-publico`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` }
const num = (v: any) => Number(v) || 0

interface FaseProg {
  fase: string
  total: number
  concluidas: number
  tarefas: { titulo: string; status: string; prazo: string | null }[]
}
interface Dados {
  empresa: string
  segmento: string
  plano: string
  periodo: string
  metricas: Record<string, any>
  progresso: FaseProg[]
}

export default function RelatorioPublico() {
  const { token } = useParams()
  const [empresa, setEmpresa] = useState('')
  const [estado, setEstado] = useState<'carregando' | 'senha' | 'ok' | 'erro'>(
    'carregando',
  )
  const [senha, setSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [dados, setDados] = useState<Dados | null>(null)
  const [aba, setAba] = useState<'resultados' | 'projeto'>('resultados')

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
      const d = await r.json()
      setDados(d)
      const temTrafego =
        num(d.metricas.investimento) > 0 || num(d.metricas.leads) > 0
      setAba(temTrafego ? 'resultados' : 'projeto')
      setEstado('ok')
    } catch {
      setErroSenha('Erro ao acessar.')
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
            Painel de {empresa}
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
          {erroSenha && <p className="mt-2 text-xs text-red-400">{erroSenha}</p>}
          <button type="submit" className="btn-gold mt-4 w-full">
            Acessar painel
          </button>
        </motion.form>
      </Centro>
    )

  // ── Painel completo (fullscreen) ────────────────────────────────
  const d = dados!
  const m = d.metricas
  const temTrafego = num(m.investimento) > 0 || num(m.leads) > 0
  const criativos: { nome: string; resultado: string }[] = Array.isArray(
    m.criativos,
  )
    ? m.criativos
    : []

  return (
    <div className="min-h-screen">
      {/* Topo */}
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-ink-900/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold-500">
              Painel do Cliente
            </div>
            <div className="font-display text-lg font-extrabold text-ink-50">
              {d.empresa}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-ink-800 px-3 py-1 text-[11px] font-semibold text-gold-400 sm:block">
              {d.periodo}
            </span>
            <Marca />
          </div>
        </div>
        {/* Abas */}
        <div className="mx-auto flex max-w-6xl gap-1 px-5">
          {temTrafego && (
            <Aba
              ativa={aba === 'resultados'}
              onClick={() => setAba('resultados')}
              icon={BarChart3}
              label="Resultados de Tráfego"
            />
          )}
          <Aba
            ativa={aba === 'projeto'}
            onClick={() => setAba('projeto')}
            icon={Route}
            label="Andamento do Projeto"
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">
        {aba === 'resultados' && temTrafego ? (
          <AbaResultados m={m} criativos={criativos} progresso={d.progresso} />
        ) : (
          <AbaProjeto progresso={d.progresso} semTrafego={!temTrafego} />
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-5 text-center text-[11px] text-ink-600">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} /> Relatório confidencial · MyLion Digital
        </div>
      </footer>
    </div>
  )
}

// ── Aba: Resultados de tráfego ──────────────────────────────────────
function AbaResultados({
  m,
  criativos,
  progresso,
}: {
  m: Record<string, any>
  criativos: { nome: string; resultado: string }[]
  progresso: FaseProg[]
}) {
  const KPIS = [
    { l: 'Investimento', v: brl(num(m.investimento)), icon: Wallet, c: '#b8943f' },
    { l: 'Faturamento', v: brl(num(m.faturamento)), icon: TrendingUp, c: '#10b981' },
    { l: 'Leads', v: String(num(m.leads)), icon: Users, c: '#5b8def' },
    { l: 'Custo por lead', v: brl(num(m.cpl)), icon: Target, c: '#ec4899' },
    { l: 'CTR', v: `${num(m.ctr)}%`, icon: MousePointerClick, c: '#f59e0b' },
    { l: 'ROAS', v: `${num(m.roas)}x`, icon: Flame, c: '#ef4444' },
  ]
  const funil = [
    { l: 'Impressões', v: num(m.impressoes), c: '#5b8def' },
    { l: 'Cliques', v: num(m.cliques), c: '#8b5cf6' },
    { l: 'Leads', v: num(m.leads), c: '#ec4899' },
    { l: 'Conversões', v: num(m.conversoes), c: '#10b981' },
  ]
  const maxFunil = Math.max(...funil.map((f) => f.v), 1)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {KPIS.map((k) => (
          <div key={k.l} className="panel p-4">
            <k.icon size={18} style={{ color: k.c }} />
            <div className="mt-2 font-display text-xl font-bold text-ink-50">
              {k.v}
            </div>
            <div className="text-[11px] text-ink-500">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Funil */}
        <div className="panel p-6">
          <h2 className="font-display text-sm font-bold text-ink-100">
            Funil de conversão
          </h2>
          <div className="mt-5 space-y-2">
            {funil.map((f, i) => {
              const larg = Math.max(18, (f.v / maxFunil) * 100)
              const taxa =
                i > 0 && funil[i - 1].v
                  ? ((f.v / funil[i - 1].v) * 100).toFixed(1) + '%'
                  : null
              return (
                <div key={f.l}>
                  {taxa && (
                    <div className="py-0.5 text-center text-[10px] text-ink-600">
                      ↓ {taxa}
                    </div>
                  )}
                  <div
                    className="mx-auto flex items-center justify-between rounded-lg px-4 py-3 text-white"
                    style={{
                      width: `${larg}%`,
                      background: `linear-gradient(135deg, ${f.c}, ${f.c}bb)`,
                    }}
                  >
                    <span className="text-xs font-semibold">{f.l}</span>
                    <span className="font-display text-sm font-bold">
                      {f.v.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top criativos */}
        <div className="panel p-6">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink-100">
            <Trophy size={15} className="text-gold-300" /> Top 5 criativos
          </h2>
          <div className="mt-4 space-y-2">
            {criativos.length === 0 && (
              <p className="text-xs text-ink-500">
                Os melhores criativos do período aparecerão aqui.
              </p>
            )}
            {criativos.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-ink-850 p-2.5"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-ink-950"
                  style={{
                    background: ['#e7cc83', '#c9c9d2', '#c79a3a', '#4a4a57', '#4a4a57'][i],
                  }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-100">
                  {c.nome}
                </span>
                <span className="text-xs font-semibold text-gold-300">
                  {c.resultado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo das fases */}
      <ResumoFases progresso={progresso} />

      {m.observacoes && (
        <div className="panel p-6">
          <h2 className="font-display text-sm font-bold text-ink-100">
            Análise da equipe
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-300">
            {m.observacoes}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Aba: Andamento do projeto ───────────────────────────────────────
function AbaProjeto({
  progresso,
  semTrafego,
}: {
  progresso: FaseProg[]
  semTrafego: boolean
}) {
  return (
    <div className="space-y-4">
      {semTrafego && (
        <div className="panel flex items-center gap-2 p-4 text-sm text-ink-400">
          <Route size={16} className="text-gold-400" />
          Seu projeto está em estruturação. Abaixo, as fases e tarefas
          planejadas. Os resultados de tráfego aparecerão quando as campanhas
          entrarem no ar.
        </div>
      )}
      {FASES_RUGIDO.map((f) => {
        const p = progresso.find((x) => x.fase === f.id)
        const pct = p && p.total ? Math.round((p.concluidas / p.total) * 100) : 0
        return (
          <div key={f.id} className="panel overflow-hidden">
            <div
              className="flex items-center gap-3 p-4"
              style={{ background: `linear-gradient(135deg, ${f.cor}22, transparent)` }}
            >
              <span className="text-2xl">{f.simbolo}</span>
              <div className="flex-1">
                <div className="font-display text-sm font-bold text-ink-50">
                  {f.nome}
                </div>
                <div className="text-[11px] text-ink-500">{f.subtitulo}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: f.cor }}>
                  {pct}%
                </div>
                <div className="text-[10px] text-ink-500">
                  {p?.concluidas ?? 0}/{p?.total ?? 0}
                </div>
              </div>
            </div>
            {p && p.tarefas.length > 0 && (
              <div className="divide-y divide-white/[0.04] px-4 pb-2">
                {p.tarefas.map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2">
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                        t.status === 'concluida'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'border border-ink-500'
                      }`}
                    >
                      {t.status === 'concluida' && <Check size={10} />}
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        t.status === 'concluida'
                          ? 'text-ink-500 line-through'
                          : 'text-ink-200'
                      }`}
                    >
                      {t.titulo}
                    </span>
                    {t.prazo && (
                      <span className="text-[11px] text-ink-500">
                        {new Date(t.prazo).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ResumoFases({ progresso }: { progresso: FaseProg[] }) {
  return (
    <div className="panel p-6">
      <h2 className="font-display text-sm font-bold text-ink-100">
        Resumo do projeto · Método RUGIDO
      </h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FASES_RUGIDO.map((f) => {
          const p = progresso.find((x) => x.fase === f.id)
          const pct = p && p.total ? Math.round((p.concluidas / p.total) * 100) : 0
          return (
            <div
              key={f.id}
              className="rounded-xl border border-white/[0.05] bg-ink-850 p-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-200">
                <span>{f.simbolo}</span> {f.nome}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: f.cor }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Aba({
  ativa,
  onClick,
  icon: Icon,
  label,
}: {
  ativa: boolean
  onClick: () => void
  icon: typeof BarChart3
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
        ativa
          ? 'border-gold-400 text-gold-200'
          : 'border-transparent text-ink-500 hover:text-ink-200'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-4">{children}</div>
}

function Marca() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-grad font-display text-base font-extrabold text-ink-950">
        R
      </div>
      <span className="font-display text-xs font-bold tracking-wide text-ink-200">
        RUGIDO OS
      </span>
    </div>
  )
}
