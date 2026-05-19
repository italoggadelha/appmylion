import { useState, useEffect, useCallback } from 'react'
import {
  FileQuestion,
  Plus,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
  ChevronDown,
  Trash2,
  X,
} from 'lucide-react'
import { useData } from '@/lib/data'
import {
  listarFormularios,
  listarRespostas,
  criarEnvioFormulario,
  confirmarPlano,
  salvarFormulario,
  type FormularioModelo,
  type RespostaForm,
  type CampoForm,
} from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import { dataCurta } from '@/lib/format'
import { Avatar, Badge, PageHeader } from '@/components/ui'

type Aba = 'envios' | 'modelos'

export default function Formularios() {
  const { clientes, clientePorId } = useData()
  const [aba, setAba] = useState<Aba>('envios')
  const [modelos, setModelos] = useState<FormularioModelo[]>([])
  const [envios, setEnvios] = useState<RespostaForm[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviarAberto, setEnviarAberto] = useState(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [m, e] = await Promise.all([listarFormularios(), listarRespostas()])
      setModelos(m)
      setEnvios(e)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const pendentesPlano = envios.filter(
    (e) => e.status === 'respondido' && !e.planoConfirmado,
  ).length

  return (
    <div>
      <PageHeader
        titulo="Formulários"
        subtitulo="Raio-X do cliente e plano estratégico gerado por IA"
        acao={
          <button className="btn-gold" onClick={() => setEnviarAberto(true)}>
            <Plus size={15} /> Enviar formulário
          </button>
        }
      />

      {pendentesPlano > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/[0.06] px-4 py-2.5 text-sm text-gold-200">
          <Sparkles size={15} />
          {pendentesPlano} plano(s) gerado(s) pela IA aguardando sua confirmação.
        </div>
      )}

      <div className="mb-4 flex rounded-xl border border-white/[0.07] bg-ink-850 p-1">
        {[
          { id: 'envios' as Aba, label: 'Envios & Planos' },
          { id: 'modelos' as Aba, label: 'Modelos de formulário' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              aba === t.id
                ? 'bg-gold-grad text-ink-950'
                : 'text-ink-400 hover:text-ink-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="panel grid place-items-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
        </div>
      ) : aba === 'envios' ? (
        <div className="space-y-3">
          {envios.length === 0 && (
            <div className="panel grid place-items-center py-14 text-sm text-ink-500">
              Nenhum formulário enviado ainda.
            </div>
          )}
          {envios.map((e) => (
            <EnvioCard
              key={e.id}
              envio={e}
              empresa={clientePorId(e.clienteId)?.empresa ?? '—'}
              onConfirmar={async () => {
                await confirmarPlano(e.id)
                recarregar()
              }}
            />
          ))}
        </div>
      ) : (
        <ModelosTab modelos={modelos} onMudou={recarregar} />
      )}

      {enviarAberto && (
        <EnviarModal
          modelos={modelos}
          clientes={clientes.map((c) => ({ id: c.id, empresa: c.empresa }))}
          onFechar={() => setEnviarAberto(false)}
          onEnviado={recarregar}
        />
      )}
    </div>
  )
}

// ── Card de um envio ────────────────────────────────────────────────
function EnvioCard({
  envio,
  empresa,
  onConfirmar,
}: {
  envio: RespostaForm
  empresa: string
  onConfirmar: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const link = `${window.location.origin}/formulario/${envio.token}`
  const respondido = envio.status === 'respondido'

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar nome={empresa} size={38} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink-100">{empresa}</div>
          <div className="text-xs text-ink-500">
            {envio.formularioNome} · {dataCurta(envio.criadoEm)}
          </div>
        </div>
        {respondido ? (
          <Badge cor={envio.planoConfirmado ? '#10b981' : '#f59e0b'}>
            {envio.planoConfirmado ? 'Plano confirmado' : 'Plano pendente'}
          </Badge>
        ) : (
          <Badge cor="#5b8def">Aguardando cliente</Badge>
        )}
        <button
          onClick={() => setAberto((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
        >
          <ChevronDown
            size={16}
            className={aberto ? 'rotate-180 transition' : 'transition'}
          />
        </button>
      </div>

      {aberto && (
        <div className="border-t border-white/[0.06] bg-ink-900/50 p-4">
          {!respondido && (
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-900 px-2.5 py-2">
              <span className="truncate font-mono text-[11px] text-ink-400">
                {link}
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(link)}
                className="ml-auto text-ink-400 hover:text-gold-300"
              >
                <Copy size={14} />
              </button>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="text-ink-400 hover:text-gold-300"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {respondido && (
            <>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gold-400">
                <Sparkles size={12} /> Plano estratégico gerado pela IA
              </div>
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/[0.05] bg-ink-900 p-3 text-sm leading-relaxed text-ink-200">
                {envio.plano || 'Plano não disponível.'}
              </div>
              {!envio.planoConfirmado && (
                <button onClick={onConfirmar} className="btn-gold mt-3">
                  <Check size={15} /> Confirmar plano
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modal de envio ──────────────────────────────────────────────────
function EnviarModal({
  modelos,
  clientes,
  onFechar,
  onEnviado,
}: {
  modelos: FormularioModelo[]
  clientes: { id: string; empresa: string }[]
  onFechar: () => void
  onEnviado: () => void
}) {
  const [modelo, setModelo] = useState(modelos[0]?.id ?? '')
  const [cliente, setCliente] = useState('')
  const [link, setLink] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function gerar() {
    if (!modelo || !cliente) return
    if (!SUPABASE_PRONTO) return alert('Disponível com o backend conectado.')
    setSalvando(true)
    try {
      const { token } = await criarEnvioFormulario(modelo, cliente)
      setLink(`${window.location.origin}/formulario/${token}`)
      onEnviado()
    } catch {
      alert('Falha ao gerar o formulário.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      onClick={onFechar}
      className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-50">
            Enviar formulário ao cliente
          </h2>
          <button
            onClick={onFechar}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
          >
            <X size={16} />
          </button>
        </div>

        {link ? (
          <div className="mt-5">
            <p className="text-sm text-ink-300">
              Link gerado — envie ao cliente:
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-900 px-2.5 py-2">
              <span className="truncate font-mono text-[11px] text-ink-400">
                {link}
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(link)}
                className="ml-auto text-ink-400 hover:text-gold-300"
              >
                <Copy size={14} />
              </button>
            </div>
            <button onClick={onFechar} className="btn-gold mt-4 w-full">
              Concluir
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-300">
                Modelo de formulário
              </label>
              <select
                className="input"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              >
                {modelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-300">
                Cliente
              </label>
              <select
                className="input"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              >
                <option value="">Selecione…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={gerar}
              disabled={salvando || !cliente}
              className="btn-gold w-full"
            >
              {salvando ? 'Gerando…' : 'Gerar link do formulário'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Aba de modelos ──────────────────────────────────────────────────
function ModelosTab({
  modelos,
  onMudou,
}: {
  modelos: FormularioModelo[]
  onMudou: () => void
}) {
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [campos, setCampos] = useState<CampoForm[]>([])
  const [novoCampo, setNovoCampo] = useState('')

  function addCampo() {
    if (!novoCampo.trim()) return
    setCampos((c) => [
      ...c,
      {
        id: 'c' + Date.now(),
        label: novoCampo,
        tipo: 'textarea',
      },
    ])
    setNovoCampo('')
  }

  async function salvar() {
    if (!nome.trim() || campos.length === 0) return
    await salvarFormulario({ nome, descricao, campos })
    setCriando(false)
    setNome('')
    setDescricao('')
    setCampos([])
    onMudou()
  }

  return (
    <div className="space-y-3">
      {modelos.map((m) => (
        <div key={m.id} className="panel p-4">
          <div className="flex items-center gap-2">
            <FileQuestion size={16} className="text-gold-400" />
            <span className="font-display text-sm font-bold text-ink-50">
              {m.nome}
            </span>
            <Badge cor="#5b8def">{m.campos.length} perguntas</Badge>
          </div>
          {m.descricao && (
            <p className="mt-1 text-xs text-ink-400">{m.descricao}</p>
          )}
        </div>
      ))}

      {criando ? (
        <div className="panel space-y-3 p-5">
          <input
            className="input"
            placeholder="Nome do formulário"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            className="input"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <div className="space-y-1.5">
            {campos.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-lg bg-ink-850 px-2.5 py-1.5 text-xs text-ink-200"
              >
                <span className="text-ink-500">{i + 1}.</span>
                <span className="flex-1">{c.label}</span>
                <button
                  onClick={() =>
                    setCampos((cs) => cs.filter((x) => x.id !== c.id))
                  }
                  className="text-ink-500 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Nova pergunta…"
              value={novoCampo}
              onChange={(e) => setNovoCampo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCampo()}
            />
            <button onClick={addCampo} className="btn-ghost">
              <Plus size={15} />
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setCriando(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={salvar} className="btn-gold">
              Salvar modelo
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCriando(true)}
          className="panel panel-hover flex w-full items-center justify-center gap-2 py-4 text-sm font-semibold text-ink-300"
        >
          <Plus size={16} /> Novo modelo de formulário
        </button>
      )}
    </div>
  )
}
