import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  MediaType,
  TitleDetails,
  TitlePage,
  UpdateStatus,
  WatchlistItem
} from '../shared/types'

interface SofaApi {
  window: {
    close: () => Promise<void>
  }
  db: {
    getWatchlist: () => Promise<WatchlistItem[]>
    addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => Promise<void>
    removeFromWatchlist: (tmdbId: number, mediaType: MediaType) => Promise<void>
  }
  tmdb: {
    getTrending: (page?: number) => Promise<TitlePage>
    getPopularMovies: (page?: number) => Promise<TitlePage>
    getTopRatedMovies: (page?: number) => Promise<TitlePage>
    getTrendingMovies: (page?: number) => Promise<TitlePage>
    getTrendingTv: (page?: number) => Promise<TitlePage>
    getPopularTv: (page?: number) => Promise<TitlePage>
    getTopRatedTv: (page?: number) => Promise<TitlePage>
    getNewReleases: (page?: number) => Promise<TitlePage>
    getMoviesByGenre: (genreId: number, page?: number) => Promise<TitlePage>
    getTvByGenre: (genreId: number, page?: number) => Promise<TitlePage>
    getTitleDetails: (id: number, mediaType: MediaType) => Promise<TitleDetails>
    searchMulti: (query: string, page?: number) => Promise<TitlePage>
  }
  app: {
    launch: (appId: string, query?: string, directUrl?: string) => Promise<void>
  }
  updater: {
    check: () => Promise<void>
    quitAndInstall: () => Promise<void>
    getVersion: () => Promise<string>
    onStatus: (callback: (status: UpdateStatus) => void) => () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SofaApi
  }
}
