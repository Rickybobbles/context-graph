import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config.js";

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    owner TEXT,
    due TEXT,                -- ISO date/time or free-text window ("this weekend")
    context_trigger TEXT,    -- e.g. "when owner has a calendar event near a Migros"
    status TEXT NOT NULL DEFAULT 'open',  -- open | done | cancelled
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export interface Task {
  id: number;
  title: string;
  owner: string | null;
  due: string | null;
  context_trigger: string | null;
  status: string;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export function audit(actor: string, action: string, detail?: string): void {
  db.prepare("INSERT INTO audit_log (actor, action, detail) VALUES (?, ?, ?)").run(
    actor,
    action,
    detail ?? null,
  );
}
