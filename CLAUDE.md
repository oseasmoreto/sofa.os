# CLAUDE.md — sofa.OS

Contexto persistente do projeto para o Claude Code. Este arquivo resume as decisões já tomadas em sessão de planejamento anterior — não reabrir essas discussões, apenas seguir o que está definido aqui. Pontos genuinamente em aberto estão marcados na seção 8.

## 1. O que é este projeto

Launcher fullscreen estilo "smart TV" para rodar num MacBook Air 2017 (Intel, 8GB RAM) conectado via HDMI a uma TV Philco (2016/2017), substituindo a experiência de um Fire Stick/Android TV Box.

O app **não hospeda conteúdo próprio**. Ele:
1. Mostra uma barra de ícones dos apps de streaming instalados (Netflix, Disney+, Prime Video, etc.).
2. Mostra carrosséis de descoberta ("o que assistir") usando dados do TMDb.
3. Ao escolher um título, direciona para o streaming certo — nativo quando existe app, ou via Safari com busca pré-preenchida quando não existe.

## 2. Não fazer (fora de escopo — decidido, não reabrir)

- **Não** tentar reproduzir vídeo dentro de uma `<webview>`/`BrowserWindow` do Electron. Motivo: Netflix/Disney+/Prime usam Widevine DRM; o Electron padrão não tem o CDM embutido, e mesmo com build alternativo (Castlabs) a resolução costuma ser limitada. Vídeo **sempre** roda fora do processo do Electron (Safari/WebKit ou app nativo).
- **Não** tentar puxar "continuar assistindo" pessoal de Netflix/Disney+/Prime — não existe API pública para isso; a alternativa seria scraping/engenharia reversa, o que foi descartado por fragilidade e risco de ToS.
- **Não** assumir que `open -a "Netflix" "https://..."` vai abrir a PWA numa URL específica — PWAs instaladas via Safari geralmente ignoram URL extra e abrem sempre no `start_url` fixo do manifest. Isso precisa ser testado na prática antes de depender disso (ver seção 8).
- **Não** usar servidor HTTP local (Nuxt/Nitro) para a "API" interna do app. Decisão final foi **Vue + Vite no renderer, lógica de dados no processo principal do Electron, exposta via IPC** — evita rodar dois processos Node em paralelo num hardware com RAM limitada.

## 3. Stack e arquitetura (decidido)

| Camada | Escolha |
|---|---|
| Scaffold | `electron-vite` (`npm create @quick-start/electron@latest`, template `vue` ou `vue-ts`) |
| Frontend | Vue + Vite, rodando no processo de renderização |
| Comunicação renderer ↔ main | IPC do Electron (`ipcMain.handle` / `ipcRenderer.invoke`) — sem servidor HTTP local |
| Persistência local | SQLite via `better-sqlite3`, acessado **apenas** no processo principal; precisa de `electron-rebuild`/`@electron/rebuild` para compilar o binário nativo contra a ABI do Electron |
| Chamadas à API do TMDb | Feitas no processo principal (Node), nunca no renderer — evita expor a API key no frontend |
| Fonte de catálogo | TMDb API (`/trending`, `/discover/movie`, `/discover/tv`, `/movie/{id}/watch/providers`), filtrado por `watch_region=BR` |
| Apps com integração nativa | Prime Video, Apple TV+ → abrir via `open -a "Nome do App"` (macOS) |
| Apps sem app nativo (Netflix, Disney+) | Abrir via Safari, busca pré-preenchida: `https://www.netflix.com/search?q={termo}` (padrão robusto). Deep link direto por ID de título é backlog, não MVP. |
| Navegação por controle remoto | Plano A: HDMI-CEC via adaptador Pulse-Eight USB-CEC + `libCEC` (Firestick e PS4 já respondem ao controle da Philco, bom sinal de que o CEC dela funciona). Fallback garantido: air mouse/teclado Bluetooth. Usar lib de spatial navigation (ex: Norigin Spatial Navigation) para navegação por foco entre elementos. |
| Target de hardware | Intel x64 (não precisa lidar com Apple Silicon/Rosetta) |

## 4. Estrutura de tela (decidido)

Tela única (não múltiplas rotas separadas para "launcher" vs "descoberta"):
- Barra superior: ícones dos apps de streaming instalados.
- Abaixo: carrosséis de descoberta por categoria (Em alta, Populares, Por gênero, Mais bem avaliados).
- Tela de detalhes (ao selecionar um título): pôster, sinopse, nota, elenco básico, lista de "onde assistir", botão de ação "Assistir em [Streaming]".

## 5. Configuração de appliance (fazer por último, não durante o desenvolvimento)

Só configurar depois que o app estiver estável:
- Login automático do macOS.
- App no fullscreen adicionado em Itens de Login.
- Dock e barra de menu com auto-hide.
- Mac configurado para nunca dormir / sem protetor de tela enquanto plugado.

## 6. Ordem de construção

