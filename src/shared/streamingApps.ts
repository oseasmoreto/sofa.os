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
    launch: { type: 'native', appName: 'Prime Video' }
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    color: '#000000',
    initials: 'tv',
    launch: { type: 'native', appName: 'TV' }
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
  'apple tv plus': 'appletv'
}

export function matchStreamingApp(providerName: string): StreamingApp | undefined {
  const id = PROVIDER_NAME_ALIASES[providerName.toLowerCase().trim()]
  return id ? streamingApps.find((app) => app.id === id) : undefined
}
