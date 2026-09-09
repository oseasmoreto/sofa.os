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
  deepLink?: string
}

export interface TitleDetails extends Title {
  cast: CastMember[]
  providers: WatchProvider[]
}

export interface TitlePage {
  items: Title[]
  hasMore: boolean
}

// Instalação automática (Squirrel.Mac) exige um certificado de assinatura
// pago da Apple pra funcionar de ponta a ponta — sem ele, a checagem de
// consistência entre versões falha mesmo com assinatura ad-hoc. Por isso o
// updater só detecta se existe versão nova; a troca em si é manual (baixar
// o .dmg da release e reinstalar).
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'error'; message: string }
