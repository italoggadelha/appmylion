import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CheckCircle2,
  Bot,
  Workflow,
  BarChart3,
  UserCog,
  Globe,
  Settings,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/kanban', label: 'Kanban', icon: KanbanSquare },
  { to: '/aprovacoes', label: 'Aprovações', icon: CheckCircle2 },
  { to: '/agentes', label: 'Agentes de IA', icon: Bot },
  { to: '/automacoes', label: 'Automações', icon: Workflow },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

const NAV_GESTAO = [
  { to: '/equipe', label: 'Equipe & Acessos', icon: UserCog },
  { to: '/portal', label: 'Portal do Cliente', icon: Globe },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

function Item({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof Users
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? 'bg-gold-500/10 text-gold-200 shadow-[inset_0_0_0_1px_rgba(184,148,63,0.25)]'
            : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={isActive ? 'text-gold-300' : 'text-ink-500 group-hover:text-ink-300'}
          />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/80 px-4 py-5 backdrop-blur">
      {/* Marca / cabeçalho */}
      <div className="mb-6 px-2">
        <Logo size="md" />
        <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-600">
          RUGIDO Operating System
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
          Operação
        </p>
        {NAV.map((n) => (
          <Item key={n.to} {...n} />
        ))}

        <p className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
          Gestão
        </p>
        {NAV_GESTAO.map((n) => (
          <Item key={n.to} {...n} />
        ))}
      </nav>

      {/* Rodapé */}
      <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-850 p-3">
        <Logo size="sm" />
        <div className="text-center text-[10px] leading-snug text-ink-600">
          © {new Date().getFullYear()} MyLion Digital · Método RUGIDO
        </div>
      </div>
    </aside>
  )
}
