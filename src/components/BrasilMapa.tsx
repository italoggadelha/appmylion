// Mapa simplificado do Brasil por região — colorido pela intensidade de vendas.
interface Regiao {
  id: string
  nome: string
  pts: string
  lx: number
  ly: number
}

const REGIOES: Regiao[] = [
  { id: 'norte', nome: 'Norte', pts: '34,40 196,30 210,150 150,168 70,150 28,96', lx: 110, ly: 96 },
  { id: 'nordeste', nome: 'Nordeste', pts: '196,30 286,70 276,180 210,196 210,150', lx: 240, ly: 118 },
  { id: 'centrooeste', nome: 'C.-Oeste', pts: '150,168 210,150 210,196 200,250 138,244 130,196', lx: 170, ly: 208 },
  { id: 'sudeste', nome: 'Sudeste', pts: '210,196 276,180 268,256 200,250', lx: 238, ly: 224 },
  { id: 'sul', nome: 'Sul', pts: '138,244 200,250 196,322 140,312 124,270', lx: 166, ly: 286 },
]

export default function BrasilMapa({
  dados,
}: {
  dados: Record<string, number>
}) {
  const max = Math.max(...REGIOES.map((r) => dados[r.id] ?? 0), 1)
  const cor = (v: number) => {
    const t = v / max
    if (t === 0) return '#1d1d25'
    if (t < 0.34) return '#766019'
    if (t < 0.67) return '#b8943f'
    return '#e7cc83'
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 314 350" className="h-56 w-full">
        {REGIOES.map((r) => (
          <g key={r.id}>
            <polygon
              points={r.pts}
              fill={cor(dados[r.id] ?? 0)}
              stroke="#0c0c0f"
              strokeWidth={2}
            />
            <text
              x={r.lx}
              y={r.ly}
              textAnchor="middle"
              className="fill-ink-950 font-display"
              fontSize="11"
              fontWeight="800"
            >
              {dados[r.id] ?? 0}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {REGIOES.map((r) => (
          <span
            key={r.id}
            className="flex items-center gap-1 text-[10px] text-ink-400"
          >
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: cor(dados[r.id] ?? 0) }}
            />
            {r.nome}: {dados[r.id] ?? 0}
          </span>
        ))}
      </div>
    </div>
  )
}
