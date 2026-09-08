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
      poster_path TEXT,
      added_at TEXT NOT NULL,
      PRIMARY KEY (tmdb_id, media_type)
    )
  `)
}

export function getDb(): Database.Database {
  if (db) return db

  db = new Database(join(app.getPath('userData'), 'sofa.db'))
  db.pragma('journal_mode = WAL')
  migrate(db)

  return db
}
