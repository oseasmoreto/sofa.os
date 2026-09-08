import type { MediaType, Title, TitleDetails } from '../../../shared/types'

export function getTrending(): Promise<Title[]> {
  return window.api.tmdb.getTrending()
}

export function getPopularMovies(): Promise<Title[]> {
  return window.api.tmdb.getPopularMovies()
}

export function getTopRatedMovies(): Promise<Title[]> {
  return window.api.tmdb.getTopRatedMovies()
}

export function getTitleDetails(id: number, mediaType: MediaType): Promise<TitleDetails> {
  return window.api.tmdb.getTitleDetails(id, mediaType)
}
