import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import {
  assertLocalRestoreTarget,
  parsePostgresConnection,
} from "../scripts/lib/postgres-connection.mjs";

const ROOT = process.cwd();

function source(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("backup/recovery safety boundary", () => {
  test("parser accepts password separated from URL and keeps raw URL out of return fields", () => {
    const parsed = parsePostgresConnection(
      "postgresql://user@db.example.test:5432/app?sslmode=require",
      "TEST_URL",
      { password: "s3cr@t:/?#%" },
    );

    assert.equal(parsed.hostname, "db.example.test");
    assert.equal(parsed.database, "app");
    assert.equal(parsed.childEnv.PGPASSWORD, "s3cr@t:/?#%");
    assert.equal(parsed.childEnv.PGSSLMODE, "require");
    assert.equal(Object.hasOwn(parsed, "url"), false);
  });

  test("restore target is fail-closed to the reserved local database", () => {
    const local = parsePostgresConnection(
      "postgresql://postgres@127.0.0.1:5432/roda_festa_restore_test",
      "RESTORE",
      { password: "local" },
    );
    assert.doesNotThrow(() => assertLocalRestoreTarget(local));

    const remote = parsePostgresConnection(
      "postgresql://postgres@db.example.test:5432/roda_festa_restore_test",
      "RESTORE",
      { password: "x" },
    );
    assert.throws(() => assertLocalRestoreTarget(remote), /RESTORE_TARGET_MUST_BE_LOCALHOST/);

    const wrongDatabase = parsePostgresConnection(
      "postgresql://postgres@127.0.0.1:5432/postgres",
      "RESTORE",
      { password: "x" },
    );
    assert.throws(() => assertLocalRestoreTarget(wrongDatabase), /RESTORE_TARGET_DATABASE_NAME_INVALID/);
  });

  test("backup requires explicit confirmation, custom format, checksum and source baseline", () => {
    const text = source("scripts/db/create-production-backup.mjs");
    assert.match(text, /ALLOW_RODA_FESTA_DB_BACKUP/);
    assert.match(text, /CREATE_READ_ONLY_BACKUP/);
    assert.match(text, /RODA_FESTA_DATABASE_PASSWORD/);
    assert.match(text, /--format=custom/);
    assert.match(text, /createHash\("sha256"\)/);
    assert.match(text, /sourceCounts/);
    assert.match(text, /planning_sessions/);
    assert.match(text, /product_catalog_overrides/);
    assert.match(text, /product_catalog_history/);
    assert.doesNotMatch(text, /console\.log\([^\n]*RODA_FESTA_DATABASE_URL/);
    assert.doesNotMatch(text, /console\.log\([^\n]*RODA_FESTA_DATABASE_PASSWORD/);
    assert.doesNotMatch(text, /console\.log\([^\n]*PGPASSWORD/);
  });

  test("restore verifies archive and manifest before recreating local target", () => {
    const text = source("scripts/db/verify-restore.mjs");
    const integrityIndex = text.indexOf("verifyArchiveIntegrity(backupPath, manifest)");
    const dropIndex = text.indexOf('postgresTool("dropdb")');

    assert.match(text, /ALLOW_RODA_FESTA_RESTORE_TEST/);
    assert.match(text, /ERASE_LOCAL_RESTORE_TARGET/);
    assert.match(text, /RODA_FESTA_RESTORE_PASSWORD/);
    assert.match(text, /assertLocalRestoreTarget\(target\)/);
    assert.match(text, /RESTORE_BACKUP_SHA256_MISMATCH/);
    assert.match(text, /pg_restore/);
    assert.match(text, /--list/);
    assert.match(text, /--clean/);
    assert.match(text, /--if-exists/);
    assert.match(text, /BACKUP_AND_RESTORE_RECOVERY_PROOF_OK/);
    assert.ok(integrityIndex >= 0 && dropIndex > integrityIndex);
  });

  test("runbook forbids merge before a real restore proof", () => {
    const text = source("docs/security/RESILIENCE_DR.md");
    assert.match(text, /backup só é considerado comprovado quando um restore isolado foi executado/i);
    assert.match(text, /Não mergear em `main` somente porque os scripts existem/);
    assert.match(text, /roda_festa_restore_test/);
  });
});
