import type { MediaType, WatchlistItem } from '../../../shared/types'

export function getWatchlist(): Promise<WatchlistItem[]> {
  return window.api.db.getWatchlist()
}

export function addToWatchlist(item: Omit<WatchlistItem, 'addedAt'>): Promise<void> {
  return window.api.db.addToWatchlist(item)
}

export function removeFromWatchlist(tmdbId: number, mediaType: MediaType): Promise<void> {
  return window.api.db.removeFromWatchlist(tmdbId, mediaType)
}
