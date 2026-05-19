import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const loc = useLocation()

  if (carregando) {
    return (
      <div className="grid h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
          <span className="text-xs text-ink-500">Carregando…</span>
        </div>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" state={{ from: loc }} replace />
  return <>{children}</>
}
