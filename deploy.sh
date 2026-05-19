#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Deploy do RUGIDO OS no VPS (app.mylion.com.br)
# Sobe o build estático e recarrega o Caddy. Não toca no CRM.
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

VPS="root@76.13.127.156"
KEY="$HOME/.ssh/revela_vps"
DEST="/var/www/appmylion"
SSH="ssh -i $KEY -o BatchMode=yes $VPS"

echo "▸ Build de produção…"
npm run build

echo "▸ Garantindo diretório no VPS…"
$SSH "mkdir -p $DEST"

echo "▸ Enviando arquivos…"
rsync -az --delete -e "ssh -i $KEY -o BatchMode=yes" dist/ "$VPS:$DEST/"

echo "▸ Recarregando Caddy…"
$SSH "caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || systemctl reload caddy"

echo "✓ Deploy concluído → https://app.mylion.com.br"
