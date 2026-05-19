// ═══════════════════════════════════════════════════════════════════
// RUGIDO OS — Gateway WhatsApp (QR-Code via Baileys)
// Mantém a sessão do WhatsApp Web, gera o QR, recebe e envia mensagens,
// sincronizando com o schema "rugido" do Supabase.
//
// Roda no VPS via pm2. Variáveis em .env (SUPABASE_URL, SERVICE_ROLE_KEY).
// ═══════════════════════════════════════════════════════════════════
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import pino from 'pino'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000'
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY
if (!SERVICE_KEY) {
  console.error('Falta SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'rugido' },
})

const log = (...a) => console.log(new Date().toISOString(), ...a)
const setConexao = (campos) =>
  sb.from('wpp_conexao').update(campos).eq('id', 1)

let sock = null
let conectado = false

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()
  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['RUGIDO OS', 'Chrome', '1.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u
    if (qr) {
      log('QR gerado')
      const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 })
      await setConexao({ status: 'conectando', qr: dataUrl })
    }
    if (connection === 'open') {
      conectado = true
      const numero = (sock.user?.id || '').split(':')[0].split('@')[0]
      log('Conectado:', numero)
      await setConexao({
        status: 'conectado',
        qr: null,
        comando: null,
        numero,
        nome_conta: sock.user?.name || 'WhatsApp Business',
        ultima_sync: new Date().toISOString(),
      })
    }
    if (connection === 'close') {
      conectado = false
      const code = lastDisconnect?.error?.output?.statusCode
      log('Conexão encerrada. code=', code)
      if (code === DisconnectReason.loggedOut) {
        await setConexao({ status: 'desconectado', qr: null, numero: null })
      } else {
        await setConexao({ status: 'conectando' })
        setTimeout(start, 3000)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue
        const jid = m.key.remoteJid || ''
        if (jid.endsWith('@g.us') || jid === 'status@broadcast') continue
        const fone = jid.split('@')[0]
        const texto =
          m.message?.conversation ||
          m.message?.extendedTextMessage?.text ||
          (m.message?.imageMessage ? '[imagem]' : '') ||
          (m.message?.audioMessage ? '[áudio]' : '') ||
          (m.message?.documentMessage ? '[documento]' : '') ||
          '[mensagem]'

        let { data: conv } = await sb
          .from('conversas')
          .select('id')
          .eq('telefone', fone)
          .eq('canal', 'whatsapp')
          .maybeSingle()
        if (!conv) {
          const { data: nova } = await sb
            .from('conversas')
            .insert({
              titulo: m.pushName || fone,
              tipo: 'cliente',
              canal: 'whatsapp',
              telefone: fone,
              status: 'aguardando_cliente',
            })
            .select('id')
            .single()
          conv = nova
        }
        if (!conv) continue
        await sb.from('mensagens').insert({
          conversa_id: conv.id,
          do_cliente: true,
          autor_nome: m.pushName || fone,
          tipo: 'texto',
          conteudo: texto,
          enviada: true,
        })
        await sb
          .from('conversas')
          .update({
            ultima_msg: texto,
            ultima_em: new Date().toISOString(),
            status: 'aguardando_cliente',
          })
          .eq('id', conv.id)
        log('Recebida de', fone)
      } catch (e) {
        log('Erro ao processar mensagem:', e.message)
      }
    }
  })
}

// ── Envia mensagens pendentes da equipe + processa comandos ─────────
setInterval(async () => {
  try {
    // comando de desconexão vindo do sistema
    const { data: cx } = await sb
      .from('wpp_conexao')
      .select('comando')
      .eq('id', 1)
      .maybeSingle()
    if (cx?.comando === 'desconectar' && sock) {
      log('Comando: desconectar')
      await setConexao({ comando: null, status: 'desconectado', qr: null, numero: null })
      try { await sock.logout() } catch {}
      return
    }
    if (cx?.comando === 'conectar' && !conectado) {
      await setConexao({ comando: null })
      start()
    }

    if (!conectado || !sock?.user) return
    const { data: pend } = await sb
      .from('mensagens')
      .select('id, conteudo, conversas(telefone, canal)')
      .eq('enviada', false)
      .eq('do_cliente', false)
      .limit(20)
    for (const msg of pend ?? []) {
      const conv = msg.conversas
      if (conv?.canal !== 'whatsapp' || !conv?.telefone) {
        await sb.from('mensagens').update({ enviada: true }).eq('id', msg.id)
        continue
      }
      try {
        await sock.sendMessage(conv.telefone + '@s.whatsapp.net', {
          text: msg.conteudo || '',
        })
        await sb.from('mensagens').update({ enviada: true }).eq('id', msg.id)
        log('Enviada para', conv.telefone)
      } catch (e) {
        log('Falha ao enviar:', e.message)
      }
    }
  } catch (e) {
    log('Erro no loop:', e.message)
  }
}, 4000)

log('Gateway WhatsApp iniciando…')
start().catch((e) => {
  log('Erro fatal:', e)
  process.exit(1)
})
