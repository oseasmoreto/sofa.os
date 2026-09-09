import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import { ipcMain } from 'electron'
import { streamingApps, type StreamingApp } from '../shared/streamingApps'

const execFileAsync = promisify(execFile)

const LINUX_KIOSK_BROWSERS = [
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser'
]

// execFile/exec esperam o processo terminar pra resolver a promise — o que
// nunca aconteceria aqui, já que é o próprio browser (fica aberto até o
// usuário fechar). spawn com detached+unref só confirma que o processo
// nasceu (evento "spawn") e não espera o resto da vida dele.
function spawnDetached(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { detached: true, stdio: 'ignore' })
    child.once('error', reject)
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}

async function openKioskLinux(url: string): Promise<void> {
  for (const browser of LINUX_KIOSK_BROWSERS) {
    try {
      await spawnDetached(browser, ['--kiosk', url])
      return
    } catch {
      // binário não instalado nesse sistema; tenta o próximo da lista
    }
  }

  // nenhum Chromium disponível: abre no navegador padrão do sistema, sem
  // kiosk (não temos garantia de que ele suporte a flag)
  await execFileAsync('xdg-open', [url])
}

export interface LaunchPlan {
  kind: 'native' | 'browser'
  target: string
}

export function buildLaunchPlan(app: StreamingApp, query?: string, directUrl?: string): LaunchPlan {
  if (app.launch.type === 'native') {
    return { kind: 'native', target: app.launch.appName }
  }

  if (directUrl) {
    return { kind: 'browser', target: directUrl }
  }

  const url = query
    ? app.launch.searchUrl.replace('{query}', encodeURIComponent(query))
    : app.launch.homeUrl

  return { kind: 'browser', target: url }
}

async function enterSafariFullscreen(): Promise<void> {
  // Safari não expõe uma propriedade AppleScript nativa para tela cheia; o
  // caminho padrão é ativar o app e simular o atalho via System Events.
  // Isso exige permissão de Acessibilidade concedida ao app (uma vez só,
  // em Ajustes do Sistema > Privacidade e Segurança > Acessibilidade).
  //
  // Além da tela cheia, desmarcamos os dois checkboxes do menu Visualizar
  // que forçam a barra de ferramentas/abas a ficar sempre visível — assim
  // elas entram no auto-hide nativo da tela cheia (só reaparecem se o
  // cursor for pro topo da tela). Confirmado num Safari em português
  // (macOS localizado): o menu "Visualizar" é o 5º item do menu bar do
  // processo Safari (1=Apple, 2=Safari, 3=Arquivo, 4=Editar, 5=Visualizar
  // — por isso referenciado por posição, não por nome, já que o nome em
  // si já é dependente do idioma do sistema). Os dois itens são checkboxes
  // (lidos via AXMenuItemMarkChar), não toggles de texto dinâmico.
  const script = `
    tell application "Safari" to activate
    delay 0.6
    tell application "System Events"
      tell process "Safari"
        set isFull to false
        try
          set isFull to (value of attribute "AXFullScreen" of window 1)
        end try
        if not isFull then
          keystroke "f" using {control down, command down}
          delay 0.5
        end if

        try
          tell menu 1 of menu bar item 5 of menu bar 1
            set toolbarToggle to menu item "Sempre Mostrar Barra de Ferramentas em Tela Cheia"
            if (value of attribute "AXMenuItemMarkChar" of toolbarToggle) is not missing value then
              click toolbarToggle
            end if
          end tell
        end try

        try
          tell menu 1 of menu bar item 5 of menu bar 1
            set tabBarToggle to menu item "Sempre Mostrar Barra de Abas"
            if (value of attribute "AXMenuItemMarkChar" of tabBarToggle) is not missing value then
              click tabBarToggle
            end if
          end tell
        end try
      end tell
    end tell
  `
  try {
    await execFileAsync('osascript', ['-e', script])
  } catch (error) {
    console.error('Não foi possível colocar o Safari em tela cheia:', error)
  }
}

async function openInBrowser(url: string): Promise<void> {
  switch (process.platform) {
    case 'darwin':
      await execFileAsync('open', ['-a', 'Safari', url])
      await enterSafariFullscreen()
      break
    case 'win32':
      // --edge-kiosk-type=fullscreen garante tela cheia de verdade (o
      // --kiosk sozinho já tira barra de endereço e abas, mas sem essa
      // flag o Edge pode abrir só maximizado, não em fullscreen real).
      await execFileAsync('cmd', [
        '/c',
        'start',
        '""',
        'msedge',
        '--kiosk',
        url,
        '--edge-kiosk-type=fullscreen'
      ])
      break
    default:
      await openKioskLinux(url)
      break
  }
}

async function executeLaunchPlan(plan: LaunchPlan): Promise<void> {
  if (plan.kind === 'native') {
    await execFileAsync('open', ['-a', plan.target])
  } else {
    await openInBrowser(plan.target)
  }
}

export async function launchApp(appId: string, query?: string, directUrl?: string): Promise<void> {
  const app = streamingApps.find((candidate) => candidate.id === appId)
  if (!app) {
    throw new Error(`App de streaming desconhecido: ${appId}`)
  }

  await executeLaunchPlan(buildLaunchPlan(app, query, directUrl))
}

export function registerAppLauncherIpc(): void {
  ipcMain.handle('app:launch', (_event, appId: string, query?: string, directUrl?: string) =>
    launchApp(appId, query, directUrl)
  )
}
