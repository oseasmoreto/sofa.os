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

O sofa.os tem um botão **Atualizar** no fim da barra lateral. Ele só confere se existe uma versão mais nova publicada — a instalação em si continua manual (baixar o `.dmg` novo e repetir os passos 1 e 2 acima). A troca automática de versão foi descartada de propósito: o mecanismo nativo do macOS pra isso (Squirrel.Mac) exige um certificado de assinatura pago da Apple pra funcionar de ponta a ponta, e sem ele a instalação falha no meio do caminho mesmo com assinatura ad-hoc.

**Depois de reinstalar uma versão nova, refaça a permissão de Acessibilidade** (Ajustes do Sistema → Privacidade e Segurança → Acessibilidade): remova a entrada antiga do sofa.os da lista, abra o app de novo e conceda a permissão quando ele pedir. Isso é necessário toda vez — como o app usa assinatura ad-hoc (sem certificado fixo da Apple), cada build tem uma assinatura diferente, e o macOS invalida silenciosamente a permissão concedida à versão anterior (ela continua aparecendo na lista, mas já não vale mais). Sem refazer esse passo, o app não consegue colocar o Safari em tela cheia ao abrir um streaming.

### 5. Configuração de appliance (recomendado pra uso fixo atrás da TV)

Isso transforma o Mac num "aparelho" — liga e o sofa.os já sobe sozinho em tela cheia, sem precisar mexer em nada. São só ajustes do macOS, nenhum deles muda o app.

**Permissão de Acessibilidade** — necessária pra o app conseguir colocar o Safari em tela cheia e esconder a barra de ferramentas/abas ao abrir um streaming. Abre o app uma vez e clica em algum streaming; se o pedido de permissão não aparecer sozinho:

```bash
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
```

Adiciona o sofa.os na lista (botão **+**) e liga o toggle.

**Login automático** — Ajustes do Sistema → Usuários e Grupos → Opções de Login → "Fazer login automaticamente". Só fica disponível com **FileVault desativado** (disco criptografado sempre exige senha manual no boot, mesmo com essa opção configurada — é uma troca segurança-vs-conveniência que só você pode decidir).

**App abrindo sozinho** — Ajustes do Sistema → Geral → Itens de Login e Extensões → Itens de Login → **+** → adiciona `/Applications/sofa.os.app`. Não precisa de nada extra: a janela já abre com fullscreen nativo.

**Dock e barra de menu** — não costuma precisar mexer: por estar em fullscreen nativo do macOS, os dois já ficam escondidos sozinhos enquanto o app está em foco. Só configura manualmente (Ajustes do Sistema → Desktop e Dock) se notar alguma borda aparecendo.

**Nunca dormir / sem protetor de tela** (enquanto conectado à energia):

```bash
sudo pmset -c sleep 0
sudo pmset -c displaysleep 0
sudo pmset -c disksleep 0
defaults -currentHost write com.apple.screensaver idleTime 0
```

O `-c` é "enquanto ligado no carregador" — na bateria, o comportamento normal de economia continua valendo.

Depois de tudo, reinicia o Mac de verdade (não só sair da conta) pra testar o ciclo completo: boot → login → app já em fullscreen, sem precisar tocar em nada.

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
