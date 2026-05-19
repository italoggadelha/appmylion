import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase, SUPABASE_PRONTO } from './supabase'

// ═══════════════════════════════════════════════════════════════════
// Autenticação. Com Supabase configurado usa auth real; sem ele,
// roda em "modo demo" (qualquer credencial entra) para navegação local.
// ═══════════════════════════════════════════════════════════════════

interface Usuario {
  email: string
  nome: string
}

interface AuthCtx {
  usuario: Usuario | null
  carregando: boolean
  modoDemo: boolean
  entrar: (email: string, senha: string) => Promise<{ erro?: string }>
  sair: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

const STORAGE = 'rugido.demo.user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!SUPABASE_PRONTO) {
      const salvo = localStorage.getItem(STORAGE)
      if (salvo) setUsuario(JSON.parse(salvo))
      setCarregando(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) setUsuario({ email: u.email ?? '', nome: u.email?.split('@')[0] ?? '' })
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user
      setUsuario(u ? { email: u.email ?? '', nome: u.email?.split('@')[0] ?? '' } : null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function entrar(email: string, senha: string) {
    if (!SUPABASE_PRONTO) {
      const u = { email, nome: email.split('@')[0] || 'Demo' }
      localStorage.setItem(STORAGE, JSON.stringify(u))
      setUsuario(u)
      return {}
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })
    return error ? { erro: error.message } : {}
  }

  async function sair() {
    if (SUPABASE_PRONTO) await supabase.auth.signOut()
    localStorage.removeItem(STORAGE)
    setUsuario(null)
  }

  return (
    <Ctx.Provider
      value={{ usuario, carregando, modoDemo: !SUPABASE_PRONTO, entrar, sair }}
    >
      {children}
    </Ctx.Provider>
  )
}
