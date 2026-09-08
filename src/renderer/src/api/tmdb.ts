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

export function getTrendingMovies(): Promise<Title[]> {
  return window.api.tmdb.getTrendingMovies()
}

export function getTrendingTv(): Promise<Title[]> {
  return window.api.tmdb.getTrendingTv()
}

export function getPopularTv(): Promise<Title[]> {
  return window.api.tmdb.getPopularTv()
}

export function getTopRatedTv(): Promise<Title[]> {
  return window.api.tmdb.getTopRatedTv()
}

export function getNewReleases(): Promise<Title[]> {
  return window.api.tmdb.getNewReleases()
}

export function getTitleDetails(id: number, mediaType: MediaType): Promise<TitleDetails> {
  return window.api.tmdb.getTitleDetails(id, mediaType)
}
