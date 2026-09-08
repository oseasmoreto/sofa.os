import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { MediaType, WatchlistItem } from '../shared/types'

// Custom APIs for renderer
const api = {
  window: {
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: (): Promise<void> => ipcRenderer.invoke('window:toggleMaximize')
  },
  db: {
    getWatchlist: (): Promise<WatchlistItem[]> => ipcRenderer.invoke('db:getWatchlist'),
    addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>): Promise<void> =>
      ipcRenderer.invoke('db:addToWatchlist', item),
    removeFromWatchlist: (tmdbId: number, mediaType: MediaType): Promise<void> =>
      ipcRenderer.invoke('db:removeFromWatchlist', tmdbId, mediaType)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
