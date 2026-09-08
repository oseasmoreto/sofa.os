import { ipcMain } from 'electron'
import type { CastMember, MediaType, Title, TitleDetails, WatchProvider } from '../../shared/types'

const BASE_URL = 'https://api.themoviedb.org/3'

interface TmdbResult {
  id: number
  media_type?: 'movie' | 'tv'
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date?: string
  first_air_date?: string
}

interface TmdbListResponse {
  results: TmdbResult[]
}

interface TmdbCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

interface TmdbProvider {
  provider_id: number
  provider_name: string
  logo_path: string
}

interface TmdbWatchProvidersRegion {
  flatrate?: TmdbProvider[]
  rent?: TmdbProvider[]
  buy?: TmdbProvider[]
}

interface TmdbDetailsResult extends TmdbResult {
  credits?: { cast: TmdbCastMember[] }
  'watch/providers'?: { results: Record<string, TmdbWatchProvidersRegion> }
}

async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN

  if (!token) {
    throw new Error('TMDB_READ_ACCESS_TOKEN não configurado (.env)')
  }

  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('language', 'pt-BR')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Falha na requisição ao TMDb: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

function toTitle(raw: TmdbResult, fallbackMediaType: MediaType): Title {
  return {
    id: raw.id,
    mediaType: raw.media_type ?? fallbackMediaType,
    title: raw.title ?? raw.name ?? '',
    overview: raw.overview,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    voteAverage: raw.vote_average,
    releaseDate: raw.release_date ?? raw.first_air_date ?? null
  }
}

export async function getTrending(): Promise<Title[]> {
  const data = await request<TmdbListResponse>('/trending/all/week')
  return data.results.map((raw) => toTitle(raw, 'movie'))
}

export async function getPopularMovies(): Promise<Title[]> {
  const data = await request<TmdbListResponse>('/discover/movie', {
    sort_by: 'popularity.desc',
    watch_region: 'BR',
    region: 'BR'
  })
  return data.results.map((raw) => toTitle(raw, 'movie'))
}

export async function getTopRatedMovies(): Promise<Title[]> {
  const data = await request<TmdbListResponse>('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '200',
    watch_region: 'BR',
    region: 'BR'
  })
  return data.results.map((raw) => toTitle(raw, 'movie'))
}

function dedupeProviders(providers: TmdbProvider[]): WatchProvider[] {
  const byId = new Map<number, TmdbProvider>()
  for (const provider of providers) {
    byId.set(provider.provider_id, provider)
  }

  return Array.from(byId.values()).map((provider) => ({
    id: provider.provider_id,
    name: provider.provider_name,
    logoPath: provider.logo_path
  }))
}

export async function getTitleDetails(id: number, mediaType: MediaType): Promise<TitleDetails> {
  const path = mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`
  const data = await request<TmdbDetailsResult>(path, {
    append_to_response: 'credits,watch/providers'
  })

  const cast: CastMember[] = (data.credits?.cast ?? []).slice(0, 8).map((member) => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profilePath: member.profile_path
  }))

  const region = data['watch/providers']?.results.BR
  const providers = dedupeProviders([
    ...(region?.flatrate ?? []),
    ...(region?.rent ?? []),
    ...(region?.buy ?? [])
  ])

  return { ...toTitle(data, mediaType), cast, providers }
}

export function registerTmdbIpc(): void {
  ipcMain.handle('tmdb:getTrending', () => getTrending())
  ipcMain.handle('tmdb:getPopularMovies', () => getPopularMovies())
  ipcMain.handle('tmdb:getTopRatedMovies', () => getTopRatedMovies())
  ipcMain.handle('tmdb:getTitleDetails', (_event, id: number, mediaType: MediaType) =>
    getTitleDetails(id, mediaType)
  )
}
