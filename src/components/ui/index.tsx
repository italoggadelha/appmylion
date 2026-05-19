import type { ReactNode } from 'react'
import { iniciais } from '@/lib/format'

// ── Avatar ──────────────────────────────────────────────────────────
export function Avatar({
  nome,
  size = 32,
  className = '',
  url,
}: {
  nome: string
  size?: number
  className?: string
  url?: string | null
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={nome}
        title={nome}
        className={`shrink-0 rounded-full object-cover ring-1 ring-white/10 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-ink-600 font-semibold text-ink-100 ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={nome}
    >
      {iniciais(nome)}
    </div>
  )
}

// ── Badge ───────────────────────────────────────────────────────────
export function Badge({
  children,
  cor,
  className = '',
}: {
  children: ReactNode
  cor?: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
      style={
        cor
          ? { backgroundColor: `${cor}1f`, color: cor, boxShadow: `inset 0 0 0 1px ${cor}40` }
          : undefined
      }
    >
      {children}
    </span>
  )
}

// ── Dot ─────────────────────────────────────────────────────────────
export function Dot({ cor }: { cor: string }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: cor }}
    />
  )
}

// ── ProgressRing ────────────────────────────────────────────────────
export function ProgressRing({
  valor,
  size = 56,
  stroke = 5,
  cor = '#b8943f',
}: {
  valor: number
  size?: number
  stroke?: number
  cor?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (valor / 100) * c
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#272732" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={cor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        fill="none"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ── Barra de progresso ──────────────────────────────────────────────
export function ProgressBar({ valor, cor = '#b8943f' }: { valor: number; cor?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, valor)}%`, backgroundColor: cor }}
      />
    </div>
  )
}

// ── PageHeader ──────────────────────────────────────────────────────
export function PageHeader({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string
  subtitulo?: string
  acao?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-50">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 text-sm text-ink-400">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  )
}
