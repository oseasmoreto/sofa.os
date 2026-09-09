# sofa.os

Launcher fullscreen estilo "smart TV" para transformar um MacBook Air 2017 num hub de streaming, rodando conectado via HDMI a uma TV. Organiza o acesso aos apps de streaming instalados e ajuda a descobrir o que assistir, usando dados do TMDb — não hospeda nem reproduz conteúdo próprio.

> Contexto completo de decisões de arquitetura, princípios de engenharia e ordem de construção está em [`CLAUDE.md`](./CLAUDE.md). Este README é só o "como rodar".

## Instalação (baixando o app pronto)

Isso é pra quem só quer usar o app, sem rodar a partir do código-fonte.

### 1. Baixe e instale

1. Vá em [Releases](../../releases) e baixe o arquivo **`.dmg`** da versão mais recente (não o `.zip` — esse é usado internamente pelo mecanismo de atualização automática, não é pra abrir na mão).
2. Dê duplo clique no `.dmg`. Vai abrir uma janela com o ícone do sofa.os e um atalho da pasta **Applications**.
3. Arraste o ícone do sofa.os pra dentro do atalho Applications.
4. Ejete o `.dmg` (pode apagar o arquivo depois).

### 2. Abra pela primeira vez

O app não tem certificado de desenvolvedor Apple, então o macOS vai bloquear a primeira abertura com um aviso de "não foi possível verificar o desenvolvedor". Isso só acontece uma vez:

- Clique **direito** no ícone do sofa.os (dentro de Applications) → **Abrir** → confirme no diálogo.
- Se essa opção não aparecer: vá em **Ajustes do Sistema → Privacidade e Segurança**, role até a seção de segurança e vai ter um botão para abrir o sofa.os mesmo assim.

Depois dessa primeira vez, o app abre normalmente (inclusive após atualizações automáticas).

### 3. Configure as chaves de API

O app precisa de duas chaves pra funcionar (catálogo do TMDb e links diretos pra cada streaming). Elas **não vêm dentro do app** — de propósito, já que o instalador é público no GitHub Releases e não queremos publicar chaves de API junto. Em vez disso, elas ficam num arquivo separado, direto na sua pasta de usuário:

1. Crie a pasta (se ainda não existir) e o arquivo `.env` dentro dela:

   ```bash
   mkdir -p ~/"Library/Application Support/sofa.os"
   nano ~/"Library/Application Support/sofa.os/.env"
   ```

2. Cole as duas chaves nesse arquivo:

   ```
   TMDB_READ_ACCESS_TOKEN=seu_token_aqui
   STREAMING_AVAILABILITY_API_KEY=sua_chave_aqui
   ```

   - **TMDb** (catálogo, pôsteres, sinopses): crie uma conta em [themoviedb.org](https://www.themoviedb.org/), vá em Configurações → API e copie o "API Read Access Token" (v4).
   - **Streaming Availability** (links diretos pra abrir o título certo em cada app, quando disponível): crie uma conta gratuita em [developers.movieofthenight.com](https://developers.movieofthenight.com/) — a chave aparece pronta no dashboard, sem precisar de cartão. O plano grátis (1000 requisições/mês) é suficiente pra uso pessoal.

3. Salve o arquivo e abra (ou reabra) o sofa.os.

Sem a chave do TMDb o app não funciona (não tem catálogo pra mostrar). Sem a chave da Streaming Availability o app funciona normalmente, só sem os links diretos — cai de volta pra busca dentro de cada streaming.

### 4. Atualizações

O sofa.os tem um botão **Atualizar** no fim da barra lateral. Ele confere se existe uma versão mais nova publicada, baixa e pergunta se quer reiniciar para aplicar — não precisa baixar um novo `.dmg` manualmente depois da primeira instalação.

## Stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- Vue 3 + Vite (renderer)
- SQLite (`better-sqlite3`) para persistência local
- [TMDb API](https://www.themoviedb.org/documentation/api) para catálogo e "onde assistir"

## Pré-requisitos

- Node.js 20.19+ ou 22.12+
- Conta no [TMDb](https://www.themoviedb.org/) com API Key (v3) ou Read Access Token (v4)
- Conta gratuita na [Streaming Availability API](https://developers.movieofthenight.com/) (opcional — só pra links diretos de "onde assistir")
- macOS (o app depende de `open -a` e integrações específicas do macOS)

## Setup (desenvolvimento a partir do código-fonte)

Isso é pra quem vai rodar/modificar o projeto, não pra quem só quer usar o app — pra isso veja [Instalação](#instalação-baixando-o-app-pronto) acima.

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` **na raiz do projeto** com as chaves (veja `.env.example`) — em modo desenvolvimento o app lê daqui, não da pasta de usuário usada pelo app empacotado:

   ```bash
   TMDB_READ_ACCESS_TOKEN=seu_token_aqui
   STREAMING_AVAILABILITY_API_KEY=sua_chave_aqui
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
