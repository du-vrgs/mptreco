# 🎵 mptreco

**mptreco** é um ecossistema musical moderno e nostálgico inspirado nos anos 2000 (Windows Media Player clássico, Winamp, Frutiger Aero). Ele une uma central desktop para buscar e baixar músicas em MP3 de alta fidelidade com um **Mobile Web App / PWA** ultra-rápido para reprodução offline e em segundo plano (com tela desligada).

---

## 🏛 Como Funciona a Arquitetura (Flow Geral)

```
[ Desktop Local (Seu PC) ]
  ├── Next.js Local (:3000) ──> Busca no YouTube & solicita download
  └── Daemon Local (:7777)  ──> yt-dlp + ffmpeg baixa em /daemon/downloads/
         ▲
         │ (Túnel Cloudflare via systemd service)
         ▼
[ Gist GitHub (Heartbeat) ] ──> Publica URL do túnel automaticamente
         ▲
         │
[ Vercel (https://mptreco.vercel.app) ]
  ├── Mobile PWA no Celular ──> Lê túnel via Gist e toca músicas do PC
  └── IndexedDB Local (Celular) ──> Salva músicas para tocar 100% offline
```

1. **No seu Desktop**:
   - Você roda a interface desktop localmente.
   - Pesquisa qualquer música ou set no YouTube e clica em **Baixar**.
   - O daemon local baixa via `yt-dlp` + `ffmpeg`, salva o arquivo `.mp3` em `daemon/downloads/` e registra em `daemon/downloads/library.json`.
2. **Túnel Automático (Cloudflare + GitHub Gist)**:
   - Um serviço de segundo plano (`systemd`) sobe o daemon na porta `7777`, abre o túnel Cloudflare e atualiza o seu Gist público com a URL temporária ativa.
3. **No Celular (PWA Vercel)**:
   - Você abre o app instalado pelo celular (`https://mptreco.vercel.app`).
   - O celular sincroniza com as músicas baixadas no PC via túnel.
   - Você pode dar play instantâneo ou baixar pro cache do celular (`IndexedDB`) para ouvir na rua sem internet e com a tela apagada.

---

## 🚀 Como Rodar Quando Quiser (Sob Demanda via Terminal)

Nada inicia sozinho no boot. Você tem controle total pelo terminal quando quiser disponibilizar músicas ou baixar novas:

### 1. Iniciar o Túnel e o Motor de Stream Local

No terminal do repositório:
```bash
cd /home/edu/Projects/mptreco
npm run tunnel
```
*(ou `bash daemon/start.sh`)*

Ele iniciará o servidor local na porta `7777`, abrirá o túnel Cloudflare e atualizará seu Gist no GitHub automaticamente.

Para encerrar o túnel quando terminar, basta dar `Ctrl + C` (ou `pkill -f "python3.*server.py" && pkill -f "cloudflared"`).

---

### 2. Rodar a Central Desktop para Baixar Novas Músicas

Em outro terminal:
```bash
cd /home/edu/Projects/mptreco
npm run dev
```

1. Acesse: **http://localhost:3000**
2. Busque suas faixas e clique em **Baixar**. Os MP3s ficam salvos em `daemon/downloads/`.

---

### 3. No Celular (Tocar e Sincronizar)

1. Abra o app PWA no celular ou acesse **https://mptreco.vercel.app**.
2. Clique no botão **`Sync PC`** no topo da tela para atualizar a lista com quaisquer novas músicas disponíveis no túnel.
3. Ao tocar pela primeira vez na faixa:
   - Ela toca imediatamente transmitida pelo túnel do seu PC.
   - É baixada e salva no cache do celular (`IndexedDB`).
   - Nas próximas vezes, o badge muda para `Offline` e você escuta direto da memória do celular, mesmo com o túnel ou o PC desligados e a tela apagada!

---

## 🛠 Comandos e Utilitários Úteis

| Comando | Descrição |
|---|---|
| `npm run all` | Inicia o Next.js (:3000), o Daemon (:7777) e o Túnel Cloudflare juntos em um único comando |
| `npm run dev` | Inicia somente o frontend Next.js (:3000) |
| `npm run tunnel` | Inicia somente o Daemon local (:7777) e o Túnel Cloudflare |
| `npm test` | Roda a suíte de testes Vitest |
| `npm run build` | Valida o build de produção Next.js |
| `vercel --prod` | Faz deploy de qualquer alteração no frontend |
