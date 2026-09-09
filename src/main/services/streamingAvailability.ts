import { getDb } from '../db'
import type { MediaType } from '../../shared/types'

const BASE_URL = 'https://api.movieofthenight.com/v4'
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14 dias

interface StreamingOption {
  service: { id: string }
  link: string
}

interface ShowResponse {
  streamingOptions?: Record<string, StreamingOption[]>
}

interface CacheRow {
  links_json: string
  fetched_at: string
}

function getCached(tmdbId: number, mediaType: MediaType): Record<string, string> | null {
  const row = getDb()
    .prepare(
      `SELECT links_json, fetched_at FROM deep_link_cache WHERE tmdb_id = ? AND media_type = ?`
    )
    .get(tmdbId, mediaType) as CacheRow | undefined

  if (!row) return null
  if (Date.now() - new Date(row.fetched_at).getTime() > CACHE_TTL_MS) return null

  return JSON.parse(row.links_json)
}

function setCached(tmdbId: number, mediaType: MediaType, links: Record<string, string>): void {
  getDb()
    .prepare(
      `INSERT INTO deep_link_cache (tmdb_id, media_type, links_json, fetched_at)
       VALUES (@tmdbId, @mediaType, @linksJson, @fetchedAt)
       ON CONFLICT (tmdb_id, media_type)
       DO UPDATE SET links_json = @linksJson, fetched_at = @fetchedAt`
    )
    .run({
      tmdbId,
      mediaType,
      linksJson: JSON.stringify(links),
      fetchedAt: new Date().toISOString()
    })
}

// Retorna um mapa { serviceId da Streaming Availability API -> link direto
// do título } pra um filme/série, usando cache local (SQLite) de 14 dias
// pra não estourar o limite de 1000 requisições/mês do plano gratuito.
export async function getDeepLinks(
  tmdbId: number,
  mediaType: MediaType
): Promise<Record<string, string>> {
  const cached = getCached(tmdbId, mediaType)
  if (cached) return cached

  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY
  if (!apiKey) return {}

  try {
    const path = mediaType === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`
    const response = await fetch(`${BASE_URL}/shows/${path}?country=br`, {
      headers: { 'X-API-Key': apiKey }
    })

    if (!response.ok) {
      // título não encontrado na base deles, ou erro passageiro: não vale
      // a pena travar a tela de detalhes por causa disso
      return {}
    }

    const data = (await response.json()) as ShowResponse
    const options = data.streamingOptions?.br ?? []

    const links: Record<string, string> = {}
    for (const option of options) {
      // mantém o primeiro link encontrado por serviço (ex: prioriza a
      // primeira entrada de "subscription" sobre uma de "rent" depois dela)
      if (!links[option.service.id]) {
        links[option.service.id] = option.link
      }
    }

    setCached(tmdbId, mediaType, links)
    return links
  } catch (error) {
    console.error('Falha ao buscar deep links de streaming:', error)
    return {}
  }
}
