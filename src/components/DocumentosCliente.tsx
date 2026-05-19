import { useState, useEffect, useCallback } from 'react'
import { FileText, Link2, Upload, Plus, Trash2, FolderOpen } from 'lucide-react'
import {
  listarDocumentos,
  criarDocumento,
  excluirDocumento,
  uploadArquivo,
} from '@/lib/repo'
import { SUPABASE_PRONTO } from '@/lib/supabase'
import type { Documento } from '@/lib/types'

export default function DocumentosCliente({
  clienteId,
}: {
  clienteId: string
}) {
  const [docs, setDocs] = useState<Documento[]>([])
  const [add, setAdd] = useState(false)
  const [tipo, setTipo] = useState<'link' | 'texto' | 'arquivo'>('link')
  const [nome, setNome] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      setDocs(await listarDocumentos(clienteId))
    } catch {
      setDocs([])
    }
  }, [clienteId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  async function salvar(file?: File) {
    if (!SUPABASE_PRONTO) return alert('Disponível com o backend conectado.')
    setSalvando(true)
    try {
      let valor = conteudo
      let tipoFinal = tipo
      if (file) {
        valor = await uploadArquivo(file)
        tipoFinal = 'arquivo'
      }
      await criarDocumento({
        clienteId,
        nome: nome || file?.name || 'Documento',
        tipo: tipoFinal,
        conteudo: valor,
      })
      setNome('')
      setConteudo('')
      setAdd(false)
      await recarregar()
    } catch {
      alert('Falha ao salvar o documento.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    await excluirDocumento(id)
    await recarregar()
  }

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2">
        <FolderOpen size={16} className="text-gold-400" />
        <h3 className="font-display text-sm font-bold text-ink-100">
          Documentos oficiais do cliente
        </h3>
        <span className="rounded-full bg-ink-700 px-1.5 text-[11px] font-bold text-ink-300">
          {docs.length}
        </span>
        <button
          onClick={() => setAdd((v) => !v)}
          className="ml-auto text-ink-400 hover:text-gold-300"
        >
          <Plus size={16} />
        </button>
      </div>
      <p className="mt-0.5 text-xs text-ink-500">
        Marca, briefing, acessos e materiais — usados como contexto pelos
        agentes de IA.
      </p>

      <div className="mt-3 space-y-1.5">
        {docs.length === 0 && (
          <p className="text-xs text-ink-600">Nenhum documento ainda.</p>
        )}
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2 rounded-lg bg-ink-850 px-2.5 py-2"
          >
            {d.tipo === 'link' && <Link2 size={14} className="text-ink-500" />}
            {d.tipo === 'arquivo' && <Upload size={14} className="text-ink-500" />}
            {d.tipo === 'texto' && <FileText size={14} className="text-ink-500" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-ink-100">
                {d.nome}
              </div>
              {d.tipo === 'texto' ? (
                <div className="truncate text-[11px] text-ink-500">
                  {d.conteudo}
                </div>
              ) : (
                <a
                  href={d.conteudo}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-[11px] text-gold-400 hover:underline"
                >
                  {d.conteudo}
                </a>
              )}
            </div>
            <button
              onClick={() => remover(d.id)}
              className="text-ink-500 hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {add && (
        <div className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-ink-900 p-3">
          <div className="flex gap-1">
            {(['link', 'texto', 'arquivo'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-md py-1 text-[11px] font-semibold capitalize ${
                  tipo === t
                    ? 'bg-gold-500/15 text-gold-200'
                    : 'bg-ink-800 text-ink-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            className="input py-1.5 text-xs"
            placeholder="Nome do documento"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          {tipo === 'texto' && (
            <textarea
              className="input min-h-[60px] py-1.5 text-xs"
              placeholder="Conteúdo / informações…"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          )}
          {tipo === 'link' && (
            <input
              className="input py-1.5 text-xs"
              placeholder="https://…"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          )}
          {tipo === 'arquivo' ? (
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && salvar(e.target.files[0])}
              className="text-xs text-ink-400 file:mr-2 file:rounded-md file:border-0 file:bg-ink-700 file:px-2 file:py-1 file:text-ink-200"
            />
          ) : (
            <button
              onClick={() => salvar()}
              disabled={salvando || !nome.trim()}
              className="btn-gold w-full py-1.5 text-xs"
            >
              {salvando ? 'Salvando…' : 'Adicionar documento'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
