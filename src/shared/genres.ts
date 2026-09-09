export interface Genre {
  id: number
  label: string
}

// IDs oficiais do TMDb (/genre/movie/list e /genre/tv/list) — estáveis, não mudam.
export const MOVIE_GENRES: Genre[] = [
  { id: 28, label: 'Ação' },
  { id: 35, label: 'Comédia' },
  { id: 18, label: 'Drama' },
  { id: 27, label: 'Terror' },
  { id: 53, label: 'Suspense' },
  { id: 10749, label: 'Romance' },
  { id: 16, label: 'Animação' },
  { id: 878, label: 'Ficção Científica' },
  { id: 99, label: 'Documentário' }
]

export const TV_GENRES: Genre[] = [
  { id: 10759, label: 'Ação e Aventura' },
  { id: 35, label: 'Comédia' },
  { id: 18, label: 'Drama' },
  { id: 80, label: 'Crime' },
  { id: 10765, label: 'Ficção Científica' },
  { id: 16, label: 'Animação' },
  { id: 99, label: 'Documentário' },
  { id: 10764, label: 'Reality' }
]
