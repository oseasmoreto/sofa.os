export type MediaType = 'movie' | 'tv'

export interface WatchlistItem {
  tmdbId: number
  mediaType: MediaType
  title: string
  posterPath: string | null
  addedAt: string
}
