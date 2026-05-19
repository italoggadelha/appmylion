import { useState, useEffect } from 'react'
import {
  Copy,
  ExternalLink,
  Save,
  Globe,
  BarChart3,
  Plug,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react'
import { useData } from '@/lib/data'
import {
  getRelatorioCliente,
  salvarRelatorio,
  sincronizarMeta,
  type RelatorioTrafego,
} from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { Avatar, Badge, PageHeader } from '@/components/ui'

// Grupos de métricas numéricas
const GRUPOS: { titulo: string; campos: { k: string; l: string }[] }[] = [
  {
    titulo: 'Financeiro',
    campos: [
      { k: 'investimento', l: 'Investimento (R$)' },
      { k: 'faturamento', l: 'Faturamento (R$)' },
    ],
  },
  {
    titulo: 'Funil',
    campos: [
      { k: 'impressoes', l: 'Impressões' },
      { k: 'cliques', l: 'Cliques' },
      { k: 'visitas', l: 'Visitas' },
      { k: 'leads', l: 'Leads' },
      { k: 'vendas', l: 'Vendas' },
    ],
  },
  {
    titulo: 'Público por gênero',
    campos: [
      { k: 'homens', l: 'Homens (qtd)' },
      { k: 'mulheres', l: 'Mulheres (qtd)' },
    ],
  },
  {
    titulo: 'Vendas por dia da semana',
    campos: [
      { k: 'dia_dom', l: 'Domingo' },
      { k: 'dia_seg', l: 'Segunda' },
      { k: 'dia_ter', l: 'Terça' },
      { k: 'dia_qua', l: 'Quarta' },
      { k: 'dia_qui', l: 'Quinta' },
      { k: 'dia_sex', l: 'Sexta' },
      { k: 'dia_sab', l: 'Sábado' },
    ],
  },
  {
    titulo: 'Vendas por região',
    campos: [
      { k: 'regiao_norte', l: 'Norte' },
      { k: 'regiao_nordeste', l: 'Nordeste' },
      { k: 'regiao_centrooeste', l: 'Centro-Oeste' },
      { k: 'regiao_sudeste', l: 'Sudeste' },
      { k: 'regiao_sul', l: 'Sul' },
    ],
  },
]
const TODOS_CAMPOS = GRUPOS.flatMap((g) => g.campos.map((c) => c.k))

const CAMPOS_CRIATIVO = [
  { k: 'nome', l: 'Nome' },
  { k: 'faturamento', l: 'Fat.' },
  { k: 'investimento', l: 'Invest.' },
  { k: 'impressoes', l: 'Impr.' },
  { k: 'leads', l: 'Leads' },
  { k: 'vendas', l: 'Vendas' },
]

const formVazio = () => ({
  periodo: 'Maio 2026',
  senha: 'mylion',
  publicado: false,
  metricas: {} as Record<string, string>,
  observacoes: '',
  criativos: [] as Record<string, string>[],
  pagamentos: [] as { nome: string; valor: string }[],
  metaToken: '',
  metaAdAccount: '',
})

export default function Portal() {
  const { clientes } = useData()
  const [sel, setSel] = useState('')
  const [rel, setRel] = useState<RelatorioTrafego | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [form, setForm] = useState(formVazio())

  useEffect(() => {
    if (!sel) return
    setCarregando(true)
    getRelatorioCliente(sel)
      .then((r) => {
        setRel(r)
        if (r) {
          const m = r.metricas ?? {}
          setForm({
            periodo: r.periodo,
            senha: r.senha,
            publicado: r.publicado,
            metricas: Object.fromEntries(
              TODOS_CAMPOS.map((k) => [k, String(m[k] ?? '')]),
            ),
            observacoes: m.observacoes ?? '',
            criativos: Array.isArray(m.criativos) ? m.criativos : [],
            pagamentos: Array.isArray(m.pagamentos) ? m.pagamentos : [],
            metaToken: r.metaToken ?? '',
            metaAdAccount: r.metaAdAccount ?? '',
          })
        } else {
          setForm(formVazio())
        }
      })
      .finally(() => setCarregando(false))
  }, [sel])

  function montarMetricas() {
    const m: Record<string, any> = {
      observacoes: form.observacoes,
      criativos: form.criativos.filter((c) => (c.nome ?? '').trim()),
      pagamentos: form.pagamentos.filter((p) => p.nome.trim()),
    }
    for (const k of TODOS_CAMPOS) m[k] = Number(form.metricas[k]) || 0
    return m
  }

  async function salvar() {
    if (!sel || !SUPABASE_PRONTO) return alert('Backend não conectado.')
    setSalvando(true)
    try {
      const r = await salvarRelatorio(sel, {
        periodo: form.periodo,
        senha: form.senha,
        publicado: form.publicado,
        metricas: montarMetricas(),
        meta_token: form.metaToken || null,
        meta_ad_account: form.metaAdAccount || null,
      } as any)
      setRel(r)
      alert('Relatório salvo.')
    } catch {
      alert('Falha ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function sincronizar() {
    if (!sel || !form.metaToken || !form.metaAdAccount) {
      alert('Preencha o token e a conta de anúncios da Meta.')
      return
    }
    setSincronizando(true)
    try {
      await salvarRelatorio(sel, {
        meta_token: form.metaToken,
        meta_ad_account: form.metaAdAccount,
      } as any)
      const res: any = await sincronizarMeta(sel)
      if (res?.erro) {
        alert(
          res.erro === 'nao_configurado'
            ? 'Configure o token e a conta de anúncios.'
            : 'Erro da Meta: ' + (res.detalhe || res.erro),
        )
        return
      }
      setForm((f) => ({
        ...f,
        metricas: {
          ...f.metricas,
          ...Object.fromEntries(
            Object.entries(res.metricas ?? {}).map(([k, v]) => [k, String(v)]),
          ),
        },
        criativos: res.criativos?.length ? res.criativos : f.criativos,
      }))
      alert('Métricas sincronizadas da Meta Ads. Revise e clique em Salvar.')
    } catch {
      alert('Falha ao sincronizar com a Meta.')
    } finally {
      setSincronizando(false)
    }
  }

  const link = rel ? `${window.location.origin}/relatorio/${rel.token}` : ''
  const setM = (k: string, v: string) =>
    setForm((f) => ({ ...f, metricas: { ...f.metricas, [k]: v } }))

  return (
    <div>
      <PageHeader
        titulo="Portal do Cliente"
        subtitulo="Painel de resultados com acesso por senha"
      />

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Lista */}
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
                <Avatar nome={c.empresa} url={c.logoUrl} size={28} />
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
              <p className="mt-2">Selecione um cliente.</p>
            </div>
          </div>
        ) : carregando ? (
          <div className="panel grid place-items-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink-100">
                  <BarChart3 size={16} className="text-gold-400" /> Relatório
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
                <Campo label="Senha do cliente">
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

            {/* Meta Ads */}
            <div className="panel p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink-100">
                <Plug size={16} className="text-fase-demanda" /> Conexão Meta Ads
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Campo label="Token de acesso">
                  <input
                    type="password"
                    className="input"
                    placeholder="EAAB…"
                    value={form.metaToken}
                    onChange={(e) => setForm((f) => ({ ...f, metaToken: e.target.value }))}
                  />
                </Campo>
                <Campo label="ID da conta de anúncios">
                  <input
                    className="input"
                    placeholder="act_1234567890"
                    value={form.metaAdAccount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, metaAdAccount: e.target.value }))
                    }
                  />
                </Campo>
              </div>
              <button
                onClick={sincronizar}
                disabled={sincronizando}
                className="btn-ghost mt-3"
              >
                <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} />
                {sincronizando ? 'Sincronizando…' : 'Sincronizar com a Meta Ads'}
              </button>
            </div>

            {/* Métricas em grupos */}
            <div className="panel space-y-4 p-5">
              <h3 className="font-display text-sm font-bold text-ink-100">
                Métricas do relatório
              </h3>
              {GRUPOS.map((g) => (
                <div key={g.titulo}>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">
                    {g.titulo}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {g.campos.map((c) => (
                      <Campo key={c.k} label={c.l}>
                        <input
                          type="number"
                          className="input py-1.5"
                          value={form.metricas[c.k] ?? ''}
                          onChange={(e) => setM(c.k, e.target.value)}
                        />
                      </Campo>
                    ))}
                  </div>
                </div>
              ))}

              {/* Formas de pagamento */}
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">
                  Formas de pagamento
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        pagamentos: [...f.pagamentos, { nome: '', valor: '' }],
                      }))
                    }
                    className="text-gold-400 hover:text-gold-300"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {form.pagamentos.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="input flex-1 py-1.5"
                        placeholder="Ex.: Pix, Cartão…"
                        value={p.nome}
                        onChange={(e) => {
                          const ps = [...form.pagamentos]
                          ps[i] = { ...ps[i], nome: e.target.value }
                          setForm((f) => ({ ...f, pagamentos: ps }))
                        }}
                      />
                      <input
                        type="number"
                        className="input w-32 py-1.5"
                        placeholder="R$"
                        value={p.valor}
                        onChange={(e) => {
                          const ps = [...form.pagamentos]
                          ps[i] = { ...ps[i], valor: e.target.value }
                          setForm((f) => ({ ...f, pagamentos: ps }))
                        }}
                      />
                      <button
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            pagamentos: f.pagamentos.filter((_, x) => x !== i),
                          }))
                        }
                        className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top criativos */}
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">
                  Top 5 criativos
                </div>
                <div className="space-y-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-1.5">
                      {CAMPOS_CRIATIVO.map((cc) => (
                        <input
                          key={cc.k}
                          type={cc.k === 'nome' ? 'text' : 'number'}
                          className={`input py-1.5 ${cc.k === 'nome' ? 'flex-1' : 'w-20'}`}
                          placeholder={cc.l}
                          value={form.criativos[i]?.[cc.k] ?? ''}
                          onChange={(e) => {
                            const cs = [...form.criativos]
                            cs[i] = { ...(cs[i] ?? {}), [cc.k]: e.target.value }
                            setForm((f) => ({ ...f, criativos: cs }))
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <Campo label="Análise da equipe (texto para o cliente)">
                <textarea
                  className="input min-h-[80px] resize-y"
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                />
              </Campo>

              <button onClick={salvar} disabled={salvando} className="btn-gold">
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