1. Esqueleto Electron + Vue + Vite (fullscreen, sem chrome de janela).
2. Processo principal: `better-sqlite3` + rebuild, banco local, canais IPC básicos.
3. Barra superior com ícones dos apps (visual, sem lógica de abertura ainda).
4. Integração TMDb (trending + discover) chamada do processo principal, carrosséis no renderer.
5. Tela de detalhes + watch providers.
6. Navegação por foco com setas, cobrindo barra de apps e carrosséis.
7. Lógica de abertura: Prime Video nativo primeiro (caminho fácil) → depois Netflix/Disney+ via Safari.
8. Teste real de `open -a` com a PWA da Netflix para confirmar comportamento de URL.
9. Teste do adaptador Pulse-Eight USB-CEC com a Philco.
10. Configuração de appliance no macOS (por último).

## 7. Pré-requisitos de ambiente

- Conta TMDb com API Key (v3) ou Read Access Token (v4).
- Node.js — conferir versão mínima exigida pelo `electron-vite` (20.19+ ou 22.12+) antes de rodar o scaffold.
- PWAs da Netflix e Disney+ instaladas via Safari ("Adicionar ao Dock").
- App nativo do Prime Video instalado via Mac App Store.
- Adaptador Pulse-Eight USB-CEC (para o teste do item 9 acima).

## 8. Princípios de engenharia (seguir durante todo o desenvolvimento)

Projeto pessoal, mas vale manter disciplina de código — facilita manutenção e eventual reuso da lógica de domínio (ex: se um dia expor essa API para outro dispositivo na rede).

### KISS (Keep It Simple, Stupid)
- Preferir a solução mais direta que resolve o problema atual, não a mais "extensível" para casos que ainda não existem. Exemplo já aplicado: IPC em vez de servidor HTTP local, porque não há multiusuário nem necessidade de rede.
- Não introduzir abstração (interface, camada extra, config genérica) até que exista um segundo caso de uso real que a justifique.

### DRY (Don't Repeat Yourself)
- Chamadas à API do TMDb centralizadas num único módulo/serviço no processo principal (ex: `src/main/services/tmdb.ts`) — nunca duplicar a lógica de fetch/parse em múltiplos canais IPC.
- Lógica de "qual app abrir e como" (nativo via `open -a` vs. Safari com busca) centralizada num único módulo de resolução de apps, não espalhada pelos handlers de IPC.

### SOLID (adaptado a um app Electron pequeno, sem exagero de camadas)
- **S — Responsabilidade única**: cada módulo do processo principal cuida de uma coisa (`tmdb.ts` só fala com a API do TMDb; `db.ts` só lida com SQLite; `appLauncher.ts` só decide como abrir cada streaming). Não misturar fetch de API com lógica de abertura de app no mesmo arquivo.
- **O — Aberto/fechado**: o "mapa" de apps de streaming (nome, se tem app nativo, comando de abertura) deve ser dado, não `if/else` cravado no código — adicionar um novo streaming não deve exigir editar a lógica de abertura, só adicionar uma entrada nesse mapa.
- **L — Substituição de Liskov**: se streamings nativos e via-Safari forem modelados com uma interface comum (ex: `abrir(titulo)`), qualquer implementação dela deve poder ser chamada de forma intercambiável pelo chamador, sem checagem de tipo especial por fora.
- **I — Segregação de interface**: os canais IPC expostos ao renderer devem ser específicos e pequenos (`db:getWatchlist`, `tmdb:getTrending`) em vez de um único canal genérico tipo `main:invoke` que recebe qualquer coisa.
- **D — Inversão de dependência**: as telas Vue dependem de uma camada fina de "cliente IPC" (ex: `src/renderer/api/`), nunca chamam `ipcRenderer` diretamente espalhado pelos componentes — facilita trocar a implementação depois sem tocar na UI.

### DDD (aplicado de forma leve — não é um sistema corporativo, mas os conceitos ajudam a organizar)
- **Linguagem ubíqua**: usar os mesmos termos no código e nas conversas sobre o projeto — "título" (filme/série), "provedor" (streaming), "watchlist", "descoberta". Evitar sinônimos variando por arquivo.
- **Separação de camadas**:
  - *Domínio*: regras de "onde assistir", "como abrir um app", modelagem de Título/Provedor — sem dependência de Electron, SQLite ou TMDb diretamente (funções puras sempre que possível).
  - *Infraestrutura*: acesso ao TMDb (HTTP) e ao SQLite — implementações concretas que o domínio não precisa conhecer em detalhe.
  - *Aplicação*: os handlers de IPC, que orquestram domínio + infraestrutura para responder ao que o renderer pede.
- Não modelar isso como múltiplos "bounded contexts" com camadas rígidas de um sistema enterprise — é um projeto pessoal pequeno. A ideia é só manter a separação de responsabilidades acima para o código não virar um único arquivo `main.ts` gigante.

## 9. Pontos genuinamente em aberto (não assumir, validar durante o desenvolvimento)

- Comportamento real de `open -a` com a PWA da Netflix ao passar uma URL — pode não respeitar o parâmetro. Se não funcionar, usar `open -a Safari "URL"` como alternativa (abre em janela do Safari, não da PWA instalada).
- Se o CEC via Pulse-Eight realmente replica o comportamento visto no Firestick/PS4 quando controlado por um app Electron/libCEC no Mac — não há garantia, só um indício favorável.
- Deep link direto por ID de título (`netflix.com/watch/{id}`) fica de fora do MVP; só entra em backlog futuro caso o usuário decida que vale o esforço de manter um mapa manual de IDs.
