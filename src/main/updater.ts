import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '../shared/types'

const RELEASES_URL = 'https://github.com/oseasmoreto/sofa.os/releases/latest'

function broadcast(status: UpdateStatus): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('updater:status', status)
  }
}

export function registerUpdaterIpc(): void {
  // Só detecta se existe versão nova — a troca em si fica manual (baixar o
  // .dmg da release e reinstalar). A instalação automática via Squirrel.Mac
  // exige um certificado de assinatura pago da Apple pra passar da checagem
  // de consistência entre versões; sem ele, o processo falha no meio do
  // caminho mesmo com assinatura ad-hoc.
  autoUpdater.autoDownload = false

  autoUpdater.on('checking-for-update', () => broadcast({ state: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    broadcast({ state: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => broadcast({ state: 'not-available' }))
  autoUpdater.on('error', (error) => {
    console.error('Erro no auto-updater:', error)
    broadcast({ state: 'error', message: error.message })
  })

  ipcMain.handle('updater:check', async () => {
    // Fora de um build empacotado (npm run dev) não existe metadata de
    // update local; electron-updater lança erro se tentar checar.
    if (!app.isPackaged) {
      broadcast({ state: 'error', message: 'Atualização só funciona no app empacotado' })
      return
    }

    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      broadcast({ state: 'error', message: error instanceof Error ? error.message : String(error) })
    }
  })

  ipcMain.handle('updater:openDownloadPage', () => shell.openExternal(RELEASES_URL))

  ipcMain.handle('updater:getVersion', () => app.getVersion())
}
