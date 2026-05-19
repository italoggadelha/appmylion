import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const nav = useNavigate()
  const { entrar: fazerLogin, modoDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { erro: msg } = await fazerLogin(email, senha)
    setCarregando(false)
    if (msg) {
      setErro('E-mail ou senha inválidos.')
      return
    }
    nav('/')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel da marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-ink-grad p-12 lg:flex">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#b8943f,transparent)' }}
        />
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-grad font-display text-2xl font-extrabold text-ink-950">
            R
          </div>
          <div className="font-display text-lg font-bold">RUGIDO OS</div>
        </div>

        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Sua agência operando como uma{' '}
            <span className="gold-text">máquina previsível</span>.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-400">
            6 fases. Processos padronizados. IA em cada etapa. O sistema
            operacional construído sobre o Método RUGIDO.
          </p>
          <div className="mt-8 flex gap-2">
            {['🔍', '🦅', '♟️', '⚙️', '📡', '🚀'].map((s, i) => (
              <div
                key={i}
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.06] bg-ink-800 text-lg"
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-500">
          <ShieldCheck size={14} className="text-gold-500" />
          Acesso restrito · MyLion Digital
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.form
          onSubmit={entrar}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-grad font-display text-2xl font-extrabold text-ink-950">
              R
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink-50">
            Entrar no sistema
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            Acesse o painel operacional da agência.
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-300">
                E-mail
              </label>
              <input
                type="email"
                className="input"
                placeholder="voce@mylion.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-300">
                Senha
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          </div>

          {erro && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-300">
              <AlertCircle size={14} className="shrink-0" />
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="btn-gold mt-6 w-full"
          >
            {carregando ? 'Entrando…' : 'Entrar'}
            {!carregando && <ArrowRight size={16} />}
          </button>

          {modoDemo ? (
            <p className="mt-6 text-center text-xs text-ink-500">
              Modo demonstração · qualquer e-mail e senha entram.
            </p>
          ) : (
            <p className="mt-6 text-center text-xs text-ink-500">
              Problemas de acesso? Fale com o gestor da operação.
            </p>
          )}
        </motion.form>
      </div>
    </div>
  )
}
