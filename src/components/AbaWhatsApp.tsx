import { useState, useEffect } from 'react'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Power,
  QrCode,
  Smartphone,
  AlertTriangle,
} from 'lucide-react'
import { getWppConexao, atualizarWppConexao } from '@/lib/chat'
import type { WppConexao } from '@/lib/types'

export default function AbaWhatsApp() {
  const [con, setCon] = useState<WppConexao>({ status: 'desconectado' })
  const [mostrarQr, setMostrarQr] = useState(false)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    getWppConexao().then(setCon).catch(() => {})
  }, [])

  async function conectar() {
    // Modo QR-Code: o pareamento real depende do gateway WhatsApp.
    setCarregando(true)
    const novo: WppConexao = {
      status: 'conectado',
      numero: '+55 11 99999-0000',
      nomeConta: 'MyLion Digital',
      ultimaSync: new Date().toISOString(),
    }
    await atualizarWppConexao(novo)
    setCon(novo)
    setMostrarQr(false)
    setCarregando(false)
  }

  async function desconectar() {
    setCarregando(true)
    await atualizarWppConexao({ status: 'desconectado' })
    setCon({ status: 'desconectado' })
    setCarregando(false)
  }

  const conectado = con.status === 'conectado'

  return (
    <div className="space-y-4">
      {/* Aviso */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-300">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        Modo teste via QR-Code. Em breve integração oficial com a API WhatsApp
        Business da Meta.
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
              className="text-xs font-semibold"
              style={{ color: conectado ? '#10b981' : '#ef4444' }}
            >
              {conectado ? 'Conectado' : 'Desconectado'}
            </div>
          </div>
        </div>

        {conectado && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-4 sm:grid-cols-3">
            <Info label="Número" valor={con.numero ?? '—'} />
            <Info label="Conta" valor={con.nomeConta ?? '—'} />
            <Info
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
            <>
              <button
                onClick={conectar}
                disabled={carregando}
                className="btn-ghost"
              >
                <RefreshCw size={14} /> Reconectar
              </button>
              <button
                onClick={desconectar}
                disabled={carregando}
                className="btn-ghost text-red-300"
              >
                <Power size={14} /> Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={() => setMostrarQr((v) => !v)}
              className="btn-gold"
            >
              <QrCode size={15} /> Conectar via QR-Code
            </button>
          )}
        </div>
      </div>

      {/* Área do QR */}
      {mostrarQr && !conectado && (
        <div className="panel flex flex-col items-center gap-3 p-6 text-center">
          <div className="grid h-48 w-48 place-items-center rounded-xl bg-white p-3">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(#0c0c0f 0% 25%, #fff 0% 50%)',
                backgroundSize: '16px 16px',
                borderRadius: 8,
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-100">
            <Smartphone size={16} /> Abra o WhatsApp → Aparelhos conectados →
            Conectar aparelho
          </div>
          <p className="max-w-sm text-xs text-ink-500">
            Aponte a câmera para o código. O pareamento real é feito pelo
            gateway WhatsApp do servidor — assim que ele estiver ativo, este QR
            fica válido.
          </p>
          <button onClick={conectar} disabled={carregando} className="btn-gold">
            {carregando ? 'Conectando…' : 'Confirmar conexão (teste)'}
          </button>
        </div>
      )}

      <div className="panel p-4 text-xs leading-relaxed text-ink-500">
        <span className="font-semibold text-ink-300">Arquitetura:</span> o
        módulo já está preparado para a migração à API oficial da Meta — basta
        trocar o gateway de QR-Code pelo conector oficial, sem alterar o chat,
        as automações ou o histórico de mensagens.
      </div>
    </div>
  )
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-ink-100">{valor}</div>
    </div>
  )
}
