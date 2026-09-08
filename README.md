# sofa.os

Launcher fullscreen estilo "smart TV" para transformar um MacBook Air 2017 num hub de streaming, rodando conectado via HDMI a uma TV. Organiza o acesso aos apps de streaming instalados e ajuda a descobrir o que assistir, usando dados do TMDb — não hospeda nem reproduz conteúdo próprio.

> Contexto completo de decisões de arquitetura, princípios de engenharia e ordem de construção está em [`CLAUDE.md`](./CLAUDE.md). Este README é só o "como rodar".

## Stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- Vue 3 + Vite (renderer)
- SQLite (`better-sqlite3`) para persistência local
- [TMDb API](https://www.themoviedb.org/documentation/api) para catálogo e "onde assistir"

## Pré-requisitos

- Node.js 20.19+ ou 22.12+
- Conta no [TMDb](https://www.themoviedb.org/) com API Key (v3) ou Read Access Token (v4)
- macOS (o app depende de `open -a` e integrações específicas do macOS)

## Setup

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz com seu Read Access Token do TMDb (veja `.env.example`):

   ```bash
   TMDB_READ_ACCESS_TOKEN=seu_token_aqui
   ```

3. Rode em modo desenvolvimento:

   ```bash
   npm run dev
   ```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o app em modo desenvolvimento com hot reload |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção localmente |

## Estrutura do projeto

```
src/
  main/           # Processo principal (Node) — TMDb, SQLite, abertura de apps, handlers IPC
  preload/        # Scripts de preload (bridge segura entre main e renderer)
  renderer/        # App Vue (UI)
```

## Status

Projeto pessoal em desenvolvimento. Veja a ordem de construção e o que já foi decidido em [`CLAUDE.md`](./CLAUDE.md).
