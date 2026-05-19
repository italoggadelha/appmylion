import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, ArrowLeft, FileCode } from 'lucide-react'
import { getAnexo, aprovarAnexo } from '@/lib/repo'
import type { Anexo } from '@/lib/types'
import Logo from '@/components/Logo'

export default function PreviewAnexo() {
  const { id } = useParams()
  const [anexo, setAnexo] = useState<Anexo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aprovado, setAprovado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    getAnexo(id ?? '')
      .then((a) => {
        setAnexo(a)
        setAprovado(!!a?.aprovado)
      })
      .finally(() => setCarregando(false))
  }, [id])

  async function aprovar() {
    if (!anexo) return
    setSalvando(true)
    try {
      await aprovarAnexo(anexo.id, true)
      setAprovado(true)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando)
    return (
      <div className="grid h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
      </div>
    )

  if (!anexo)
    return (
      <div className="grid h-screen place-items-center text-sm text-ink-500">
        Entrega não encontrada.
      </div>
    )

  const url = anexo.conteudo ?? ''
  const ehUrl = /^https?:\/\//.test(url)

  return (
    <div className="flex h-screen flex-col bg-ink-950">
      {/* Topo */}
      <header className="flex items-center gap-3 border-b border-white/[0.06] bg-ink-900 px-5 py-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-100"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>
        <div className="ml-2 flex items-center gap-2">
          <FileCode size={16} className="text-gold-400" />
          <span className="font-display text-sm font-bold text-ink-50">
            {anexo.titulo}
          </span>
        </div>
        <div className="ml-auto">
          <Logo size="sm" />
        </div>
      </header>

      {/* Conteúdo HTML */}
      <div className="flex-1 overflow-hidden bg-white">
        {anexo.tipo === 'html' ? (
          <iframe
            title={anexo.titulo}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
            {...(ehUrl ? { src: url } : { srcDoc: url })}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-ink-500">
            Este anexo não é uma página HTML.
          </div>
        )}
      </div>

      {/* Barra de aprovação */}
      <footer className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-ink-900 px-5 py-3">
        <span className="text-sm text-ink-400">
          {aprovado
            ? 'Esta entrega foi aprovada.'
            : 'Revise a entrega acima e aprove ao final.'}
        </span>
        {aprovado ? (
          <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400">
            <Check size={16} /> Aprovado
          </span>
        ) : (
          <button onClick={aprovar} disabled={salvando} className="btn-gold">
            <Check size={16} />
            {salvando ? 'Aprovando…' : 'Aprovar entrega'}
          </button>
        )}
      </footer>
    </div>
  )
}
