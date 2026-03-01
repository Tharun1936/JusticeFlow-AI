import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'judicial.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      caseNumber TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      caseType TEXT NOT NULL,
      filingDate TEXT NOT NULL,
      hearings INTEGER NOT NULL DEFAULT 0,
      adjournments INTEGER NOT NULL DEFAULT 0,
      partyType TEXT NOT NULL,
      vulnerableFlag INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      petitioner TEXT NOT NULL DEFAULT '',
      respondent TEXT NOT NULL DEFAULT '',
      courtName TEXT NOT NULL DEFAULT '',
      judge TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      caseId TEXT NOT NULL UNIQUE,
      priorityScore REAL NOT NULL,
      urgencyBand TEXT NOT NULL,
      delayRisk INTEGER NOT NULL DEFAULT 0,
      predictedDays INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      generatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(caseId) REFERENCES cases(id) ON DELETE CASCADE
    );
  `);
}
