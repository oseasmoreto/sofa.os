import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron'

function windowOf(event: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

export function registerWindowControls(): void {
  ipcMain.handle('window:close', (event) => windowOf(event)?.close())

  ipcMain.handle('window:minimize', (event) => windowOf(event)?.minimize())

  ipcMain.handle('window:toggleMaximize', (event) => {
    const window = windowOf(event)
    if (!window) return

    if (window.isFullScreen()) {
      window.setFullScreen(false)
    } else if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  })
}
