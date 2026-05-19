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
  Trophy,
  ListPlus,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Timer,
  Crown,
  ArrowRight,
} from 'lucide-react'
import { useData } from '@/lib/data'
import { FASES_RUGIDO } from '@/data/rugido'
import { compactBrl, brl, duracao } from '@/lib/format'
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

const MEDALHA = ['#e7cc83', '#c9c9d2', '#c79a3a']

export default function Dashboard() {
  const { clientes, tarefas, aprovacoes, membros } = useData()

  const m = useMemo(() => {
    const ativos = clientes.filter((c) => c.status === 'ativo')
    const mrr = ativos.reduce((s, c) => s + c.ticket, 0)
    const receitaTotal = clientes.reduce((s, c) => s + c.receitaGerada, 0)

    const concluidas = tarefas.filter((t) => t.status === 'concluida')
    const atrasadas = tarefas.filter(
      (t) =>
        t.status !== 'concluida' &&
        t.prazo &&
        new Date(t.prazo).getTime() < Date.now(),
    ).length
    const aFazer = tarefas.filter((t) => t.status === 'a_fazer').length
    const tempoMedio = concluidas.length
      ? concluidas.reduce((s, t) => s + t.tempoGastoSeg, 0) / concluidas.length
      : 0

    // Ranking / gamificação
    const ranking = membros
      .map((mb) => {
        const minhas = tarefas.filter((t) => t.responsavelId === mb.id)
        const feitas = minhas.filter((t) => t.status === 'concluida')
        const tempoTotal = feitas.reduce((s, t) => s + t.tempoGastoSeg, 0)
        return {
          ...mb,
          pontos: feitas.reduce((s, t) => s + t.pontos, 0),
          concluidas: feitas.length,
          ativas: minhas.length - feitas.length,
          tempoTotal,
          tempoMedio: feitas.length ? tempoTotal / feitas.length : 0,
        }
      })
      .sort((a, b) => b.pontos - a.pontos)

    // Tempo médio por função
    const funcoes = new Map<string, { tempo: number; qtd: number }>()
    for (const r of ranking) {
      const f = r.cargo ?? 'Sem função'
      const cur = funcoes.get(f) ?? { tempo: 0, qtd: 0 }
      cur.tempo += r.tempoTotal
      cur.qtd += r.concluidas
      funcoes.set(f, cur)
    }
    const porFuncao = [...funcoes.entries()].map(([nome, v]) => ({
      nome,
      media: v.qtd ? v.tempo / v.qtd : 0,
      qtd: v.qtd,
    }))

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
    const emRisco = clientes
      .filter((c) => c.healthScore < 65)
      .sort((a, b) => a.healthScore - b.healthScore)

    return {
      ativos,
      mrr,
      receitaTotal,
      criadas: tarefas.length,
      realizadas: concluidas.length,
      atrasadas,
      aFazer,
      tempoMedio,
      ranking,
      porFuncao,
      porFase,
      mrrSerie,
      emRisco,
    }
  }, [clientes, tarefas, membros])

  const podio = m.ranking.slice(0, 3)
  const maxPontos = m.ranking[0]?.pontos || 1

  const TASK_KPIS = [
    { label: 'Tarefas criadas', valor: m.criadas, icon: ListPlus, cor: '#5b8def' },
    { label: 'Realizadas', valor: m.realizadas, icon: CheckCircle2, cor: '#10b981' },
    { label: 'Em atraso', valor: m.atrasadas, icon: AlertTriangle, cor: '#ef4444' },
    { label: 'A fazer', valor: m.aFazer, icon: CircleDashed, cor: '#f59e0b' },
    { label: 'Tempo médio/tarefa', valor: duracao(m.tempoMedio), icon: Timer, cor: '#8b5cf6' },
  ]
  const NEG_KPIS = [
    { label: 'Clientes ativos', valor: String(m.ativos.length), sub: `${clientes.length} no total`, icon: Users, cor: '#5b8def' },
    { label: 'MRR', valor: compactBrl(m.mrr), sub: 'Receita recorrente', icon: TrendingUp, cor: '#10b981' },
    { label: 'Receita gerada', valor: compactBrl(m.receitaTotal), sub: 'Acumulado', icon: Wallet, cor: '#b8943f' },
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

      {/* ── RANKING / GAMIFICAÇÃO ── */}
      <div className="panel mb-4 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-gold-500/[0.05] px-5 py-3">
          <Trophy size={17} className="text-gold-300" />
          <h2 className="font-display text-sm font-bold text-ink-50">
            Ranking da Equipe
          </h2>
          <span className="text-xs text-ink-500">
            · pontos por tarefa concluída + carga de tempo
          </span>
        </div>

        {/* Pódio */}
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {podio.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-2xl border p-4 text-center"
              style={{
                borderColor: `${MEDALHA[i]}55`,
                background: `linear-gradient(170deg, ${MEDALHA[i]}1f, transparent)`,
              }}
            >
              {i === 0 && (
                <Crown
                  size={20}
                  className="absolute left-1/2 top-2 -translate-x-1/2 text-gold-300"
                />
              )}
              <div className="mt-3 flex justify-center">
                <div
                  className="rounded-full p-0.5"
                  style={{ background: MEDALHA[i] }}
                >
                  <Avatar nome={r.nome} size={52} />
                </div>
              </div>
              <div className="mt-2 text-sm font-bold text-ink-50">{r.nome}</div>
              <div className="text-[11px] text-ink-500">{r.cargo}</div>
              <div className="mt-2 font-display text-2xl font-extrabold gold-text">
                {r.pontos}
                <span className="text-xs font-semibold text-ink-500"> pts</span>
              </div>
              <div className="mt-1 flex justify-center gap-3 text-[11px] text-ink-500">
                <span>{r.concluidas} tarefas</span>
                <span>{duracao(r.tempoTotal)}</span>
              </div>
              <div
                className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-ink-950"
                style={{ background: MEDALHA[i] }}
              >
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Restante do ranking */}
        {m.ranking.length > 3 && (
          <div className="space-y-1 border-t border-white/[0.05] px-5 py-3">
            {m.ranking.slice(3).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 py-1.5">
                <span className="w-5 text-center text-xs font-bold text-ink-500">
                  {i + 4}
                </span>
                <Avatar nome={r.nome} size={28} />
                <span className="flex-1 text-sm text-ink-100">{r.nome}</span>
                <span className="text-[11px] text-ink-500">
                  {r.concluidas} tarefas · {duracao(r.tempoTotal)}
                </span>
                <div className="w-24">
                  <ProgressBar valor={(r.pontos / maxPontos) * 100} />
                </div>
                <span className="w-12 text-right text-sm font-bold text-gold-300">
                  {r.pontos}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Métricas de tarefas ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {TASK_KPIS.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="panel p-4"
          >
            <div
              className="grid h-9 w-9 place-items-center rounded-lg"
              style={{ backgroundColor: `${k.cor}1f`, color: k.cor }}
            >
              <k.icon size={17} />
            </div>
            <div className="mt-3 font-display text-xl font-bold text-ink-50">
              {k.valor}
            </div>
            <div className="text-xs text-ink-400">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── KPIs de negócio ── */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {NEG_KPIS.map((k) => (
          <div key={k.label} className="panel panel-hover p-4">
            <div className="flex items-center gap-3">
              <div
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: `${k.cor}1f`, color: k.cor }}
              >
                <k.icon size={17} />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-ink-50">
                  {k.valor}
                </div>
                <div className="text-xs text-ink-400">{k.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráficos ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Evolução da receita recorrente
          </h3>
          <p className="text-xs text-ink-500">Últimos 6 meses · MRR</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer>
              <AreaChart data={m.mrrSerie}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b8943f" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#b8943f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d1d25" vertical={false} />
                <XAxis dataKey="mes" stroke="#4a4a57" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4a4a57" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => compactBrl(v)} />
                <Tooltip content={<TooltipBox />} />
                <Area type="monotone" dataKey="v" stroke="#d9b256" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Clientes por fase RUGIDO
          </h3>
          <p className="text-xs text-ink-500">Distribuição operacional</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer>
              <BarChart data={m.porFase} layout="vertical" barSize={16}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" stroke="#4a4a57" fontSize={11} tickLine={false} axisLine={false} width={64} />
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

      {/* ── Tempo médio por função/membro + risco ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Tempo médio por função
          </h3>
          <p className="text-xs text-ink-500">Por tarefa concluída</p>
          <div className="mt-3 space-y-2">
            {m.porFuncao.map((f) => (
              <div
                key={f.nome}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-ink-850 px-3 py-2"
              >
                <span className="text-xs text-ink-200">{f.nome}</span>
                <span className="text-xs font-semibold text-gold-300">
                  {duracao(f.media)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Tempo médio por membro
          </h3>
          <p className="text-xs text-ink-500">Compare a produtividade</p>
          <div className="mt-3 space-y-2.5">
            {m.ranking.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5">
                <Avatar nome={r.nome} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-ink-100">
                    {r.nome}
                  </div>
                  <div className="text-[10px] text-ink-500">{r.cargo}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-ink-100">
                    {duracao(r.tempoMedio)}
                  </div>
                  <div className="text-[10px] text-ink-500">
                    {r.concluidas} tarefas
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink-100">
              ⚠️ Clientes em risco
            </h3>
            <Badge cor="#ef4444">{m.emRisco.length}</Badge>
          </div>
          <div className="mt-2 divide-y divide-white/[0.05]">
            {m.emRisco.map((c) => (
              <Link
                key={c.id}
                to={`/clientes/${c.id}`}
                className="flex items-center gap-3 py-2.5 hover:bg-ink-800/40"
              >
                <Avatar nome={c.empresa} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink-100">
                    {c.empresa}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    Health {c.healthScore}
                  </div>
                </div>
                <div className="w-16">
                  <ProgressBar
                    valor={c.healthScore}
                    cor={c.healthScore < 50 ? '#ef4444' : '#f59e0b'}
                  />
                </div>
              </Link>
            ))}
            {m.emRisco.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-500">
                Tudo sob controle. 🎯
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Aprovações recentes */}
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
