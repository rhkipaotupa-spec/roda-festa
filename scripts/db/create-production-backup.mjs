import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { parsePostgresConnection, postgresTool } from "../lib/postgres-connection.mjs";

const ROOT = process.cwd();
const REQUIRED_CONFIRMATION = "CREATE_READ_ONLY_BACKUP";

function runText(tool, args, env) {
  return execFileSync(postgresTool(tool), args, {
    encoding: "utf8",
    env,
  }).trim();
}

function readSourceCounts(connection) {
  const sql = [
    "SELECT",
    "(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE')::text || '|' ||",
    "(SELECT COUNT(*) FROM public.planning_sessions)::text || '|' ||",
    "(SELECT COUNT(*) FROM public.product_catalog_overrides)::text || '|' ||",
    "(SELECT COUNT(*) FROM public.product_catalog_history)::text;",
  ].join(" ");

  const output = runText("psql", [
    "--no-psqlrc",
    "--tuples-only",
    "--no-align",
    `--command=${sql}`,
  ], connection.childEnv);

  if (!/^\d+\|\d+\|\d+\|\d+$/.test(output)) {
    throw new Error("BACKUP_SOURCE_BASELINE_QUERY_FAILED");
  }

  const [publicTables, planningSessions, catalogOverrides, catalogHistory] = output
    .split("|")
    .map(Number);

  return Object.freeze({
    publicTables,
    planningSessions,
    catalogOverrides,
    catalogHistory,
  });
}

function main() {
  if (process.env.ALLOW_RODA_FESTA_DB_BACKUP !== REQUIRED_CONFIRMATION) {
    throw new Error("BACKUP_EXPLICIT_CONFIRMATION_REQUIRED");
  }

  const connection = parsePostgresConnection(
    process.env.RODA_FESTA_DATABASE_URL,
    "RODA_FESTA_DATABASE_URL",
  );

  execFileSync(postgresTool("pg_dump"), ["--version"], {
    stdio: "ignore",
    env: connection.childEnv,
  });
  execFileSync(postgresTool("psql"), ["--version"], {
    stdio: "ignore",
    env: connection.childEnv,
  });

  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();

  const sourceCounts = readSourceCounts(connection);
  const timestamp = new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replace(/\.\d{3}Z$/, "Z");

  const outputDirectory = resolve(ROOT, "..", "roda-festa-backups");
  mkdirSync(outputDirectory, { recursive: true });

  const outputPath = resolve(
    outputDirectory,
    `roda-festa-production-${timestamp}-${head.slice(0, 7)}.dump`,
  );

  execFileSync(postgresTool("pg_dump"), [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--schema=public",
    `--file=${outputPath}`,
  ], {
    stdio: "inherit",
    env: connection.childEnv,
  });

  const bytes = readFileSync(outputPath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const size = statSync(outputPath).size;
  if (size <= 0) throw new Error("BACKUP_FILE_EMPTY");

  const manifestPath = `${outputPath}.json`;
  const manifest = {
    createdAt: new Date().toISOString(),
    commit: head,
    format: "pg_dump-custom-public-schema",
    file: outputPath.split(/[\\/]/).at(-1),
    bytes: size,
    sha256,
    sourceCounts,
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("RODA_FESTA_DB_BACKUP_OK");
  console.log(`BACKUP_PATH=${outputPath}`);
  console.log(`BACKUP_MANIFEST=${manifestPath}`);
  console.log(`BACKUP_BYTES=${size}`);
  console.log(`BACKUP_SHA256=${sha256}`);
  console.log(`SOURCE_PUBLIC_TABLES=${sourceCounts.publicTables}`);
  console.log(`SOURCE_PLANNING_SESSIONS=${sourceCounts.planningSessions}`);
  console.log(`SOURCE_CATALOG_OVERRIDES=${sourceCounts.catalogOverrides}`);
  console.log(`SOURCE_CATALOG_HISTORY=${sourceCounts.catalogHistory}`);
}

main();
