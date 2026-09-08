import { ipcMain } from 'electron'
import { getDb } from './db'
import type { MediaType, WatchlistItem } from '../shared/types'

export function getWatchlist(): WatchlistItem[] {
  return getDb()
    .prepare(
      `SELECT tmdb_id AS id, media_type AS mediaType, title, overview,
              poster_path AS posterPath, backdrop_path AS backdropPath,
              vote_average AS voteAverage, release_date AS releaseDate, added_at AS addedAt
       FROM watchlist
       ORDER BY added_at DESC`
    )
    .all() as WatchlistItem[]
}

export function addToWatchlist(item: Omit<WatchlistItem, 'addedAt'>): void {
  getDb()
    .prepare(
      `INSERT INTO watchlist (tmdb_id, media_type, title, overview, poster_path, backdrop_path, vote_average, release_date, added_at)
       VALUES (@id, @mediaType, @title, @overview, @posterPath, @backdropPath, @voteAverage, @releaseDate, @addedAt)
       ON CONFLICT (tmdb_id, media_type) DO NOTHING`
    )
    .run({ ...item, addedAt: new Date().toISOString() })
}

export function removeFromWatchlist(tmdbId: number, mediaType: MediaType): void {
  getDb()
    .prepare('DELETE FROM watchlist WHERE tmdb_id = ? AND media_type = ?')
    .run(tmdbId, mediaType)
}

export function registerWatchlistIpc(): void {
  ipcMain.handle('db:getWatchlist', () => getWatchlist())

  ipcMain.handle('db:addToWatchlist', (_event, item: Omit<WatchlistItem, 'addedAt'>) =>
    addToWatchlist(item)
  )

  ipcMain.handle('db:removeFromWatchlist', (_event, tmdbId: number, mediaType: MediaType) =>
    removeFromWatchlist(tmdbId, mediaType)
  )
}
