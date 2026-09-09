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
