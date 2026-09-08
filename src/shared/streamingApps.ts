export interface StreamingApp {
  id: string
  name: string
  color: string
  initials: string
}

export const streamingApps: StreamingApp[] = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', initials: 'N' },
  { id: 'disneyplus', name: 'Disney+', color: '#0E1E58', initials: 'D+' },
  { id: 'primevideo', name: 'Prime Video', color: '#00A8E1', initials: 'PV' },
  { id: 'appletv', name: 'Apple TV+', color: '#000000', initials: 'tv' }
]
