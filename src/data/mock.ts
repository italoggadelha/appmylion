import type { Cliente, Membro, Tarefa, Aprovacao } from '@/lib/types'
import { FASES_RUGIDO, type FaseId } from './rugido'

// ═══════════════════════════════════════════════════════════════════
// Dados de demonstração — usados enquanto o Supabase não está conectado.
// Substituídos por queries reais assim que VITE_SUPABASE_* for definido.
// ═══════════════════════════════════════════════════════════════════

export const EQUIPE: Membro[] = [
  { id: 'm1', nome: 'Italo Gadelha', email: 'italo@mylion.com.br', perfil: 'ceo', cargo: 'CEO' },
  { id: 'm2', nome: 'Camila Louback', email: 'camila@mylion.com.br', perfil: 'gestor', cargo: 'Head de Operações' },
  { id: 'm3', nome: 'Rafael Souza', email: 'rafael@mylion.com.br', perfil: 'coordenador', cargo: 'Coord. de Tráfego' },
  { id: 'm4', nome: 'Bianca Reis', email: 'bianca@mylion.com.br', perfil: 'operacional', cargo: 'Designer' },
  { id: 'm5', nome: 'Lucas Martins', email: 'lucas@mylion.com.br', perfil: 'operacional', cargo: 'Copywriter' },
  { id: 'm6', nome: 'Júlia Nunes', email: 'julia@mylion.com.br', perfil: 'freelancer', cargo: 'Web Designer' },
]

export const CLIENTES: Cliente[] = [
  {
    id: 'c1', nome: 'Dr. Henrique Alves', empresa: 'Clínica Vitalis', segmento: 'Saúde / Odontologia',
    status: 'ativo', faseAtual: 'demanda', plano: 'Escala', ticket: 6500, receitaGerada: 39000,
    dataEntrada: '2025-12-02', responsavelId: 'm3', responsavelNome: 'Rafael Souza', healthScore: 86,
  },
  {
    id: 'c2', nome: 'Marina Costa', empresa: 'Studio MC Arquitetura', segmento: 'Arquitetura',
    status: 'ativo', faseAtual: 'impl', plano: 'Performance', ticket: 4200, receitaGerada: 16800,
    dataEntrada: '2026-01-20', responsavelId: 'm2', responsavelNome: 'Camila Louback', healthScore: 72,
  },
  {
    id: 'c3', nome: 'Construtora Horizonte', empresa: 'Horizonte Engenharia', segmento: 'Construção Civil',
    status: 'ativo', faseAtual: 'gameplan', plano: 'Escala', ticket: 8900, receitaGerada: 17800,
    dataEntrada: '2026-03-10', responsavelId: 'm2', responsavelNome: 'Camila Louback', healthScore: 64,
  },
  {
    id: 'c4', nome: 'Fernanda Lima', empresa: 'FL Estética Avançada', segmento: 'Estética',
    status: 'ativo', faseAtual: 'ultra', plano: 'Performance', ticket: 3800, receitaGerada: 7600,
    dataEntrada: '2026-04-05', responsavelId: 'm3', responsavelNome: 'Rafael Souza', healthScore: 58,
  },
  {
    id: 'c5', nome: 'AutoForce Veículos', empresa: 'AutoForce', segmento: 'Automotivo',
    status: 'onboarding', faseAtual: 'raiox', plano: 'Escala', ticket: 7400, receitaGerada: 0,
    dataEntrada: '2026-05-12', responsavelId: 'm2', responsavelNome: 'Camila Louback', healthScore: 50,
  },
  {
    id: 'c6', nome: 'Pedro Bastos', empresa: 'Bastos Advocacia', segmento: 'Jurídico',
    status: 'ativo', faseAtual: 'escala', plano: 'Escala', ticket: 5600, receitaGerada: 67200,
    dataEntrada: '2025-08-15', responsavelId: 'm3', responsavelNome: 'Rafael Souza', healthScore: 91,
  },
  {
    id: 'c7', nome: 'Espaço Zen', empresa: 'Espaço Zen Wellness', segmento: 'Bem-estar',
    status: 'pausado', faseAtual: 'demanda', plano: 'Performance', ticket: 3200, receitaGerada: 22400,
    dataEntrada: '2025-10-01', responsavelId: 'm2', responsavelNome: 'Camila Louback', healthScore: 41,
  },
  {
    id: 'c8', nome: 'TechParts Distribuidora', empresa: 'TechParts', segmento: 'E-commerce / B2B',
    status: 'ativo', faseAtual: 'impl', plano: 'Escala', ticket: 9800, receitaGerada: 29400,
    dataEntrada: '2026-02-18', responsavelId: 'm3', responsavelNome: 'Rafael Souza', healthScore: 78,
  },
]

