/**
 * libSQL / Turso client singleton.
 *
 * Every read and write in the app goes through here. The connection details come
 * from src/config/database.mjs — this file never hardcodes a URL.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import {
  databaseConfig,
  resolveDbConfig,
  describeDbConfig,
} from "../../config/database.mjs";

let _client = null;
let _resolved = null;

/** Returns the shared client, creating it on first use. */
export function getDb() {
  if (_client) return _client;

  _resolved = resolveDbConfig(databaseConfig);

  // For file-backed modes, make sure the folder exists before libSQL opens it.
  if (_resolved.file) {
    fs.mkdirSync(path.dirname(_resolved.file), { recursive: true });
  }

  _client = createClient({
    url: _resolved.url,
    ...(_resolved.authToken ? { authToken: _resolved.authToken } : {}),
    ...(_resolved.syncUrl ? { syncUrl: _resolved.syncUrl } : {}),
    ...(_resolved.syncInterval ? { syncInterval: _resolved.syncInterval } : {}),
  });

  return _client;
}

/** The resolved connection info (mode, file/url, …) for logging and scripts. */
export function getDbInfo() {
  if (!_resolved) getDb();
  return { ..._resolved, description: describeDbConfig(_resolved) };
}

/**
 * Enables foreign keys on the connection. SQLite defaults this to OFF, so
 * ON DELETE CASCADE would silently do nothing without it.
 * Safe to call repeatedly.
 */
export async function applyPragmas(db = getDb()) {
  if (databaseConfig.pragmas.foreignKeys) {
    await db.execute("PRAGMA foreign_keys = ON");
  }
}

/** Run a query and return plain row objects. */
export async function query(sql, args = []) {
  const db = getDb();
  const rs = await db.execute({ sql, args });
  return rs.rows.map((row) => ({ ...row }));
}

/** Run a query expecting at most one row. */
export async function queryOne(sql, args = []) {
  const rows = await query(sql, args);
  return rows[0] ?? null;
}

/** Run a write statement; returns { rowsAffected, lastInsertRowid }. */
export async function execute(sql, args = []) {
  const db = getDb();
  const rs = await db.execute({ sql, args });
  return { rowsAffected: rs.rowsAffected, lastInsertRowid: rs.lastInsertRowid };
}

/**
 * Run several statements atomically — all of them apply, or none do.
 * `stmts` is an array of { sql, args } objects.
 */
export async function transaction(stmts) {
  const db = getDb();
  return db.batch(stmts, "write");
}

/** ISO-8601 UTC timestamp, the format every *_at column in this schema uses. */
export function now() {
  return new Date().toISOString();
}

export default getDb;
