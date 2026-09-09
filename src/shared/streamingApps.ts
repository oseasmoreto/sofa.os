export type LaunchStrategy =
  { type: 'native'; appName: string } | { type: 'browser'; homeUrl: string; searchUrl: string }

export interface StreamingApp {
  id: string
  name: string
  color: string
  initials: string
  launch: LaunchStrategy
}

export const streamingApps: StreamingApp[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    color: '#E50914',
    initials: 'N',
    launch: {
      type: 'browser',
      homeUrl: 'https://www.netflix.com',
      searchUrl: 'https://www.netflix.com/search?q={query}'
    }
  },
  {
    id: 'disneyplus',
    name: 'Disney+',
    color: '#0E1E58',
    initials: 'D+',
    launch: {
      type: 'browser',
      homeUrl: 'https://www.disneyplus.com',
      searchUrl: 'https://www.disneyplus.com/search?q={query}'
    }
  },
  {
    id: 'primevideo',
    name: 'Prime Video',
    color: '#00A8E1',
    initials: 'PV',
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
    launch: {
      type: 'browser',
      homeUrl: 'https://tv.apple.com',
      searchUrl: 'https://tv.apple.com/search?term={query}'
    }
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    color: '#F47521',
    initials: 'CR',
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
