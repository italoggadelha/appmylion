# RUGIDO OS — Sistema Operacional da Agência

Sistema de gestão operacional da agência baseado no **Método RUGIDO** —
ERP operacional + gestão de projetos + aprovações + agentes de IA.

> Projeto **independente**. Não compartilha código nem dados com o CRM.
> Hospedado em **app.mylion.com.br**.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + Framer Motion
- **Backend:** Supabase self-hosted (`api.mylion.com.br`) — schema isolado `rugido`
- **Gráficos:** Recharts · **Kanban:** dnd-kit · **Ícones:** lucide-react

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_ANON_KEY (opcional)
npm run dev            # http://localhost:5180
```

Sem as variáveis `VITE_SUPABASE_*`, a app roda com **dados de demonstração**
(mock) — útil para navegar a interface antes de ligar o banco.

## O Método RUGIDO (6 fases)

| # | Fase | Foco |
|---|------|------|
| 1 | 🔍 Raio-X & Mapeamento | Onboarding, acessos, diagnóstico |
| 2 | 🦅 Ultravisão Estratégica | ICP, posicionamento, estratégia |
| 3 | ♟️ Game Plan Estratégico | Funil, jornada, plano de tráfego |
| 4 | ⚙️ Implementação & Validação | Páginas, integrações, testes |
| 5 | 📡 Demanda & Alcance | Campanhas, criativos, tráfego |
| 6 | 🚀 Otimização & Escala | KPIs, testes A/B, expansão |

Nenhuma fase avança sem aprovação da anterior.

## Banco de dados

O schema fica em [`supabase/schema.sql`](supabase/schema.sql). Aplique no
Supabase self-hosted:

```bash
psql "$DATABASE_URL" -f supabase/schema.sql
```

Tudo vive no schema `rugido` — **isolado do CRM**.

## Deploy em app.mylion.com.br

1. Build estático:
   ```bash
   npm run build      # gera dist/
   ```
2. Suba o conteúdo de `dist/` para o VPS (ex.: `/var/www/appmylion`).
3. Bloco no `Caddyfile`:
   ```
   app.mylion.com.br {
       root * /var/www/appmylion
       encode gzip
       try_files {path} /index.html   # SPA fallback
       file_server
   }
   ```
4. `caddy reload` — o Caddy emite o certificado HTTPS automaticamente.
5. Aponte o DNS `app` → IP do VPS.

## Roadmap

- **Fase 1 (entregue):** fundação — design system, dashboard, clientes,
  jornada RUGIDO, Kanban, aprovações, agentes (catálogo), equipe, schema.
- **Fase 2:** auth real, integração Supabase, portal do cliente, página
  pública de aprovação, agentes de IA ligados ao Claude via Edge Functions.
- **Fase 3:** automações, inteligência operacional, relatórios avançados,
  integrações externas (WhatsApp, Meta/Google Ads, Drive, Calendar).
