import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  MediaType,
  TitleDetails,
  TitlePage,
  UpdateStatus,
  WatchlistItem
} from '../shared/types'

// Custom APIs for renderer
const api = {
  window: {
    close: (): Promise<void> => ipcRenderer.invoke('window:close')
  },
  db: {
    getWatchlist: (): Promise<WatchlistItem[]> => ipcRenderer.invoke('db:getWatchlist'),
    addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>): Promise<void> =>
      ipcRenderer.invoke('db:addToWatchlist', item),
    removeFromWatchlist: (tmdbId: number, mediaType: MediaType): Promise<void> =>
      ipcRenderer.invoke('db:removeFromWatchlist', tmdbId, mediaType)
  },
  tmdb: {
    getTrending: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getTrending', page),
    getPopularMovies: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getPopularMovies', page),
    getTopRatedMovies: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getTopRatedMovies', page),
    getTrendingMovies: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getTrendingMovies', page),
    getTrendingTv: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getTrendingTv', page),
    getPopularTv: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getPopularTv', page),
    getTopRatedTv: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getTopRatedTv', page),
    getNewReleases: (page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getNewReleases', page),
    getMoviesByGenre: (genreId: number, page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getMoviesByGenre', genreId, page),
    getTvByGenre: (genreId: number, page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:getTvByGenre', genreId, page),
    getTitleDetails: (id: number, mediaType: MediaType): Promise<TitleDetails> =>
      ipcRenderer.invoke('tmdb:getTitleDetails', id, mediaType),
    searchMulti: (query: string, page?: number): Promise<TitlePage> =>
      ipcRenderer.invoke('tmdb:searchMulti', query, page)
  },
  app: {
    launch: (appId: string, query?: string, directUrl?: string): Promise<void> =>
      ipcRenderer.invoke('app:launch', appId, query, directUrl)
  },
  updater: {
    check: (): Promise<void> => ipcRenderer.invoke('updater:check'),
    openDownloadPage: (): Promise<void> => ipcRenderer.invoke('updater:openDownloadPage'),
    getVersion: (): Promise<string> => ipcRenderer.invoke('updater:getVersion'),
    onStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
      const listener = (_event: unknown, status: UpdateStatus): void => callback(status)
      ipcRenderer.on('updater:status', listener)
      return () => ipcRenderer.removeListener('updater:status', listener)
    }
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
