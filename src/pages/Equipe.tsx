import { useState } from 'react'
import { Check, Minus, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useData } from '@/lib/data'
import { Avatar, Badge, PageHeader } from '@/components/ui'
import ConvidarMembroModal from '@/components/ConvidarMembroModal'

const PERMS = [
  { k: 'visualizar', l: 'Visualizar' },
  { k: 'editar', l: 'Editar' },
  { k: 'aprovar', l: 'Aprovar' },
  { k: 'financeiro', l: 'Financeiro' },
  { k: 'ia', l: 'IA' },
  { k: 'relatorios', l: 'Relatórios' },
]
const COR = ['#b8943f', '#8b5cf6', '#5b8def', '#10b981', '#06b6d4', '#4a4a57']

export default function Equipe() {
  const { membros, tarefas, perfis } = useData()
  const [convidar, setConvidar] = useState(false)

  const perfilNome = (chave: string) =>
    perfis.find((p) => p.chave === chave)?.nome ?? chave

  return (
    <div>
      <PageHeader
        titulo="Equipe & Acessos"
        subtitulo="Membros da operação e níveis de permissão"
        acao={
          <button className="btn-gold" onClick={() => setConvidar(true)}>
            + Convidar membro
          </button>
        }
      />

      <ConvidarMembroModal
        aberto={convidar}
        onFechar={() => setConvidar(false)}
      />

      {/* Membros */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {membros.map((m) => {
          const minhas = tarefas.filter((t) => t.responsavelId === m.id)
          const ativas = minhas.filter((t) => t.status !== 'concluida').length
          return (
            <div key={m.id} className="panel panel-hover p-4">
              <div className="flex items-center gap-3">
                <Avatar nome={m.nome} url={m.avatarUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink-50">
                    {m.nome}
                  </div>
                  <div className="truncate text-xs text-ink-500">{m.email}</div>
                </div>
                <Badge cor="#b8943f">{perfilNome(m.perfil)}</Badge>
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

      {/* Matriz de permissões (somente leitura) */}
      <div className="panel mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
          <div>
            <h3 className="font-display text-sm font-bold text-ink-100">
              Matriz de permissões
            </h3>
            <p className="text-xs text-ink-500">
              Controle de acesso por perfil
            </p>
          </div>
          <Link
            to="/configuracoes"
            className="flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300"
          >
            <Settings size={13} /> Editar perfis
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink-500">
              <th className="px-4 py-2.5 text-left font-semibold">Perfil</th>
              {PERMS.map((p) => (
                <th key={p.k} className="px-2 py-2.5 text-center font-semibold">
                  {p.l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perfis.map((perfil, i) => (
              <tr
                key={perfil.id}
                className="border-t border-white/[0.04] hover:bg-ink-800/40"
              >
                <td className="px-4 py-2.5">
                  <Badge cor={COR[i % COR.length]}>{perfil.nome}</Badge>
                </td>
                {PERMS.map((p) => (
                  <td key={p.k} className="px-2 py-2.5 text-center">
                    {perfil.permissoes[p.k] ? (
                      <Check size={15} className="mx-auto text-emerald-400" />
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