const PRIOS = ['baixa', 'media', 'alta', 'critica'] as const
const STATUSES = [
  'a_fazer', 'fazendo', 'aguardando_cliente', 'aguardando_aprovacao', 'concluida', 'travada',
] as const

// Gera tarefas a partir dos templates de cada fase, para cada cliente.
function gerarTarefas(): Tarefa[] {
  const out: Tarefa[] = []
  let n = 0
  for (const cliente of CLIENTES) {
    const faseIdx = FASES_RUGIDO.findIndex((f) => f.id === cliente.faseAtual)
    // fases até a atual recebem tarefas; a atual fica em andamento
    for (let fi = 0; fi <= faseIdx; fi++) {
      const fase = FASES_RUGIDO[fi]
      const concluida = fi < faseIdx
      fase.tarefasPadrao.slice(0, fi === faseIdx ? 6 : 4).forEach((titulo, ti) => {
        n++
        const status = concluida
          ? 'concluida'
          : STATUSES[(n + ti) % STATUSES.length]
        const membro = EQUIPE[(n + ti) % EQUIPE.length]
        out.push({
          id: `t${n}`,
          clienteId: cliente.id,
          fase: fase.id as FaseId,
          titulo,
          status: status as Tarefa['status'],
          prioridade: PRIOS[(n + ti) % PRIOS.length],
          responsavelId: membro.id,
          responsavelNome: membro.nome,
          prazo: new Date(Date.now() + ((ti % 5) - 2) * 86400000).toISOString(),
          subtarefas: [
            { id: `s${n}a`, titulo: 'Briefing', concluida: true },
            { id: `s${n}b`, titulo: 'Execução', concluida: status === 'concluida' },
            { id: `s${n}c`, titulo: 'Revisão interna', concluida: status === 'concluida' },
          ],
          precisaAprovacao: ti % 3 === 0,
          comentarios: (n + ti) % 5,
          anexos: (n * ti) % 4,
          criadaEm: new Date(Date.now() - n * 86400000).toISOString(),
        })
      })
    }
  }
  return out
}

export const TAREFAS: Tarefa[] = gerarTarefas()

export const APROVACOES: Aprovacao[] = [
  { id: 'a1', clienteId: 'c1', titulo: 'Criativo — Campanha Implantes Maio', tipo: 'arte', status: 'pendente', enviadaEm: '2026-05-16', token: 'aprv-9f2a' },
  { id: 'a2', clienteId: 'c2', titulo: 'Landing Page — Projetos Residenciais', tipo: 'pagina', status: 'ajustes', enviadaEm: '2026-05-14', token: 'aprv-7c1b', feedback: 'Trocar a foto da dobra principal.' },
  { id: 'a3', clienteId: 'c6', titulo: 'Copy — Sequência de e-mails', tipo: 'copy', status: 'aprovado', enviadaEm: '2026-05-12', token: 'aprv-3d8e' },
  { id: 'a4', clienteId: 'c8', titulo: 'Vídeo institucional — 30s', tipo: 'video', status: 'pendente', enviadaEm: '2026-05-17', token: 'aprv-1a5f' },
  { id: 'a5', clienteId: 'c1', titulo: 'Posts — Calendário semana 21', tipo: 'post', status: 'reprovado', enviadaEm: '2026-05-10', token: 'aprv-6b2c', feedback: 'Tom muito informal para a clínica.' },
]

// Helpers
export const tarefasDoCliente = (clienteId: string) =>
  TAREFAS.filter((t) => t.clienteId === clienteId)

export const clienteById = (id: string) => CLIENTES.find((c) => c.id === id)
export const membroById = (id: string) => EQUIPE.find((m) => m.id === id)
