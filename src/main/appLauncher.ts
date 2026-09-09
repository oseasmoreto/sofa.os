import { execFile } from 'child_process'
import { promisify } from 'util'
import { ipcMain } from 'electron'
import { streamingApps, type StreamingApp } from '../shared/streamingApps'

const execFileAsync = promisify(execFile)

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
  // Além da tela cheia, tentamos esconder a Tab Bar e desmarcar "Always
  // Show Toolbar in Fullscreen" pelo menu View — assim a toolbar/barra de
  // endereço soma ao comportamento nativo de auto-hide da tela cheia (só
  // reaparece se o cursor for pro topo da tela). Os itens de menu são
  // togglet: "Hide Tab Bar" só existe enquanto a tab bar estiver visível
  // (o "exists" evita reexibir clicando de novo), e o item de toolbar é
  // um checkbox lido via AXMenuItemMarkChar. Cada tentativa tem seu próprio
  // "try" pra uma falhar sem impedir a outra — nomes de menu já variaram
  // entre versões do Safari, então isso pode precisar de ajuste depois de
  // testado na máquina real.
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
          tell menu 1 of menu bar item "View" of menu bar 1
            if exists menu item "Hide Tab Bar" then
              click menu item "Hide Tab Bar"
            end if
          end tell
        end try

        try
          tell menu 1 of menu bar item "View" of menu bar 1
            set alwaysShowToolbar to menu item "Always Show Toolbar in Fullscreen"
            if (value of attribute "AXMenuItemMarkChar" of alwaysShowToolbar) is not missing value then
              click alwaysShowToolbar
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
      await execFileAsync('cmd', ['/c', 'start', '""', 'msedge', url])
      break
    default:
      await execFileAsync('xdg-open', [url])
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
