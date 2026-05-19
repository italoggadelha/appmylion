// Leão geométrico do agente Lion — estilo heráldico, dourado.
export default function LionIcon({
  size = 28,
  className = '',
}: {
  size?: number
  className?: string
}) {
  const cx = 32
  const cy = 33
  const N = 14
  const spikes: string[] = []
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i - 0.46) / N) * Math.PI * 2 - Math.PI / 2
    const a2 = ((i + 0.46) / N) * Math.PI * 2 - Math.PI / 2
    const rOut = 30
    const rIn = 18
    const tip = `${cx + Math.cos(a) * rOut},${cy + Math.sin(a) * rOut}`
    const b1 = `${cx + Math.cos(a1) * rIn},${cy + Math.sin(a1) * rIn}`
    const b2 = `${cx + Math.cos(a2) * rIn},${cy + Math.sin(a2) * rIn}`
    spikes.push(`${b1} ${tip} ${b2}`)
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-label="Lion"
    >
      <defs>
        <linearGradient id="lionMane" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e3b8" />
          <stop offset="0.55" stopColor="#c79a3a" />
          <stop offset="1" stopColor="#6b561a" />
        </linearGradient>
        <linearGradient id="lionFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf5e4" />
          <stop offset="1" stopColor="#d9b256" />
        </linearGradient>
      </defs>

      {/* Juba — espinhos angulares */}
      <g fill="url(#lionMane)">
        {spikes.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
        <circle cx={cx} cy={cy} r={19} />
      </g>

      {/* Orelhas */}
      <g fill="url(#lionMane)">
        <polygon points="20,18 27,24 18,27" />
        <polygon points="44,18 37,24 46,27" />
      </g>

      {/* Rosto facetado */}
      <polygon
        points="32,16 47,27 43,44 32,52 21,44 17,27"
        fill="url(#lionFace)"
      />

      {/* Olhos */}
      <g fill="#0c0c0f">
        <polygon points="24,30 30,29 27,34" />
        <polygon points="40,30 34,29 37,34" />
      </g>

      {/* Focinho + nariz */}
      <polygon points="32,36 37,40 32,46 27,40" fill="#0c0c0f" />
      <polygon points="32,40 34,43 32,45 30,43" fill="#d9b256" />
    </svg>
  )
}
