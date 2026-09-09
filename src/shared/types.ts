export type MediaType = 'movie' | 'tv'

export interface Title {
  id: number
  mediaType: MediaType
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  voteAverage: number
  releaseDate: string | null
  availableInBR: boolean
}

export interface WatchlistItem extends Title {
  addedAt: string
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

export interface TitlePage {
  items: Title[]
  hasMore: boolean
}
