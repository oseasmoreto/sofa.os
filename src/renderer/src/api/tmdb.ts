import type { MediaType, TitleDetails, TitlePage } from '../../../shared/types'

export function getTrending(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getTrending(page)
}

export function getPopularMovies(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getPopularMovies(page)
}

export function getTopRatedMovies(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getTopRatedMovies(page)
}

export function getTrendingMovies(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getTrendingMovies(page)
}

export function getTrendingTv(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getTrendingTv(page)
}

export function getPopularTv(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getPopularTv(page)
}

export function getTopRatedTv(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getTopRatedTv(page)
}

export function getNewReleases(page?: number): Promise<TitlePage> {
  return window.api.tmdb.getNewReleases(page)
}

export function getTitleDetails(id: number, mediaType: MediaType): Promise<TitleDetails> {
  return window.api.tmdb.getTitleDetails(id, mediaType)
}
