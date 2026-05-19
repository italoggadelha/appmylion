import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts'
import {
  Users,
  TrendingUp,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'
import { useData } from '@/lib/data'
import { FASES_RUGIDO } from '@/data/rugido'
import { compactBrl, brl } from '@/lib/format'
import { Avatar, Badge, PageHeader, ProgressBar } from '@/components/ui'

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-ink-100">{label}</div>
      <div className="text-ink-400">
        {payload[0].name === 'v'
          ? brl(payload[0].value)
          : `${payload[0].value} cliente(s)`}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { clientes, tarefas, aprovacoes, membros } = useData()

  const m = useMemo(() => {
    const ativos = clientes.filter((c) => c.status === 'ativo')
    const mrr = ativos.reduce((s, c) => s + c.ticket, 0)
    const receitaTotal = clientes.reduce((s, c) => s + c.receitaGerada, 0)
    const aguardandoAprovacao = tarefas.filter(
      (t) => t.status === 'aguardando_aprovacao',
    ).length
    const travadas = tarefas.filter((t) => t.status === 'travada').length
    const atrasadas = tarefas.filter(
      (t) =>
        t.status !== 'concluida' &&
        t.prazo &&
        new Date(t.prazo).getTime() < Date.now(),
    ).length
    const concluidas = tarefas.filter((t) => t.status === 'concluida').length
    const slaEquipe = tarefas.length
      ? Math.round((concluidas / tarefas.length) * 100)
      : 0

    const porFase = FASES_RUGIDO.map((f) => ({
      nome: f.nome.split(' ')[0],
      qtd: clientes.filter((c) => c.faseAtual === f.id).length,
      cor: f.cor,
    }))

    const mrrSerie = [
      { mes: 'Dez', v: Math.round(mrr * 0.55) },
      { mes: 'Jan', v: Math.round(mrr * 0.64) },
      { mes: 'Fev', v: Math.round(mrr * 0.75) },
      { mes: 'Mar', v: Math.round(mrr * 0.85) },
      { mes: 'Abr', v: Math.round(mrr * 0.93) },
      { mes: 'Mai', v: mrr },
    ]

    const produtividade = membros
      .map((mb) => {
        const minhas = tarefas.filter((t) => t.responsavelId === mb.id)
        const feitas = minhas.filter((t) => t.status === 'concluida').length
        return {
          ...mb,
          pct: minhas.length ? Math.round((feitas / minhas.length) * 100) : 0,
        }
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6)

    const emRisco = clientes
      .filter((c) => c.healthScore < 65)
      .sort((a, b) => a.healthScore - b.healthScore)

    return {
      ativos,
      mrr,
      receitaTotal,
      aguardandoAprovacao,
      travadas,
      atrasadas,
      concluidas,
      slaEquipe,
      porFase,
      mrrSerie,
      produtividade,
      emRisco,
    }
  }, [clientes, tarefas, membros])

  const KPIS = [
    {
      label: 'Clientes ativos',
      valor: String(m.ativos.length),
      sub: `${clientes.length} no total`,
      icon: Users,
      cor: '#5b8def',
      delta: 'Operação',
    },
    {
      label: 'MRR',
      valor: compactBrl(m.mrr),
      sub: 'Receita recorrente',
      icon: TrendingUp,
      cor: '#10b981',
      delta: 'Mensal',
    },
    {
      label: 'Receita gerada',
      valor: compactBrl(m.receitaTotal),
      sub: 'Acumulado',
      icon: Wallet,
      cor: '#b8943f',
      delta: 'LTV',
    },
    {
      label: 'Aguardando aprovação',
      valor: String(m.aguardandoAprovacao),
      sub: 'Tarefas com cliente',
      icon: Clock,
      cor: '#8b5cf6',
      delta: 'Acompanhar',
    },
    {
      label: 'Tarefas atrasadas',
      valor: String(m.atrasadas),
      sub: `${m.travadas} travadas`,
      icon: AlertTriangle,
      cor: '#ef4444',
      delta: 'Gargalo',
    },
    {
      label: 'SLA da equipe',
      valor: `${m.slaEquipe}%`,
      sub: `${m.concluidas} tarefas concluídas`,
      icon: CheckCircle2,
      cor: '#10b981',
      delta: 'Performance',
    },
  ]

  return (
    <div>
      <PageHeader
        titulo="Dashboard Executivo"
        subtitulo="Visão geral da operação · Método RUGIDO"
        acao={
          <Link to="/clientes" className="btn-ghost">
            Ver clientes <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="panel panel-hover p-4"
          >
            <div className="flex items-center justify-between">
              <div
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: `${k.cor}1f`, color: k.cor }}
              >
                <k.icon size={17} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                {k.delta}
              </span>
            </div>
            <div className="mt-3 font-display text-2xl font-bold text-ink-50">
              {k.valor}
            </div>
            <div className="text-xs font-medium text-ink-300">{k.label}</div>
            <div className="text-[11px] text-ink-500">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-ink-100">
                Evolução da receita recorrente
              </h3>
              <p className="text-xs text-ink-500">Últimos 6 meses · MRR</p>
            </div>
            <Badge cor="#10b981">
              <ArrowUpRight size={12} /> tendência de alta
            </Badge>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <AreaChart data={m.mrrSerie}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b8943f" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#b8943f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1d1d25"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  stroke="#4a4a57"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#4a4a57"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => compactBrl(v)}
                />
                <Tooltip content={<TooltipBox />} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#d9b256"
                  strokeWidth={2.5}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Clientes por fase RUGIDO
          </h3>
          <p className="text-xs text-ink-500">Distribuição operacional</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={m.porFase} layout="vertical" barSize={16}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="#4a4a57"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip content={<TooltipBox />} cursor={{ fill: '#15151b' }} />
                <Bar dataKey="qtd" radius={[0, 6, 6, 0]}>
                  {m.porFase.map((f) => (
                    <Cell key={f.nome} fill={f.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink-100">
              ⚠️ Clientes em risco · Health Score baixo
            </h3>
            <Badge cor="#ef4444">{m.emRisco.length} requer atenção</Badge>
          </div>
          <div className="mt-3 divide-y divide-white/[0.05]">
            {m.emRisco.map((c) => (
              <Link
                key={c.id}
                to={`/clientes/${c.id}`}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-ink-800/50"
              >
                <Avatar nome={c.empresa} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-100">
                    {c.empresa}
                  </div>
                  <div className="text-xs text-ink-500">
                    {c.segmento} · resp. {c.responsavelNome}
                  </div>
                </div>
                <div className="w-32">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-ink-500">Health</span>
                    <span
                      className="font-bold"
                      style={{
                        color: c.healthScore < 50 ? '#ef4444' : '#f59e0b',
                      }}
                    >
                      {c.healthScore}
                    </span>
                  </div>
                  <ProgressBar
                    valor={c.healthScore}
                    cor={c.healthScore < 50 ? '#ef4444' : '#f59e0b'}
                  />
                </div>
              </Link>
            ))}
            {m.emRisco.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-500">
                Nenhum cliente em risco. 🎯
              </p>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Produtividade da equipe
          </h3>
          <p className="text-xs text-ink-500">% de tarefas concluídas</p>
          <div className="mt-3 space-y-3">
            {m.produtividade.map((mb) => (
              <div key={mb.id} className="flex items-center gap-3">
                <Avatar nome={mb.nome} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium text-ink-100">
                      {mb.nome}
                    </span>
                    <span className="font-bold text-gold-300">{mb.pct}%</span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar valor={mb.pct} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel mt-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Aprovações recentes
          </h3>
          <Link
            to="/aprovacoes"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300"
          >
            Ver todas →
          </Link>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {aprovacoes.slice(0, 6).map((a) => {
            const cor =
              a.status === 'aprovado'
                ? '#10b981'
                : a.status === 'reprovado'
                  ? '#ef4444'
                  : a.status === 'ajustes'
                    ? '#f59e0b'
                    : '#8b5cf6'
            return (
              <div
                key={a.id}
                className="rounded-xl border border-white/[0.06] bg-ink-850 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-ink-100">
                    {a.titulo}
                  </span>
                  <Badge cor={cor}>{a.status}</Badge>
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-500">
                  {a.tipo}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
