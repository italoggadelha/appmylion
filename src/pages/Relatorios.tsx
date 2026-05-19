import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Users, ListChecks, CheckCircle2, Wallet } from 'lucide-react'
import { useData } from '@/lib/data'
import { FASES_RUGIDO } from '@/data/rugido'
import { brl, compactBrl } from '@/lib/format'
import { PageHeader } from '@/components/ui'

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs">
      <div className="font-semibold text-ink-100">{label ?? payload[0].name}</div>
      <div className="text-ink-400">{payload[0].value}</div>
    </div>
  )
}

export default function Relatorios() {
  const { clientes, tarefas, membros, aprovacoes, status } = useData()

  const r = useMemo(() => {
    const porStatus = status.map((s) => ({
      nome: s.nome,
      cor: s.cor,
      qtd: tarefas.filter((t) => t.status === s.chave).length,
    }))
    const porFase = FASES_RUGIDO.map((f) => ({
      nome: f.nome.split(' ')[0],
      cor: f.cor,
      qtd: tarefas.filter((t) => t.fase === f.id).length,
    }))
    const receitaCliente = [...clientes]
      .sort((a, b) => b.receitaGerada - a.receitaGerada)
      .slice(0, 8)
      .map((c) => ({ nome: c.empresa, valor: c.receitaGerada }))
    const produtividade = membros
      .map((m) => {
        const minhas = tarefas.filter((t) => t.responsavelId === m.id)
        return {
          nome: m.nome.split(' ')[0],
          total: minhas.length,
          feitas: minhas.filter((t) => t.status === 'concluida').length,
        }
      })
      .filter((m) => m.total > 0)
    const concluidas = tarefas.filter((t) => t.status === 'concluida').length
    return {
      porStatus,
      porFase,
      receitaCliente,
      produtividade,
      concluidas,
      mrr: clientes.filter((c) => c.status === 'ativo').reduce((s, c) => s + c.ticket, 0),
    }
  }, [clientes, tarefas, membros, status])

  const KPIS = [
    { label: 'Clientes', valor: String(clientes.length), icon: Users, cor: '#5b8def' },
    { label: 'Tarefas totais', valor: String(tarefas.length), icon: ListChecks, cor: '#8b5cf6' },
    { label: 'Concluídas', valor: String(r.concluidas), icon: CheckCircle2, cor: '#10b981' },
    { label: 'MRR', valor: compactBrl(r.mrr), icon: Wallet, cor: '#b8943f' },
  ]

  return (
    <div>
      <PageHeader
        titulo="Relatórios"
        subtitulo="Inteligência operacional da agência"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="panel p-4">
            <div
              className="grid h-9 w-9 place-items-center rounded-lg"
              style={{ backgroundColor: `${k.cor}1f`, color: k.cor }}
            >
              <k.icon size={17} />
            </div>
            <div className="mt-3 font-display text-2xl font-bold text-ink-50">
              {k.valor}
            </div>
            <div className="text-xs text-ink-400">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Tarefas por status */}
        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Tarefas por status
          </h3>
          <div className="mt-4 h-60">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={r.porStatus}
                  dataKey="qtd"
                  nameKey="nome"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {r.porStatus.map((s) => (
                    <Cell key={s.nome} fill={s.cor} />
                  ))}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2">
            {r.porStatus.map((s) => (
              <span
                key={s.nome}
                className="flex items-center gap-1.5 text-[11px] text-ink-400"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.cor }}
                />
                {s.nome} ({s.qtd})
              </span>
            ))}
          </div>
        </div>

        {/* Tarefas por fase */}
        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Volume de tarefas por fase RUGIDO
          </h3>
          <div className="mt-4 h-60">
            <ResponsiveContainer>
              <BarChart data={r.porFase}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d1d25" vertical={false} />
                <XAxis dataKey="nome" stroke="#4a4a57" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4a4a57" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: '#15151b' }} />
                <Bar dataKey="qtd" radius={[6, 6, 0, 0]}>
                  {r.porFase.map((f) => (
                    <Cell key={f.nome} fill={f.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Receita por cliente */}
        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Receita gerada por cliente
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={r.receitaCliente} layout="vertical" barSize={14}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="#4a4a57"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  cursor={{ fill: '#15151b' }}
                  content={({ active, payload }: any) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs text-ink-200">
                        {brl(payload[0].value)}
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]} fill="#b8943f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Produtividade */}
        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Produtividade da equipe
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={r.produtividade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d1d25" vertical={false} />
                <XAxis dataKey="nome" stroke="#4a4a57" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4a4a57" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: '#15151b' }} />
                <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]} fill="#272732" />
                <Bar dataKey="feitas" name="Concluídas" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resumo de aprovações */}
      <div className="panel mt-4 p-5">
        <h3 className="font-display text-sm font-bold text-ink-100">
          Aprovações — resumo
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: 'Pendentes', v: aprovacoes.filter((a) => a.status === 'pendente').length, c: '#8b5cf6' },
            { l: 'Aprovadas', v: aprovacoes.filter((a) => a.status === 'aprovado').length, c: '#10b981' },
            { l: 'Em ajustes', v: aprovacoes.filter((a) => a.status === 'ajustes').length, c: '#f59e0b' },
            { l: 'Reprovadas', v: aprovacoes.filter((a) => a.status === 'reprovado').length, c: '#ef4444' },
          ].map((x) => (
            <div
              key={x.l}
              className="rounded-xl border border-white/[0.05] bg-ink-850 p-3"
            >
              <div className="font-display text-xl font-bold" style={{ color: x.c }}>
                {x.v}
              </div>
              <div className="text-xs text-ink-400">{x.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
