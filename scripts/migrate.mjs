#!/usr/bin/env node
/**
 * Migration runner for the Turso / libSQL database.
 *
 *   npm run db:migrate          apply every pending migration
 *   npm run db:status           show what is applied and what is pending
 *   npm run db:migrate -- --dry-run
 *   npm run db:reset -- --force drop the LOCAL database file and start over
 *
 * Migrations are the .sql files in src/lib/db/migrations, applied in filename
 * order, each one exactly once. Applied migrations are recorded in _migrations
 * along with a checksum, so an edit to an already-applied file is reported
 * instead of silently ignored.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

// Load .env.local / .env before anything reads process.env (Node >= 20.6).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(process.cwd(), file));
  } catch {
    /* file absent — fine, config has defaults */
  }
}

const { databaseConfig, resolveDbConfig, describeDbConfig } = await import(
  "../src/config/database.mjs"
);
const { getDb, applyPragmas } = await import("../src/lib/db/client.mjs");

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("-")) ?? "up";
const has = (flag) => args.includes(flag);
const DRY_RUN = has("--dry-run");
const NO_TX = has("--no-transaction");

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const MIGRATIONS_DIR = databaseConfig.migrations.dir;
const MIGRATIONS_TABLE = databaseConfig.migrations.table;

function readMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations folder not found: ${MIGRATIONS_DIR}`);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
      const checksum = crypto
        .createHash("sha256")
        .update(sql)
        .digest("hex")
        .slice(0, 16);
      return { name, sql, checksum };
    });
}

async function ensureMigrationsTable(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL UNIQUE,
      checksum    TEXT NOT NULL,
      applied_at  TEXT NOT NULL,
      duration_ms INTEGER NOT NULL
    )
  `);
}

async function appliedMigrations(db) {
  const rs = await db.execute(
    `SELECT name, checksum, applied_at FROM ${MIGRATIONS_TABLE} ORDER BY name`,
  );
  return new Map(rs.rows.map((r) => [r.name, { ...r }]));
}

async function commandStatus() {
  const db = getDb();
  await applyPragmas(db);
  await ensureMigrationsTable(db);

  const applied = await appliedMigrations(db);
  const files = readMigrations();

  console.log(`\n${c.bold("Database")}  ${describeDbConfig()}`);
  console.log(`${c.bold("Migrations")} ${MIGRATIONS_DIR}\n`);

  for (const m of files) {
    const rec = applied.get(m.name);
    if (!rec) {
      console.log(`  ${c.yellow("PENDING")}  ${m.name}`);
    } else if (rec.checksum !== m.checksum) {
      console.log(
        `  ${c.red("CHANGED")}  ${m.name}  ${c.dim(`applied ${rec.applied_at} — file has been edited since`)}`,
      );
    } else {
      console.log(
        `  ${c.green("APPLIED")}  ${m.name}  ${c.dim(rec.applied_at)}`,
      );
    }
  }

  for (const name of applied.keys()) {
    if (!files.some((f) => f.name === name)) {
      console.log(`  ${c.red("MISSING")}  ${name}  ${c.dim("(recorded as applied, file is gone)")}`);
    }
  }

  const pending = files.filter((f) => !applied.has(f.name)).length;
  console.log(
    `\n  ${files.length} migration(s), ${applied.size} applied, ${pending} pending\n`,
  );
  return pending;
}

async function commandUp() {
  const db = getDb();
  await applyPragmas(db);
  await ensureMigrationsTable(db);

  const applied = await appliedMigrations(db);
  const files = readMigrations();
  const pending = files.filter((f) => !applied.has(f.name));

  console.log(`\n${c.bold("Database")}  ${describeDbConfig()}`);

  for (const m of files) {
    const rec = applied.get(m.name);
    if (rec && rec.checksum !== m.checksum) {
      console.log(
        c.yellow(
          `\n  ! ${m.name} was already applied but the file has changed since.\n` +
            `    Migrations are immutable — add a new 000N_*.sql instead of editing this one.`,
        ),
      );
    }
  }

  if (pending.length === 0) {
    console.log(c.green("\n  Nothing to do — database is up to date.\n"));
    return;
  }

  console.log(`  ${pending.length} pending migration(s)\n`);

  for (const m of pending) {
    if (DRY_RUN) {
      console.log(`  ${c.yellow("would apply")}  ${m.name}`);
      continue;
    }

    const started = Date.now();
    process.stdout.write(`  applying ${m.name} … `);

    const script = NO_TX ? m.sql : `BEGIN;\n${m.sql}\nCOMMIT;`;

    try {
      await db.executeMultiple(script);
    } catch (err) {
      if (!NO_TX) {
        try {
          await db.executeMultiple("ROLLBACK;");
        } catch {
          /* transaction was already aborted */
        }
      }
      console.log(c.red("FAILED"));
      console.error(`\n  ${c.red(err.message)}\n`);
      console.error(
        c.dim("  No changes from this migration were kept. Fix the SQL and re-run.\n"),
      );
      process.exitCode = 1;
      return;
    }

    const duration = Date.now() - started;
    await db.execute({
      sql: `INSERT INTO ${MIGRATIONS_TABLE} (name, checksum, applied_at, duration_ms) VALUES (?, ?, ?, ?)`,
      args: [m.name, m.checksum, new Date().toISOString(), duration],
    });

    console.log(`${c.green("ok")} ${c.dim(`(${duration}ms)`)}`);
  }

  if (DRY_RUN) {
    console.log(c.dim("\n  Dry run — nothing was written.\n"));
    return;
  }

  const tables = await db.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  const views = await db.execute(
    `SELECT name FROM sqlite_master WHERE type = 'view' ORDER BY name`,
  );

  console.log(c.green(`\n  Done.`));
  console.log(`  Tables: ${tables.rows.map((r) => r.name).join(", ")}`);
  console.log(`  Views:  ${views.rows.map((r) => r.name).join(", ")}\n`);
}

async function commandReset() {
  const resolved = resolveDbConfig();

  if (resolved.mode !== "local") {
    console.error(
      c.red(
        `\n  Refusing to reset: DB_MODE is "${resolved.mode}", not "local".\n` +
          `  This command only ever deletes a local database file.\n`,
      ),
    );
    process.exitCode = 1;
    return;
  }

  if (!has("--force")) {
    console.error(
      c.yellow(
        `\n  This deletes ${resolved.file} and everything in it.\n` +
          `  Re-run with --force if that is what you want.\n`,
      ),
    );
    process.exitCode = 1;
    return;
  }

  for (const suffix of ["", "-wal", "-shm"]) {
    const f = `${resolved.file}${suffix}`;
    if (fs.existsSync(f)) {
      fs.rmSync(f);
      console.log(`  removed ${f}`);
    }
  }
  console.log(c.green("\n  Reset complete. Run `npm run db:migrate` to rebuild.\n"));
}

const commands = { up: commandUp, status: commandStatus, reset: commandReset };

const run = commands[command];
if (!run) {
  console.error(
    `Unknown command "${command}". Use one of: ${Object.keys(commands).join(", ")}`,
  );
  process.exit(1);
}

try {
  await run();
} catch (err) {
  console.error(c.red(`\n  ${err.message}\n`));
  process.exitCode = 1;
} finally {
  try {
    getDb().close();
  } catch {
    /* nothing to close */
  }
}
