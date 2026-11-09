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

## 🚀 Como Rodar Amanhã (Guia Rápido)

### 1. O Túnel / Daemon Local (Já roda sozinho via systemd!)

O daemon local com `cloudflared` foi configurado como um serviço do sistema do usuário (`systemd`). Ele inicia automaticamente ao ligar o PC.

- **Verificar se o túnel e daemon estão rodando:**
  ```bash
  systemctl --user status mptreco.service
  ```
- **Iniciar o serviço (se estiver parado):**
  ```bash
  systemctl --user start mptreco.service
  ```
- **Reiniciar o serviço (gera novo túnel e atualiza o Gist):**
  ```bash
  systemctl --user restart mptreco.service
  ```
- **Ver os logs do túnel / downloads:**
  ```bash
  journalctl --user -u mptreco.service -f
  # Ou diretamente nos logs do daemon:
  tail -f /home/edu/Projects/mptreco/daemon/server.log
  tail -f /home/edu/Projects/mptreco/daemon/tunnel.log
  ```

---

### 2. Rodar a Central Desktop para Baixar Novas Músicas

Quando você quiser abrir o app no seu computador para pesquisar e baixar novos sons:

```bash
cd /home/edu/Projects/mptreco
npm run dev
```

1. Acesse no navegador do seu PC:
   👉 **http://localhost:3000**
2. Se quiser acessar com o painel de status local ativo, use o token de admin:
   👉 **http://localhost:3000?token=a8ead6af9a2e9d762a087839b245b246ef2da951889a9912**
3. Busque qualquer música no campo de busca e clique em **Baixar**.
4. O download será processado pelo seu daemon local e salvo na pasta `daemon/downloads/`.

---

### 3. Acessar pelo Celular

Basta abrir o aplicativo instalado no seu celular (PWA) ou acessar:
👉 **https://mptreco.vercel.app**

O app móvel já abre automaticamente no modo **Mobile Pure Player** com seu token configurado:
- Lista todas as músicas baixadas no PC via túnel com o status `No PC`.
- Exibe o botão de play com controles e tela de bloqueio (MediaSession API).
- Salva no armazenamento offline do celular ao tocar ou sincronizar.

---

## 🛠 Comandos e Utilitários Úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o frontend Next.js no computador (:3000) |
| `npm test` | Roda a suíte de testes Vitest |
| `npm run build` | Valida o build de produção Next.js |
| `systemctl --user status mptreco.service` | Checa se o daemon e túnel estão ativos |
| `systemctl --user restart mptreco.service` | Reinicia o daemon e publica novo túnel no Gist |
| `vercel --prod` | Faz deploy de qualquer alteração no frontend |
