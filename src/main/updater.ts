import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '../shared/types'

function broadcast(status: UpdateStatus): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('updater:status', status)
  }
}

export function registerUpdaterIpc(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => broadcast({ state: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    broadcast({ state: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => broadcast({ state: 'not-available' }))
  autoUpdater.on('download-progress', (progress) =>
    broadcast({ state: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    broadcast({ state: 'downloaded', version: info.version })
  )
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

  ipcMain.handle('updater:quitAndInstall', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('updater:getVersion', () => app.getVersion())
}
