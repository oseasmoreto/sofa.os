export type MediaType = 'movie' | 'tv'

export interface WatchlistItem {
  tmdbId: number
  mediaType: MediaType
  title: string
  posterPath: string | null
  addedAt: string
}

export interface Title {
  id: number
  mediaType: MediaType
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  voteAverage: number
  releaseDate: string | null
}

export interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
}

export interface WatchProvider {
  id: number
  name: string
  logoPath: string
}

export interface TitleDetails extends Title {
  cast: CastMember[]
  providers: WatchProvider[]
}
