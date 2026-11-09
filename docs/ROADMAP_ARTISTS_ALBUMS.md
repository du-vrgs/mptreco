# 🗺️ Roadmap de Evolução Técnica: Perfil de Artista, Álbuns & Discografia

Este documento detalha o planejamento técnico, análise de complexidade e arquitetura para implementação futura das páginas de Artista, Álbuns e Discografia no **mptreco**.

---

## 🎯 Objetivo da Feature

Permitir que o usuário navegue pelo ecossistema do artista (estilo Spotify + Winamp/WMP dos anos 2000):
- Ao clicar no nome do artista em qualquer música (ou pesquisar pelo artista):
  - Abrir o **Perfil do Artista** com capa, biografia e top faixas mais ouvidas;
  - Exibir a **Discografia** dividida em Álbuns de Estúdio, EPs e Singles;
  - Entrar em um **Álbum**, listar todas as músicas na ordem oficial e dar play com um clique;
  - Opção de **Baixar Álbum Completo** para o PC / Cache offline com 1 clique.

---

## 📊 Nível de Complexidade

| Critério | Avaliação | Detalhe |
|---|---|---|
| **Complexidade Geral** | **Média (2.5 / 5)** | Scraper baseado em `ytInitialData` ou InnerTube API sem custo |
| **Tempo Estimado** | ~1.5 a 2.5 horas | Backend API + Feature Frontend modular |
| **Custo de Infra** | **$0.00** | Zero quota do Google Cloud / sem API Key necessária |
| **Risco Técnico** | Baixo | Padrão arquitetural já testado e validado no projeto |

---

## 🏛 Arquitetura Proposta (Padrão Edu / Vertical Slice)

```
src/features/artists/
├── components/
│   ├── ArtistProfileView.tsx      # Visão geral do artista (Hero banner, Top Músicas, Carrossel de Álbuns)
│   ├── AlbumDetailView.tsx        # Faixas de um álbum específico com capa e ordem
│   ├── AlbumCard.tsx              # Card visual retrô de álbum
│   └── ArtistSearchBar.tsx        # Sugestões rápidas de artistas
├── hooks/
│   ├── useArtistHelper.ts         # Hook para carregar dados do artista e discografia
│   └── useAlbumHelper.ts          # Hook para carregar faixas de um álbum
├── services/
│   └── artistService.ts           # Chamadas HTTP para /api/artist e /api/album
└── types/
    └── index.ts                   # Interfaces: Artist, Album, AlbumTrack
```

---

## 🔌 Especificação dos Endpoints de API

### 1. `GET /api/artist?q={artistName}&id={channelId}`
- **Entrada**: Nome do artista ou `channelId` (ex: `UC...`).
- **Lógica**: Faz o fetch em `https://music.youtube.com/channel/<channelId>` ou busca no YouTube e analisa o `ytInitialData`.
- **Retorno JSON**:
```json
{
  "id": "UC-9-kyTW8ZkZNDHQJ6FgpwQ",
  "name": "Daft Punk",
  "avatarUrl": "https://...",
  "bannerUrl": "https://...",
  "description": "Duo francês de música eletrônica...",
  "topTracks": [
    { "id": "gAjR4_CbPpQ", "title": "Harder, Better, Faster, Stronger", "duration": "03:43" }
  ],
  "albums": [
    { "id": "OLAK5uy_...", "title": "Discovery", "year": "2001", "coverUrl": "https://..." },
    { "id": "OLAK5uy_...", "title": "Random Access Memories", "year": "2013", "coverUrl": "https://..." }
  ]
}
```

### 2. `GET /api/album?id={albumPlaylistId}`
- **Entrada**: ID da playlist do álbum (`OLAK5uy_...` ou `VLOLAK...`).
- **Retorno JSON**:
```json
{
  "id": "OLAK5uy_discovery",
  "title": "Discovery",
  "artist": "Daft Punk",
  "year": "2001",
  "coverUrl": "https://...",
  "tracks": [
    { "trackNumber": 1, "id": "FGBhQbmPwH8", "title": "One More Time", "duration": "05:20" },
    { "trackNumber": 2, "id": "gAjR4_CbPpQ", "title": "Harder, Better, Faster, Stronger", "duration": "03:43" }
  ]
}
```

---

## 📝 Etapas de Execução (Roadmap de Implementação)

- [ ] **Fase 1: Scraper de Artista e Álbum**:
  - Criar `src/app/api/artist/route.ts` e `src/app/api/album/route.ts`.
  - Implementar extração de `musicShelfRenderer` e `musicCarouselShelfRenderer` do YouTube Music.
  - Testes unitários com Vitest para validar a tipagem e os seletores de extração.

- [ ] **Fase 2: Camada de Domínio e Hooks**:
  - Definir tipos `Artist`, `Album`, `AlbumDetail` em `src/shared/types/`.
  - Criar `useArtistHelper.ts` e `useAlbumHelper.ts` seguindo o padrão de Arrow Functions e enums estritos.

- [ ] **Fase 3: Componentes Visuais com Estética Y2K**:
  - Criar `ArtistProfileView.tsx` e `AlbumDetailView.tsx`.
  - Suporte completo às skins (WMP 2000 Corona Chrome, Winamp Bento Neon, Frutiger Aero).
  - Tornar o nome do artista em `TrackCard.tsx` e `MobilePlayerView.tsx` clicável para levar ao perfil.

- [ ] **Fase 4: Baixar Álbum Completo**:
  - Adicionar botão **"Baixar Álbum"** que enfileira todas as faixas do álbum no daemon do PC via `/api/download`.
  - Integração com o botão **Sync** do PWA móvel para transferir o álbum inteiro para o armazenamento offline do celular de uma só vez.
