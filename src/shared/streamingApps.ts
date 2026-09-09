export type LaunchStrategy =
  { type: 'native'; appName: string } | { type: 'browser'; homeUrl: string; searchUrl: string }

export interface StreamingApp {
  id: string
  name: string
  color: string
  initials: string
  icon?: string
  iconFit?: 'contain' | 'cover'
  launch: LaunchStrategy
}

export const streamingApps: StreamingApp[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    color: '#000000',
    initials: 'N',
    icon: '/streaming-icons/netflix.svg',
    launch: {
      type: 'browser',
      homeUrl: 'https://www.netflix.com',
      searchUrl: 'https://www.netflix.com/search?q={query}'
    }
  },
  {
    id: 'disneyplus',
    name: 'Disney+',
    color: '#1A1D29',
    initials: 'D+',
    icon: '/streaming-icons/disneyplus.svg',
    iconFit: 'cover',
    launch: {
      type: 'browser',
      homeUrl: 'https://www.disneyplus.com',
      searchUrl: 'https://www.disneyplus.com/search?q={query}'
    }
  },
  {
    id: 'primevideo',
    name: 'Prime Video',
    color: '#0F1720',
    initials: 'PV',
    icon: '/streaming-icons/primevideo.svg',
    launch: {
      type: 'browser',
      homeUrl: 'https://www.primevideo.com',
      searchUrl: 'https://www.primevideo.com/search?phrase={query}'
    }
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    color: '#000000',
    initials: 'tv',
    icon: '/streaming-icons/appletv.svg',
    launch: {
      type: 'browser',
      homeUrl: 'https://tv.apple.com',
      searchUrl: 'https://tv.apple.com/search?term={query}'
    }
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    color: '#1F1F1F',
    initials: 'CR',
    icon: '/streaming-icons/crunchyroll.svg',
    launch: {
      type: 'browser',
      homeUrl: 'https://www.crunchyroll.com',
      searchUrl: 'https://www.crunchyroll.com/search?q={query}'
    }
  },
  {
    id: 'hbomax',
    name: 'HBO Max',
    color: '#5822B4',
    initials: 'Max',
    icon: '/streaming-icons/hbomax.svg',
    launch: {
      type: 'browser',
      homeUrl: 'https://www.hbomax.com',
      searchUrl: 'https://www.hbomax.com/search?q={query}'
    }
  },
  {
    id: 'globoplay',
    name: 'Globoplay',
    color: '#E60014',
    initials: 'GP',
    icon: '/streaming-icons/globoplay.png',
    iconFit: 'cover',
    launch: {
      type: 'browser',
      homeUrl: 'https://globoplay.globo.com',
      searchUrl: 'https://globoplay.globo.com/busca/?q={query}'
    }
  }
]

const PROVIDER_NAME_ALIASES: Record<string, string> = {
  netflix: 'netflix',
  'disney plus': 'disneyplus',
  'disney+': 'disneyplus',
  'amazon prime video': 'primevideo',
  'amazon video': 'primevideo',
  'prime video': 'primevideo',
  'apple tv': 'appletv',
  'apple tv+': 'appletv',
  'apple tv plus': 'appletv',
  crunchyroll: 'crunchyroll',
  'hbo max': 'hbomax',
  max: 'hbomax',
  globoplay: 'globoplay'
}

export function matchStreamingApp(providerName: string): StreamingApp | undefined {
  const id = PROVIDER_NAME_ALIASES[providerName.toLowerCase().trim()]
  return id ? streamingApps.find((app) => app.id === id) : undefined
}
