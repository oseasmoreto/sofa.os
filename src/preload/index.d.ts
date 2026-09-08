import { ElectronAPI } from '@electron-toolkit/preload'
import type { MediaType, WatchlistItem } from '../shared/types'

interface SofaApi {
  window: {
    close: () => Promise<void>
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<void>
  }
  db: {
    getWatchlist: () => Promise<WatchlistItem[]>
    addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => Promise<void>
    removeFromWatchlist: (tmdbId: number, mediaType: MediaType) => Promise<void>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SofaApi
  }
}
