import { execFile } from 'child_process'
import { promisify } from 'util'
import { ipcMain } from 'electron'
import { streamingApps, type StreamingApp } from '../shared/streamingApps'

const execFileAsync = promisify(execFile)

export interface LaunchPlan {
  kind: 'native' | 'browser'
  target: string
}

export function buildLaunchPlan(app: StreamingApp, query?: string): LaunchPlan {
  if (app.launch.type === 'native') {
    return { kind: 'native', target: app.launch.appName }
  }

  const url = query
    ? app.launch.searchUrl.replace('{query}', encodeURIComponent(query))
    : app.launch.homeUrl

  return { kind: 'browser', target: url }
}

async function openInBrowser(url: string): Promise<void> {
  switch (process.platform) {
    case 'darwin':
      await execFileAsync('open', ['-a', 'Safari', url])
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

export async function launchApp(appId: string, query?: string): Promise<void> {
  const app = streamingApps.find((candidate) => candidate.id === appId)
  if (!app) {
    throw new Error(`App de streaming desconhecido: ${appId}`)
  }

  await executeLaunchPlan(buildLaunchPlan(app, query))
}

export function registerAppLauncherIpc(): void {
  ipcMain.handle('app:launch', (_event, appId: string, query?: string) => launchApp(appId, query))
}
