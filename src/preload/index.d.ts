import { ElectronAPI } from '@electron-toolkit/preload'
import type { MediaType, Title, TitleDetails, WatchlistItem } from '../shared/types'

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
  tmdb: {
    getTrending: () => Promise<Title[]>
    getPopularMovies: () => Promise<Title[]>
    getTopRatedMovies: () => Promise<Title[]>
    getTrendingMovies: () => Promise<Title[]>
    getTrendingTv: () => Promise<Title[]>
    getPopularTv: () => Promise<Title[]>
    getTopRatedTv: () => Promise<Title[]>
    getNewReleases: () => Promise<Title[]>
    getTitleDetails: (id: number, mediaType: MediaType) => Promise<TitleDetails>
  }
  app: {
    launch: (appId: string, query?: string) => Promise<void>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SofaApi
  }
}
