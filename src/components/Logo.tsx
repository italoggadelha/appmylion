import { useState } from 'react'

// Logo da MyLion Digital. Usa /logo.png se existir; senão, um wordmark.
export default function Logo({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [erro, setErro] = useState(false)
  const altura = { sm: 26, md: 36, lg: 52 }[size]

  if (!erro) {
    return (
      <img
        src="/logo.png"
        alt="MyLion Digital"
        onError={() => setErro(true)}
        style={{ height: altura }}
        className={`w-auto object-contain ${className}`}
      />
    )
  }

  // Wordmark de fallback (caso logo.png não exista)
  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span
        className="bg-gold-grad bg-clip-text font-display font-extrabold tracking-tight text-transparent"
        style={{ fontSize: altura * 0.62 }}
      >
        MYLION
      </span>
      <span
        className="font-semibold uppercase tracking-[0.42em] text-gold-600"
        style={{ fontSize: altura * 0.17 }}
      >
        digital
      </span>
    </div>
  )
}
