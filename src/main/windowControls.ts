import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron'

function windowOf(event: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

export function registerWindowControls(): void {
  ipcMain.handle('window:close', (event) => windowOf(event)?.close())
}
