# 🎵 mptreco

**mptreco** é um web app nostálgico e moderno inspirado nos reprodutores de mídia dos anos 2000 (Windows Media Player, Winamp, Frutiger Aero) combinado com a robustez e performance das tecnologias web atuais.

Permite buscar vídeos e músicas no YouTube, ouvir instantaneamente via stream direto sem precisar baixar, ou salvar localmente no dispositivo (IndexedDB) para escutar 100% offline — **com a tela desligada ou em segundo plano**!

---

## ✨ Funcionalidades Principais

1. **Busca sem Quota de API**:
   - Pesquisa rápida de vídeos, músicas e canais sem necessidade de API Key do Google Cloud.
2. **Reprodução com Tela Desligada / Segundo Plano**:
   - Integração completa com a **MediaSession API** (`navigator.mediaSession`), exibindo controles na tela de bloqueio, smartwatch e fones bluetooth.
   - PWA instalável (`standalone`).
3. **Modo Stream Direto (Play Imediato)**:
   - Dê play instantaneamente em qualquer resultado sem precisar baixar o áudio no disco.
4. **Armazenamento Offline no Dispositivo (PWA / IndexedDB)**:
   - Baixe as músicas para a memória do navegador (`idb-keyval`).
   - Escute no metrô, avião ou sem internet.
   - Suporte a importar arquivos `.mp3` que já estejam no seu celular ou computador.
5. **Visualizador de Espectro de Áudio Real (Web Audio API)**:
   - Equalizador dinâmico estilo anos 2000 desenhado em Canvas reagindo às frequências sonoras da música.
6. **Skins & Temas Nostálgicos**:
   - **WMP 2000 Corona**: Botões orbes azuis translúcidos, detalhes cromados e gradientes clássicos.
   - **Winamp Retro Bento**: Neon verde, displays escuros e fonte mono.
   - **Frutiger Aero**: Vidro translúcido (glassmorphism) e reflexos aquosos.
   - **Modern Minimal**: Tema escuro minimalista moderno.
7. **Playlists Nomeadas**:
   - Criação, edição e reprodução de playlists personalizadas.

---

## 🏗 Arquitetura do Frontend (Vertical Slice / Micro-frontends Style)

Seguindo as convenções de arquitetura declaradas:
- `src/features/player/`:
  - `components/`: `MainPlayerBar.tsx`, `SpectrumVisualizer.tsx`.
  - `hooks/`: `useAudioPlayerHelper.ts`.
  - `context/`: `PlayerContext.tsx`.
- `src/features/library/`:
  - `components/`: `LibraryView.tsx`.
  - `hooks/`: `useLibraryHelper.ts`.
  - `services/`: `indexedDbStorageService.ts`.
  - `context/`: `LibraryContext.tsx`.
- `src/features/playlists/`:
  - `components/`: `PlaylistsView.tsx`.
  - `hooks/`: `usePlaylistHelper.ts`.
  - `context/`: `PlaylistContext.tsx`.
- `src/features/themes/`:
  - `components/`: `ThemeSelector.tsx`.
  - `hooks/`: `useThemeHelper.ts`.
  - `context/`: `ThemeContext.tsx`.
- `src/features/search/`:
  - `components/`: `SearchInput.tsx`, `TrackCard.tsx`.
  - `hooks/`: `useSearchHelper.ts`.
- `src/shared/types/`:
  - Tipagem estrita com `enum` (`PlaybackState`, `ThemeSkin`, `AudioSourceType`, `RepeatMode`).

---

## 🚀 Como Executar Localmente

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## ☁️ Deploy na Vercel

O projeto foi preparado e estruturado para deploy direto na Vercel via CLI:

```bash
vercel --prod
```
