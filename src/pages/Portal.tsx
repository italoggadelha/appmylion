import { useState, useEffect } from 'react'
import { Copy, ExternalLink, Save, Globe, BarChart3 } from 'lucide-react'
import { useData } from '@/lib/data'
import { getRelatorioCliente, salvarRelatorio, type RelatorioTrafego } from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { Avatar, Badge, PageHeader } from '@/components/ui'

const CAMPOS_METRICA = [
  { k: 'investimento', l: 'Investimento (R$)' },
  { k: 'faturamento', l: 'Faturamento (R$)' },
  { k: 'leads', l: 'Leads gerados' },
  { k: 'cpl', l: 'Custo por lead (R$)' },
  { k: 'impressoes', l: 'Impressões' },
  { k: 'cliques', l: 'Cliques' },
  { k: 'ctr', l: 'CTR (%)' },
  { k: 'roas', l: 'ROAS (x)' },
]

export default function Portal() {
  const { clientes } = useData()
  const [sel, setSel] = useState('')
  const [rel, setRel] = useState<RelatorioTrafego | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    periodo: 'Maio 2026',
    senha: 'mylion',
    publicado: false,
    metricas: {} as Record<string, string>,
    observacoes: '',
  })

  useEffect(() => {
    if (!sel) return
    setCarregando(true)
    getRelatorioCliente(sel)
      .then((r) => {
        setRel(r)
        if (r) {
          setForm({
            periodo: r.periodo,
            senha: r.senha,
            publicado: r.publicado,
            metricas: Object.fromEntries(
              CAMPOS_METRICA.map((c) => [c.k, String(r.metricas[c.k] ?? '')]),
            ),
            observacoes: r.metricas.observacoes ?? '',
          })
        } else {
          setForm({
            periodo: 'Maio 2026',
            senha: 'mylion',
            publicado: false,
            metricas: {},
            observacoes: '',
          })
        }
      })
      .finally(() => setCarregando(false))
  }, [sel])

  async function salvar() {
    if (!sel) return
    if (!SUPABASE_PRONTO) return alert('Disponível com o backend conectado.')
    setSalvando(true)
    try {
      const metricas: Record<string, any> = { observacoes: form.observacoes }
      for (const c of CAMPOS_METRICA)
        metricas[c.k] = Number(form.metricas[c.k]) || 0
      const r = await salvarRelatorio(sel, {
        periodo: form.periodo,
        senha: form.senha,
        publicado: form.publicado,
        metricas,
      })
      setRel(r)
      alert('Relatório salvo.')
    } catch {
      alert('Falha ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const link = rel ? `${window.location.origin}/relatorio/${rel.token}` : ''

  return (
    <div>
      <PageHeader
        titulo="Portal do Cliente"
        subtitulo="Relatórios de tráfego pago com acesso por senha"
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Lista de clientes */}
        <div className="panel h-fit p-3">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-500">
            Clientes
          </div>
          <div className="mt-1 space-y-1">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSel(c.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors ${
                  sel === c.id ? 'bg-gold-500/10' : 'hover:bg-ink-800'
                }`}
              >
                <Avatar nome={c.empresa} size={30} />
                <span className="truncate text-sm text-ink-100">
                  {c.empresa}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        {!sel ? (
          <div className="panel grid place-items-center py-20 text-center text-sm text-ink-500">
            <div>
              <Globe size={28} className="mx-auto text-ink-600" />
              <p className="mt-2">Selecione um cliente para configurar o relatório.</p>
            </div>
          </div>
        ) : carregando ? (
          <div className="panel grid place-items-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status + link */}
            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink-100">
                  <BarChart3 size={16} className="text-gold-400" />
                  Relatório de tráfego
                </h3>
                <Badge cor={form.publicado ? '#10b981' : '#4a4a57'}>
                  {form.publicado ? 'Publicado' : 'Rascunho'}
                </Badge>
              </div>

              {rel && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-900 px-2.5 py-2">
                  <span className="truncate font-mono text-[11px] text-ink-400">
                    {link}
                  </span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(link)}
                    className="ml-auto text-ink-400 hover:text-gold-300"
                  >
                    <Copy size={14} />
                  </button>
                  <a href={link} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-gold-300">
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Campo label="Período">
                  <input
                    className="input"
                    value={form.periodo}
                    onChange={(e) => setForm((f) => ({ ...f, periodo: e.target.value }))}
                  />
                </Campo>
                <Campo label="Senha de acesso do cliente">
                  <input
                    className="input"
                    value={form.senha}
                    onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  />
                </Campo>
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-200">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(e) => setForm((f) => ({ ...f, publicado: e.target.checked }))}
                  className="h-4 w-4 accent-gold-500"
                />
                Publicado (visível para o cliente)
              </label>
            </div>

            {/* Métricas */}
            <div className="panel p-5">
              <h3 className="font-display text-sm font-bold text-ink-100">
                Métricas de tráfego
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CAMPOS_METRICA.map((c) => (
                  <Campo key={c.k} label={c.l}>
                    <input
                      type="number"
                      className="input"
                      value={form.metricas[c.k] ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          metricas: { ...f.metricas, [c.k]: e.target.value },
                        }))
                      }
                    />
                  </Campo>
                ))}
              </div>
              <div className="mt-3">
                <Campo label="Análise da equipe (texto para o cliente)">
                  <textarea
                    className="input min-h-[90px] resize-y"
                    value={form.observacoes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, observacoes: e.target.value }))
                    }
                  />
                </Campo>
              </div>

              <button
                onClick={salvar}
                disabled={salvando}
                className="btn-gold mt-4"
              >
                <Save size={15} />
                {salvando ? 'Salvando…' : 'Salvar relatório'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
