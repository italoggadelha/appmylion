import { Search, Bell, Plus, LogOut } from 'lucide-react'
import { Avatar } from './ui'
import { useAuth } from '@/lib/auth'

export default function Topbar() {
  const { usuario, sair } = useAuth()
  const nome = usuario?.nome ?? 'Operador'

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-ink-900/60 px-6 backdrop-blur">
      <div className="relative max-w-md flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          className="input pl-9"
          placeholder="Buscar clientes, tarefas, aprovações…"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-gold">
          <Plus size={16} />
          Novo cliente
        </button>
        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-ink-800 text-ink-300 transition-colors hover:text-ink-100">
          <Bell size={17} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-ink-900" />
        </button>
        <div className="ml-1 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-ink-850 py-1.5 pl-1.5 pr-2">
          <Avatar nome={nome} size={30} />
          <div className="leading-tight">
            <div className="text-xs font-semibold capitalize text-ink-100">
              {nome}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gold-500">
              {usuario?.email}
            </div>
          </div>
          <button
            onClick={sair}
            title="Sair"
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-700 hover:text-red-300"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
