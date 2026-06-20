// SQLite database bootstrap. Uses better-sqlite3 (synchronous, fast, file-based)
// which is ideal for a single-VM deployment. The schema holds user accounts and
// one JSON progress blob per (user, certification).

import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// DB_PATH can override the location (e.g. to a persistent volume). Defaults to a
// file alongside the server code.
const dbPath = process.env.DB_PATH || join(__dirname, 'data.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id    INTEGER NOT NULL,
    cert       TEXT NOT NULL,
    data       TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, cert),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
