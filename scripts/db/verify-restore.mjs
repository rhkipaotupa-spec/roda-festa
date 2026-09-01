import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";

import {
  assertLocalRestoreTarget,
  parsePostgresConnection,
  postgresTool,
} from "../lib/postgres-connection.mjs";

const REQUIRED_CONFIRMATION = "ERASE_LOCAL_RESTORE_TARGET";

function readManifest(backupPath) {
  const manifestPath = `${backupPath}.json`;
  if (!existsSync(manifestPath)) throw new Error("RESTORE_MANIFEST_MISSING");

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error("RESTORE_MANIFEST_INVALID");
  }

  const expectedCounts = manifest?.sourceCounts;
  if (
    !manifest?.sha256
    || !Number.isFinite(Number(manifest?.bytes))
    || !expectedCounts
    || !["publicTables", "planningSessions", "catalogOverrides", "catalogHistory"]
      .every((key) => Number.isInteger(Number(expectedCounts[key])))
  ) {
    throw new Error("RESTORE_MANIFEST_INCOMPLETE");
  }

  return manifest;
}

function verifyArchiveIntegrity(backupPath, manifest) {
  const bytes = readFileSync(backupPath);
  const actualSha = createHash("sha256").update(bytes).digest("hex");
  const actualSize = statSync(backupPath).size;

  if (actualSha !== manifest.sha256) throw new Error("RESTORE_BACKUP_SHA256_MISMATCH");
  if (actualSize !== Number(manifest.bytes)) throw new Error("RESTORE_BACKUP_SIZE_MISMATCH");

  execFileSync(postgresTool("pg_restore"), ["--list", backupPath], {
    stdio: "ignore",
  });
  console.log("RESTORE_ARCHIVE_READABLE_OK");
}

function adminEnvironment(target) {
  return {
    ...target.childEnv,
    PGDATABASE: "postgres",
  };
}

function queryRestoredCounts(target) {
  const sql = [
    "SELECT",
    "(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE')::text || '|' ||",
    "(SELECT COUNT(*) FROM public.planning_sessions)::text || '|' ||",
    "(SELECT COUNT(*) FROM public.product_catalog_overrides)::text || '|' ||",
    "(SELECT COUNT(*) FROM public.product_catalog_history)::text;",
  ].join(" ");

  const output = execFileSync(postgresTool("psql"), [
    "--no-psqlrc",
    "--tuples-only",
    "--no-align",
    `--command=${sql}`,
  ], {
    encoding: "utf8",
    env: target.childEnv,
  }).trim();

  if (!/^\d+\|\d+\|\d+\|\d+$/.test(output)) {
    throw new Error("RESTORE_VERIFICATION_QUERY_FAILED");
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

function assertCountsMatch(expected, actual) {
  for (const key of ["publicTables", "planningSessions", "catalogOverrides", "catalogHistory"]) {
    if (Number(expected[key]) !== Number(actual[key])) {
      throw new Error(`RESTORE_COUNT_MISMATCH:${key}:${expected[key]}:${actual[key]}`);
    }
  }
}

function main() {
  if (process.env.ALLOW_RODA_FESTA_RESTORE_TEST !== REQUIRED_CONFIRMATION) {
    throw new Error("RESTORE_EXPLICIT_DESTRUCTIVE_CONFIRMATION_REQUIRED");
  }

  const backupPath = process.argv[2];
  if (!backupPath || !existsSync(backupPath)) {
    throw new Error("RESTORE_BACKUP_FILE_MISSING");
  }

  const source = parsePostgresConnection(
    process.env.RODA_FESTA_DATABASE_URL,
    "RODA_FESTA_DATABASE_URL",
    { password: process.env.RODA_FESTA_DATABASE_PASSWORD },
  );
  const target = parsePostgresConnection(
    process.env.RODA_FESTA_RESTORE_DATABASE_URL,
    "RODA_FESTA_RESTORE_DATABASE_URL",
    { password: process.env.RODA_FESTA_RESTORE_PASSWORD },
  );

  assertLocalRestoreTarget(target);
  if (source.targetKey === target.targetKey) {
    throw new Error("RESTORE_TARGET_MUST_DIFFER_FROM_PRODUCTION");
  }

  const manifest = readManifest(backupPath);
  verifyArchiveIntegrity(backupPath, manifest);

  const adminEnv = adminEnvironment(target);
  execFileSync(postgresTool("dropdb"), ["--if-exists", target.database], {
    stdio: "inherit",
    env: adminEnv,
  });
  execFileSync(postgresTool("createdb"), [target.database], {
    stdio: "inherit",
    env: adminEnv,
  });

  let verified = false;
  try {
    execFileSync(postgresTool("pg_restore"), [
      "--clean",
      "--if-exists",
      "--exit-on-error",
      "--no-owner",
      "--no-privileges",
      `--dbname=${target.database}`,
      backupPath,
    ], {
      stdio: "inherit",
      env: target.childEnv,
    });

    const restoredCounts = queryRestoredCounts(target);
    assertCountsMatch(manifest.sourceCounts, restoredCounts);
    verified = true;

    console.log("RODA_FESTA_DB_RESTORE_VERIFY_OK");
    console.log(`RESTORED_PUBLIC_TABLES=${restoredCounts.publicTables}`);
    console.log(`RESTORED_PLANNING_SESSIONS=${restoredCounts.planningSessions}`);
    console.log(`RESTORED_CATALOG_OVERRIDES=${restoredCounts.catalogOverrides}`);
    console.log(`RESTORED_CATALOG_HISTORY=${restoredCounts.catalogHistory}`);
    console.log("BACKUP_AND_RESTORE_RECOVERY_PROOF_OK");
  } finally {
    if (verified && process.env.KEEP_RODA_FESTA_RESTORE_DB !== "KEEP_FOR_INSPECTION") {
      execFileSync(postgresTool("dropdb"), ["--if-exists", target.database], {
        stdio: "inherit",
        env: adminEnv,
      });
      console.log("RESTORE_TEST_DATABASE_REMOVED");
    }
  }
}

main();
