import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  assertBootstrapPasswordPolicy,
  buildFirstAdminBootstrapSql,
  normalizeBootstrapIdentifier,
} from "../api/_lib/admin-bootstrap-provisioning.js";

const credential = {
  algorithm: "scrypt",
  salt: "salt-test-only",
  hash: "hash-test-only",
  keyLength: 32,
};

test("bootstrap normaliza identificador administrativo", () => {
  assert.equal(
    normalizeBootstrapIdentifier("  OWNER@EXAMPLE.TEST "),
    "owner@example.test",
  );
});

test("bootstrap rejeita identificador vazio ou sem formato minimo de email", () => {
  assert.throws(
    () => normalizeBootstrapIdentifier("owner"),
    /admin_bootstrap_identifier_invalid/,
  );
});

test("bootstrap exige senha forte e longa antes do hashing", () => {
  assert.throws(
    () => assertBootstrapPasswordPolicy("curta"),
    /admin_bootstrap_password_too_short/,
  );

  assert.throws(
    () => assertBootstrapPasswordPolicy("abcdefghijklmnop"),
    /admin_bootstrap_password_policy_failed/,
  );

  assert.equal(
    assertBootstrapPasswordPolicy("Senha-Longa-2026!"),
    "Senha-Longa-2026!",
  );
});

test("sql de bootstrap nunca contem senha bruta e persiste somente material de verificacao", () => {
  const sql = buildFirstAdminBootstrapSql({
    identifier: "owner@example.test",
    credential,
  });

  assert.match(sql, /credential_algorithm/i);
  assert.match(sql, /credential_salt/i);
  assert.match(sql, /credential_hash/i);
  assert.match(sql, /credential_key_length/i);
  assert.equal(sql.includes("Senha-Longa-2026!"), false);
});

test("sql de bootstrap e one-time e recusa banco com admin existente", () => {
  const sql = buildFirstAdminBootstrapSql({
    identifier: "owner@example.test",
    credential,
  });

  assert.match(sql, /if exists \(select 1 from public\.admin_users limit 1\)/i);
  assert.match(sql, /admin_bootstrap_refused_existing_admin/i);
  assert.match(sql, /'OWNER'/);
  assert.match(sql, /'\[\]'::jsonb/);
});

test("bootstrap nao usa service role, connection string ou escrita remota", async () => {
  const source = await readFile(
    new URL("../scripts/create-first-admin-bootstrap.mjs", import.meta.url),
    "utf8",
  );

  assert.equal(/SUPABASE_SERVICE_ROLE_KEY/.test(source), false);
  assert.equal(/DATABASE_URL/.test(source), false);
  assert.equal(/\bfetch\s*\(/.test(source), false);
});

test("bootstrap exige entrada interativa e grava SQL somente em pasta temporaria", async () => {
  const source = await readFile(
    new URL("../scripts/create-first-admin-bootstrap.mjs", import.meta.url),
    "utf8",
  );

  assert.match(source, /process\.stdin\.isTTY/);
  assert.match(source, /setRawMode\(true\)/);
  assert.match(source, /os\.tmpdir\(\)/);
  assert.match(source, /mode:\s*0o600/);
  assert.equal(/process\.argv/.test(source), false);
  assert.equal(/ADMIN_PASSWORD/.test(source), false);
});
