import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Lock,
  Wallet,
  TrendingUp,
  Sparkles,
  Flame,
  ShieldCheck,
  BarChart3,
  Route,
  Trophy,
  Check,
  CreditCard,
} from 'lucide-react'
import { brl } from '@/lib/format'
import { FASES_RUGIDO } from '@/data/rugido'
import BrasilMapa from '@/components/BrasilMapa'

const FN = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/relatorio-publico`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` }
const num = (v: any) => Number(v) || 0
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—')

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
      const temTrafego = num(d.metricas.investimento) > 0 || num(d.metricas.leads) > 0
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

  const d = dados!
  const temTrafego =
    num(d.metricas.investimento) > 0 || num(d.metricas.leads) > 0

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-ink-900/90 backdrop-blur">
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
        <div className="mx-auto flex max-w-6xl gap-1 px-5">
          {temTrafego && (
            <Aba
              ativa={aba === 'resultados'}
              onClick={() => setAba('resultados')}
              icon={BarChart3}
              label="Resultados"
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
          <AbaResultados m={d.metricas} progresso={d.progresso} />
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

// ════════════════════════════════════════════════════════════════════
// ABA RESULTADOS — dashboard premium
// ════════════════════════════════════════════════════════════════════
function AbaResultados({
  m,
  progresso,
}: {
  m: Record<string, any>
  progresso: FaseProg[]
}) {
  const investimento = num(m.investimento)
  const faturamento = num(m.faturamento)
  const lucro = faturamento - investimento
  const roas = investimento ? faturamento / investimento : 0

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Hero
          label="Faturamento"
          valor={brl(faturamento)}
          icon={TrendingUp}
          cor="#10b981"
          destaque
        />
        <Hero
          label="Investimento total"
          valor={brl(investimento)}
          icon={Wallet}
          cor="#b8943f"
        />
        <Hero
          label="Lucro (− investimento)"
          valor={brl(lucro)}
          icon={Sparkles}
          cor={lucro >= 0 ? '#10b981' : '#ef4444'}
          destaque
        />
        <Hero
          label="ROAS"
          valor={`${roas.toFixed(2)}x`}
          icon={Flame}
          cor="#ef4444"
        />
      </div>

      <Funil m={m} investimento={investimento} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Genero m={m} />
        <Pagamentos m={m} />
      </div>

      <CriativosTabela m={m} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DiasSemana m={m} />
        <div className="panel p-5">
          <h2 className="font-display text-sm font-bold text-ink-100">
            Vendas por região do Brasil
          </h2>
          <div className="mt-2">
            <BrasilMapa
              dados={{
                norte: num(m.regiao_norte),
                nordeste: num(m.regiao_nordeste),
                centrooeste: num(m.regiao_centrooeste),
                sudeste: num(m.regiao_sudeste),
                sul: num(m.regiao_sul),
              }}
            />
          </div>
        </div>
      </div>

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

function Hero({
  label,
  valor,
  icon: Icon,
  cor,
  destaque,
}: {
  label: string
  valor: string
  icon: typeof Wallet
  cor: string
  destaque?: boolean
}) {
  return (
    <div
      className="panel relative overflow-hidden p-5"
      style={
        destaque
          ? { background: `linear-gradient(150deg, ${cor}1f, transparent 70%)` }
          : undefined
      }
    >
      <div
        className="grid h-10 w-10 place-items-center rounded-xl"
        style={{ backgroundColor: `${cor}22`, color: cor }}
      >
        <Icon size={19} />
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold text-ink-50">
        {valor}
      </div>
      <div className="text-xs text-ink-400">{label}</div>
    </div>
  )
}

// ── Funil de conversão ──────────────────────────────────────────────
function Funil({
  m,
  investimento,
}: {
  m: Record<string, any>
  investimento: number
}) {
  const etapas = [
    { l: 'Impressões', v: num(m.impressoes), c: '#5b8def' },
    { l: 'Cliques', v: num(m.cliques), c: '#6d8fe8' },
    { l: 'Visitas', v: num(m.visitas), c: '#8b5cf6' },
    { l: 'Leads', v: num(m.leads), c: '#ec4899' },
    { l: 'Vendas', v: num(m.vendas), c: '#10b981' },
  ]
  const largs = [100, 84, 68, 52, 36]
  const topo = etapas[0].v || 1

  return (
    <div className="panel p-6">
      <h2 className="font-display text-sm font-bold text-ink-100">
        Funil de conversão
      </h2>
      <p className="text-xs text-ink-500">
        Conversão entre etapas e custo de cada ação
      </p>
      <div className="mt-5 space-y-1.5">
        {etapas.map((e, i) => {
          const ant = i > 0 ? etapas[i - 1].v : e.v
          const custo = e.v ? investimento / e.v : 0
          return (
            <div key={e.l}>
              {i > 0 && (
                <div className="py-0.5 text-center text-[10px] text-ink-500">
                  ↓ {pct(e.v, ant)} da etapa anterior
                </div>
              )}
              <div
                className="mx-auto flex items-center gap-3 rounded-xl px-4 py-3 text-white"
                style={{
                  width: `${largs[i]}%`,
                  background: `linear-gradient(135deg, ${e.c}, ${e.c}bb)`,
                }}
              >
                <span className="text-xs font-bold uppercase tracking-wide opacity-90">
                  {e.l}
                </span>
                <span className="ml-auto font-display text-lg font-extrabold">
                  {e.v.toLocaleString('pt-BR')}
                </span>
                <span className="hidden text-right text-[10px] leading-tight opacity-90 sm:block">
                  {brl(custo)}
                  <br />
                  por ação
                </span>
                <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-bold">
                  {pct(e.v, topo)} do topo
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Gênero ──────────────────────────────────────────────────────────
function Genero({ m }: { m: Record<string, any> }) {
  const h = num(m.homens)
  const mu = num(m.mulheres)
  const tot = h + mu || 1
  const ph = Math.round((h / tot) * 100)
  const pm = 100 - ph

  return (
    <div className="panel p-5">
      <h2 className="font-display text-sm font-bold text-ink-100">
        Público por gênero
      </h2>
      <div className="mt-4 flex items-end justify-center gap-10">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 24 32" className="h-16 w-16" fill="#5b8def">
            <circle cx="12" cy="5" r="4" />
            <path d="M7 12h10l2 11h-3l-1 9h-2l-1-9h-1l-1 9H7l-1-9H3z" />
          </svg>
          <div className="mt-1 font-display text-xl font-extrabold text-ink-50">
            {ph}%
          </div>
          <div className="text-[11px] text-ink-500">Homens · {h}</div>
        </div>
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 24 32" className="h-16 w-16" fill="#ec4899">
            <circle cx="12" cy="5" r="4" />
            <path d="M12 10c3 0 5 2 6 7l1 6h-3l1 9h-10l1-9H6l1-6c1-5 3-7 5-7z" />
          </svg>
          <div className="mt-1 font-display text-xl font-extrabold text-ink-50">
            {pm}%
          </div>
          <div className="text-[11px] text-ink-500">Mulheres · {mu}</div>
        </div>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full">
        <div style={{ width: `${ph}%`, background: '#5b8def' }} />
        <div style={{ width: `${pm}%`, background: '#ec4899' }} />
      </div>
    </div>
  )
}

// ── Formas de pagamento ─────────────────────────────────────────────
function Pagamentos({ m }: { m: Record<string, any> }) {
  const lista: { nome: string; valor: any }[] = Array.isArray(m.pagamentos)
    ? m.pagamentos
    : []
  const total = lista.reduce((s, p) => s + num(p.valor), 0) || 1

  return (
    <div className="panel p-5">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink-100">
        <CreditCard size={15} className="text-gold-300" /> Formas de pagamento
      </h2>
      <div className="mt-3 space-y-2.5">
        {lista.length === 0 && (
          <p className="text-xs text-ink-500">Sem dados de pagamento.</p>
        )}
        {lista.map((p, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs">
              <span className="text-ink-200">{p.nome}</span>
              <span className="font-semibold text-ink-100">
                {brl(num(p.valor))}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-gold-grad"
                style={{ width: `${(num(p.valor) / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tabela de criativos ─────────────────────────────────────────────
function corNum(t: 'bom' | 'padrao' | 'ruim') {
  return t === 'bom'
    ? { backgroundColor: '#10b98122', color: '#34d399' }
    : t === 'ruim'
      ? { backgroundColor: '#ef444422', color: '#f87171' }
      : { backgroundColor: '#f59e0b22', color: '#fbbf24' }
}

function CriativosTabela({ m }: { m: Record<string, any> }) {
  const lista: any[] = Array.isArray(m.criativos) ? m.criativos : []
  if (!lista.length)
    return (
      <div className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink-100">
          <Trophy size={15} className="text-gold-300" /> Top 5 criativos
        </h2>
        <p className="mt-2 text-xs text-ink-500">
          Os melhores criativos do período aparecerão aqui.
        </p>
      </div>
    )

  const calc = lista.slice(0, 5).map((c) => {
    const inv = num(c.investimento)
    const fat = num(c.faturamento)
    const imp = num(c.impressoes)
    const res = num(c.vendas) || num(c.leads)
    return {
      nome: c.nome,
      fat,
      inv,
      cpm: imp ? (inv / imp) * 1000 : 0,
      custoRes: res ? inv / res : 0,
      roas: inv ? fat / inv : 0,
    }
  })

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 p-5 pb-3">
        <Trophy size={15} className="text-gold-300" />
        <h2 className="font-display text-sm font-bold text-ink-100">
          Top 5 criativos
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-ink-500">
              <th className="px-4 py-2 text-left">Criativo</th>
              <th className="px-3 py-2 text-right">Faturamento</th>
              <th className="px-3 py-2 text-right">Investimento</th>
              <th className="px-3 py-2 text-right">CPM</th>
              <th className="px-3 py-2 text-right">Custo/result.</th>
              <th className="px-3 py-2 text-right">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {calc.map((c, i) => (
              <tr key={i} className="border-t border-white/[0.04]">
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span
                      className="grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-ink-950"
                      style={{
                        background: ['#e7cc83', '#c9c9d2', '#c79a3a', '#4a4a57', '#4a4a57'][i],
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-ink-100">{c.nome}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-ink-200">
                  {brl(c.fat)}
                </td>
                <td className="px-3 py-2.5 text-right text-ink-200">
                  {brl(c.inv)}
                </td>
                <td className="px-2 py-2 text-right">
                  <span
                    className="rounded-md px-2 py-1 text-xs font-semibold"
                    style={corNum(c.cpm < 25 ? 'bom' : c.cpm < 60 ? 'padrao' : 'ruim')}
                  >
                    {brl(c.cpm)}
                  </span>
                </td>
                <td className="px-2 py-2 text-right">
                  <span
                    className="rounded-md px-2 py-1 text-xs font-semibold"
                    style={corNum(
                      c.custoRes && c.custoRes < 30
                        ? 'bom'
                        : c.custoRes < 80
                          ? 'padrao'
                          : 'ruim',
                    )}
                  >
                    {brl(c.custoRes)}
                  </span>
                </td>
                <td className="px-2 py-2 text-right">
                  <span
                    className="rounded-md px-2 py-1 text-xs font-bold"
                    style={corNum(
                      c.roas >= 3 ? 'bom' : c.roas >= 1.5 ? 'padrao' : 'ruim',
                    )}
                  >
                    {c.roas.toFixed(1)}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Dias da semana (temperatura) ────────────────────────────────────
function DiasSemana({ m }: { m: Record<string, any> }) {
  const dias = [
    { k: 'dom', l: 'Dom' },
    { k: 'seg', l: 'Seg' },
    { k: 'ter', l: 'Ter' },
    { k: 'qua', l: 'Qua' },
    { k: 'qui', l: 'Qui' },
    { k: 'sex', l: 'Sex' },
    { k: 'sab', l: 'Sáb' },
  ]
  const vals = dias.map((d) => num(m['dia_' + d.k]))
  const max = Math.max(...vals, 1)
  const heat = (v: number) => {
    const t = v / max
    if (t === 0) return '#1d1d25'
    if (t < 0.34) return '#5b8def'
    if (t < 0.67) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="panel p-5">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink-100">
        <Flame size={15} className="text-red-400" /> Vendas por dia da semana
      </h2>
      <div className="mt-4 flex items-end justify-between gap-2">
        {dias.map((d, i) => (
          <div key={d.k} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-bold text-ink-200">{vals[i]}</span>
            <div
              className="w-full rounded-lg"
              style={{
                height: `${20 + (vals[i] / max) * 90}px`,
                background: `linear-gradient(180deg, ${heat(vals[i])}, ${heat(vals[i])}88)`,
              }}
            />
            <span className="text-[10px] text-ink-500">{d.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Aba projeto ─────────────────────────────────────────────────────
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
        const pc = p && p.total ? Math.round((p.concluidas / p.total) * 100) : 0
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
                  {pc}%
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
          const pc = p && p.total ? Math.round((p.concluidas / p.total) * 100) : 0
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
                  style={{ width: `${pc}%`, backgroundColor: f.cor }}
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
