import { useState } from 'react'
import { Zap, ArrowRight, Plus, Trash2, X } from 'lucide-react'
import { useData } from '@/lib/data'
import { criarAutomacao, excluirAutomacao } from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { PageHeader, Badge } from '@/components/ui'

const GATILHOS = [
  'Novo cliente',
  'Mudança de fase',
  'Tarefa concluída',
  'Tarefa criada',
  'Tarefa atrasada',
  'Aprovação respondida',
  'Diário',
  'Semanal',
]
const ACOES = [
  'Criar tarefas',
  'Notificar responsável',
  'Avançar fase',
  'Enviar lembrete',
  'Gerar relatório',
  'Marcar como travada',
  'Atribuir responsável',
]

export default function Automacoes() {
  const { automacoes, alternarAutomacao, recarregar } = useData()
  const ativas = automacoes.filter((a) => a.ativa).length
  const [criando, setCriando] = useState(false)
  const [f, setF] = useState({
    nome: '',
    descricao: '',
    gatilho: GATILHOS[0],
    acao: ACOES[0],
  })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!f.nome.trim()) return
    if (!SUPABASE_PRONTO) return alert('Disponível com o backend conectado.')
    setSalvando(true)
    try {
      await criarAutomacao(f)
      await recarregar()
      setCriando(false)
      setF({ nome: '', descricao: '', gatilho: GATILHOS[0], acao: ACOES[0] })
    } catch {
      alert('Falha ao criar a automação.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover esta automação?')) return
    await excluirAutomacao(id)
    await recarregar()
  }

  return (
    <div>
      <PageHeader
        titulo="Automações"
        subtitulo="Regras que a operação executa sozinha"
        acao={
          <button className="btn-gold" onClick={() => setCriando((v) => !v)}>
            <Plus size={15} /> Nova automação
          </button>
        }
      />

      {/* Criador de automação */}
      {criando && (
        <div className="panel mb-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink-100">
              Criar automação personalizada
            </h3>
            <button
              onClick={() => setCriando(false)}
              className="text-ink-400 hover:text-ink-100"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink-300">
                Nome da automação
              </label>
              <input
                className="input"
                placeholder="Ex.: Avisar gestor quando tarefa atrasa"
                value={f.nome}
                onChange={(e) => setF((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-300">
                Quando (gatilho)
              </label>
              <select
                className="input"
                value={f.gatilho}
                onChange={(e) => setF((p) => ({ ...p, gatilho: e.target.value }))}
              >
                {GATILHOS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-300">
                Então (ação)
              </label>
              <select
                className="input"
                value={f.acao}
                onChange={(e) => setF((p) => ({ ...p, acao: e.target.value }))}
              >
                {ACOES.map((ac) => (
                  <option key={ac}>{ac}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink-300">
                Descrição
              </label>
              <input
                className="input"
                placeholder="Detalhe o que essa automação faz"
                value={f.descricao}
                onChange={(e) =>
                  setF((p) => ({ ...p, descricao: e.target.value }))
                }
              />
            </div>
          </div>
          <button onClick={salvar} disabled={salvando} className="btn-gold mt-3">
            {salvando ? 'Salvando…' : 'Criar automação'}
          </button>
        </div>
      )}

      <div className="mb-3 text-xs text-ink-500">
        {ativas} de {automacoes.length} automações ativas
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {automacoes.map((a) => (
          <div key={a.id} className="panel p-5">
            <div className="flex items-start gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  a.ativa
                    ? 'bg-gold-500/15 text-gold-300'
                    : 'bg-ink-700 text-ink-500'
                }`}
              >
                <Zap size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-ink-50">
                    {a.nome}
                  </span>
                  {a.custom && <Badge cor="#5b8def">personalizada</Badge>}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
                  {a.descricao}
                </p>
              </div>

              <button
                onClick={() => alternarAutomacao(a.id, !a.ativa)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  a.ativa ? 'bg-gold-500' : 'bg-ink-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    a.ativa ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
                <ArrowRight size={12} className="text-gold-500" />
                {a.gatilho}
                {a.acao && <span className="text-ink-600">→ {a.acao}</span>}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-500">
                  {a.execucoes}x
                </span>
                {a.custom && (
                  <button
                    onClick={() => remover(a.id)}
                    className="text-ink-600 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
