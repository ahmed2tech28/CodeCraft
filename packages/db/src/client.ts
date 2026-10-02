import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';
import path from 'node:path';
import fs from 'node:fs';

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;

export interface InitDbOptions {
  dbPath?: string;
}

export function getDbPath(inputPath?: string): string {
  if (inputPath) return path.resolve(inputPath);
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    if (path.isAbsolute(envUrl)) return envUrl;
    if (fs.existsSync('/app/data')) {
      return path.resolve('/app/data', path.basename(envUrl));
    }
    return path.resolve(process.cwd(), envUrl);
  }
  if (fs.existsSync('/app/data')) {
    return '/app/data/db.sqlite';
  }
  return path.resolve(process.cwd(), 'data/db.sqlite');
}

export function getDb(options?: InitDbOptions): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  const dbPath = getDbPath(options?.dbPath);

  // Ensure target directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _sqlite = new Database(dbPath);

  // Performance pragmas for SQLite
  _sqlite.pragma('journal_mode = WAL');
  _sqlite.pragma('foreign_keys = ON');
  _sqlite.pragma('synchronous = NORMAL');

  _db = drizzle(_sqlite, { schema });
  return _db;
}

export function closeDb() {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
  }
}
