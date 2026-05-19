import { Check, Minus } from 'lucide-react'
import { useData } from '@/lib/data'
import { PERFIL_LABEL, type Perfil } from '@/data/rugido'
import { Avatar, Badge, PageHeader } from '@/components/ui'

const PERFIL_COR: Record<Perfil, string> = {
  ceo: '#b8943f',
  gestor: '#8b5cf6',
  coordenador: '#5b8def',
  operacional: '#10b981',
  freelancer: '#06b6d4',
  cliente: '#4a4a57',
}

// Matriz de permissões por perfil
const PERMISSOES = ['Visualizar', 'Editar', 'Aprovar', 'Financeiro', 'IA', 'Relatórios']
const MATRIZ: Record<Perfil, boolean[]> = {
  ceo: [true, true, true, true, true, true],
  gestor: [true, true, true, true, true, true],
  coordenador: [true, true, true, false, true, true],
  operacional: [true, true, false, false, true, false],
  freelancer: [true, true, false, false, false, false],
  cliente: [true, false, true, false, false, false],
}

export default function Equipe() {
  const { membros, tarefas } = useData()
  return (
    <div>
      <PageHeader
        titulo="Equipe & Acessos"
        subtitulo="Membros da operação e níveis de permissão"
        acao={<button className="btn-gold">+ Convidar membro</button>}
      />

      {/* Membros */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {membros.map((m) => {
          const minhas = tarefas.filter((t) => t.responsavelId === m.id)
          const ativas = minhas.filter((t) => t.status !== 'concluida').length
          return (
            <div key={m.id} className="panel panel-hover p-4">
              <div className="flex items-center gap-3">
                <Avatar nome={m.nome} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink-50">
                    {m.nome}
                  </div>
                  <div className="truncate text-xs text-ink-500">{m.email}</div>
                </div>
                <Badge cor={PERFIL_COR[m.perfil]}>
                  {PERFIL_LABEL[m.perfil]}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3 text-xs">
                <span className="text-ink-500">{m.cargo}</span>
                <span className="text-ink-300">
                  <span className="font-bold text-gold-300">{ativas}</span>{' '}
                  tarefas ativas
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Matriz de permissões */}
      <div className="panel mt-4 overflow-hidden">
        <div className="border-b border-white/[0.06] p-4">
          <h3 className="font-display text-sm font-bold text-ink-100">
            Matriz de permissões
          </h3>
          <p className="text-xs text-ink-500">
            Controle de acesso por perfil
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink-500">
              <th className="px-4 py-2.5 text-left font-semibold">Perfil</th>
              {PERMISSOES.map((p) => (
                <th key={p} className="px-2 py-2.5 text-center font-semibold">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.keys(MATRIZ) as Perfil[]).map((perfil) => (
              <tr
                key={perfil}
                className="border-t border-white/[0.04] hover:bg-ink-800/40"
              >
                <td className="px-4 py-2.5">
                  <Badge cor={PERFIL_COR[perfil]}>
                    {PERFIL_LABEL[perfil]}
                  </Badge>
                </td>
                {MATRIZ[perfil].map((tem, i) => (
                  <td key={i} className="px-2 py-2.5 text-center">
                    {tem ? (
                      <Check
                        size={15}
                        className="mx-auto text-emerald-400"
                      />
                    ) : (
                      <Minus size={15} className="mx-auto text-ink-600" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
