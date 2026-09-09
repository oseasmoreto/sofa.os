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
        end if
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
