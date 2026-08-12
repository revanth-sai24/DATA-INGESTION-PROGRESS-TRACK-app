/**
 * ============================================================================
 *  DATABASE CONFIGURATION  —  Turso / libSQL
 * ============================================================================
 *
 *  This is the ONLY place that knows where the database lives.
 *  Everything else (app code, migration runner, import scripts) reads from here.
 *
 *  ---------------------------------------------------------------------------
 *  RIGHT NOW: local mode. The database is a plain file on disk (data/tracking.db).
 *  It is a real libSQL/SQLite database — the same engine Turso runs in the cloud,
 *  so nothing has to change in the app when you switch.
 *
 *  LATER: to move to Turso cloud, either
 *     (a) set DB_MODE=turso + TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env.local, or
 *     (b) change `mode` below to "turso" and fill in the `turso` block.
 *  ---------------------------------------------------------------------------
 */

import path from "node:path";

const ROOT = process.cwd();
const env = (key, fallback = "") => process.env[key] ?? fallback;

export const databaseConfig = {
  /**
   * Active mode. Change this one line (or set DB_MODE in .env.local) to move
   * the whole app between environments.
   *
   *   "local"    → file on disk, no network, no auth token needed.   [CURRENT]
   *   "turso"    → Turso cloud database over the network.
   *   "embedded" → local file that syncs with Turso in the background
   *                (fast local reads + cloud durability).
   */
  mode: env("DB_MODE", "local"),

  /** ---------------- LOCAL (current) ---------------- */
  local: {
    // Relative to the project root. Change the filename here if you want.
    file: env("LOCAL_DB_FILE", "data/tracking.db"),
  },

  /** ---------------- TURSO CLOUD (fill in later) ----------------
   *  Get these from:  turso db show <name> --url   /   turso db tokens create <name>
   *  Keep the auth token in .env.local — never commit it.
   */
  turso: {
    url: env("TURSO_DATABASE_URL", ""), // e.g. libsql://tracking-app-<org>.turso.io
    authToken: env("TURSO_AUTH_TOKEN", ""),
  },

  /** ---------------- EMBEDDED REPLICA (optional, later) ---------------- */
  embedded: {
    file: env("EMBEDDED_DB_FILE", "data/replica.db"),
    syncUrl: env("TURSO_DATABASE_URL", ""),
    authToken: env("TURSO_AUTH_TOKEN", ""),
    syncIntervalSeconds: Number(env("TURSO_SYNC_INTERVAL", "60")),
  },

  /** ---------------- MIGRATIONS ---------------- */
  migrations: {
    dir: path.join(ROOT, "src", "lib", "db", "migrations"),
    table: "_migrations",
  },

  /** ---------------- LEGACY CSV (source data for the one-off import) ----------------
   *  These are the files the app writes today. The importer reads them once to
   *  backfill the database; after cutover they are only kept as a backup.
   */
  legacyCsv: {
    tasks: path.join(ROOT, "public", "sample-tasks.csv"),
    projects: path.join(ROOT, "public", "sample-projects.csv"),
  },

  /** ---------------- CONNECTION PRAGMAS ---------------- */
  pragmas: {
    foreignKeys: true, // enforce ON DELETE CASCADE / SET NULL
  },
};

/**
 * Resolves the config above into the exact options `createClient()` needs.
 * Throws early with a clear message if a cloud mode is selected but not configured.
 */
export function resolveDbConfig(cfg = databaseConfig) {
  switch (cfg.mode) {
    case "local": {
      const file = path.resolve(ROOT, cfg.local.file);
      return { mode: "local", file, url: `file:${file}` };
    }

    case "turso": {
      if (!cfg.turso.url) {
        throw new Error(
          "DB_MODE=turso but no TURSO_DATABASE_URL is set. Add it to .env.local " +
            "or switch `mode` back to 'local' in src/config/database.mjs.",
        );
      }
      return {
        mode: "turso",
        url: cfg.turso.url,
        authToken: cfg.turso.authToken || undefined,
      };
    }

    case "embedded": {
      if (!cfg.embedded.syncUrl) {
        throw new Error(
          "DB_MODE=embedded but no TURSO_DATABASE_URL is set to sync from.",
        );
      }
      const file = path.resolve(ROOT, cfg.embedded.file);
      return {
        mode: "embedded",
        file,
        url: `file:${file}`,
        syncUrl: cfg.embedded.syncUrl,
        authToken: cfg.embedded.authToken || undefined,
        syncInterval: cfg.embedded.syncIntervalSeconds,
      };
    }

    default:
      throw new Error(
        `Unknown DB_MODE "${cfg.mode}". Use "local", "turso", or "embedded".`,
      );
  }
}

/** Human-readable one-liner for logs, with the auth token redacted. */
export function describeDbConfig(resolved = resolveDbConfig()) {
  if (resolved.mode === "local") return `local file → ${resolved.file}`;
  if (resolved.mode === "embedded")
    return `embedded replica ${resolved.file} ← ${resolved.syncUrl}`;
  return `turso → ${resolved.url}${resolved.authToken ? " (token set)" : " (NO TOKEN)"}`;
}

export default databaseConfig;
