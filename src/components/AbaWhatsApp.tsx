import { useState, useEffect, useRef } from 'react'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Power,
  QrCode,
  Smartphone,
  Info,
} from 'lucide-react'
import { getWppConexao, comandoWpp } from '@/lib/chat'
import type { WppConexao } from '@/lib/types'

export default function AbaWhatsApp() {
  const [con, setCon] = useState<WppConexao>({ status: 'desconectado' })
  const [acaoCarregando, setAcaoCarregando] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval>>()

  async function atualizar() {
    try {
      setCon(await getWppConexao())
    } catch {
      /* ignora */
    }
  }

  useEffect(() => {
    atualizar()
    timer.current = setInterval(atualizar, 3000)
    return () => clearInterval(timer.current)
  }, [])

  async function conectar() {
    setAcaoCarregando(true)
    await comandoWpp('conectar')
    setTimeout(() => setAcaoCarregando(false), 2000)
  }
  async function desconectar() {
    setAcaoCarregando(true)
    await comandoWpp('desconectar')
    setTimeout(() => setAcaoCarregando(false), 2000)
  }

  const conectado = con.status === 'conectado'

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-fase-raiox/20 bg-fase-raiox/[0.06] p-3 text-xs text-fase-raiox">
        <Info size={15} className="mt-0.5 shrink-0" />
        Conexão via QR-Code (mesmo modelo do WhatsApp Web). A migração para a
        API oficial do WhatsApp Business da Meta está planejada.
      </div>

      {/* Card de conexão */}
      <div className="panel p-5">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-12 w-12 place-items-center rounded-xl ${
              conectado
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-ink-700 text-ink-400'
            }`}
          >
            {conectado ? <Wifi size={22} /> : <WifiOff size={22} />}
          </div>
          <div className="flex-1">
            <div className="font-display text-sm font-bold text-ink-50">
              WhatsApp Business
            </div>
            <div
              className="text-xs font-semibold capitalize"
              style={{
                color: conectado
                  ? '#10b981'
                  : con.status === 'conectando'
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            >
              {con.status}
            </div>
          </div>
          <button
            onClick={atualizar}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-700"
            title="Atualizar"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {conectado && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-4 sm:grid-cols-3">
            <Info2 label="Número" valor={con.numero ?? '—'} />
            <Info2 label="Conta" valor={con.nomeConta ?? '—'} />
            <Info2
              label="Última sincronização"
              valor={
                con.ultimaSync
                  ? new Date(con.ultimaSync).toLocaleString('pt-BR')
                  : '—'
              }
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {conectado ? (
            <button
              onClick={desconectar}
              disabled={acaoCarregando}
              className="btn-ghost text-red-300"
            >
              <Power size={14} /> Desconectar
            </button>
          ) : (
            <button
              onClick={conectar}
              disabled={acaoCarregando}
              className="btn-gold"
            >
              <RefreshCw
                size={14}
                className={acaoCarregando ? 'animate-spin' : ''}
              />
              {con.qr ? 'Gerar novo QR-Code' : 'Conectar via QR-Code'}
            </button>
          )}
        </div>
      </div>

      {/* QR-Code */}
      {!conectado && (
        <div className="panel flex flex-col items-center gap-3 p-6 text-center">
          {con.qr ? (
            <>
              <img
                src={con.qr}
                alt="QR-Code WhatsApp"
                className="h-56 w-56 rounded-xl bg-white p-2"
              />
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-100">
                <Smartphone size={16} />
                WhatsApp → Aparelhos conectados → Conectar aparelho
              </div>
              <p className="max-w-sm text-xs text-ink-500">
                Aponte a câmera do celular para o código. A tela atualiza
                sozinha quando a conexão for concluída.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-ink-500">
              <QrCode size={40} />
              <p className="text-sm">
                {con.status === 'conectando'
                  ? 'Gerando QR-Code…'
                  : 'Clique em "Conectar via QR-Code" para gerar o código.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Info2({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-ink-100">{valor}</div>
    </div>
  )
}
