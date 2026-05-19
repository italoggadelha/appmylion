import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/ui'

export default function EmBreve({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <div>
      <PageHeader titulo={titulo} />
      <div className="panel grid place-items-center px-6 py-20 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-500/10 text-gold-300">
          <Construction size={26} />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-ink-100">
          Módulo em construção
        </h2>
        <p className="mt-1 max-w-sm text-sm text-ink-400">
          <span className="font-semibold text-gold-400">{titulo}</span> entra na{' '}
          {fase} do roadmap do RUGIDO OS. A fundação do sistema já está pronta
          para recebê-lo.
        </p>
      </div>
    </div>
  )
}
