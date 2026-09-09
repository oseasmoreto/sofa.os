import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database | null = null

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      tmdb_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
      title TEXT NOT NULL,
      overview TEXT NOT NULL DEFAULT '',
      poster_path TEXT,
      backdrop_path TEXT,
      vote_average REAL NOT NULL DEFAULT 0,
      release_date TEXT,
      added_at TEXT NOT NULL,
      PRIMARY KEY (tmdb_id, media_type)
    )
  `)

  // Cache dos deep links da Streaming Availability API — o plano gratuito
  // tem só 1000 requisições/mês, então evitamos re-consultar o mesmo título.
  database.exec(`
    CREATE TABLE IF NOT EXISTS deep_link_cache (
      tmdb_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
      links_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (tmdb_id, media_type)
    )
  `)

  const existingColumns = new Set(
    (database.pragma('table_info(watchlist)') as { name: string }[]).map((column) => column.name)
  )

  const columnsToAdd: Record<string, string> = {
    overview: "TEXT NOT NULL DEFAULT ''",
    backdrop_path: 'TEXT',
    vote_average: 'REAL NOT NULL DEFAULT 0',
    release_date: 'TEXT'
  }

  for (const [column, definition] of Object.entries(columnsToAdd)) {
    if (!existingColumns.has(column)) {
      database.exec(`ALTER TABLE watchlist ADD COLUMN ${column} ${definition}`)
    }
  }
}

export function getDb(): Database.Database {
  if (db) return db

  db = new Database(join(app.getPath('userData'), 'sofa.db'))
  db.pragma('journal_mode = WAL')
  migrate(db)

  return db
}
