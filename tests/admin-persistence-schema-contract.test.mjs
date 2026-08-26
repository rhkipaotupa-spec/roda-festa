import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(
  new URL("../supabase/admin/001_admin_persistence_contract.sql", import.meta.url),
  "utf8",
);

test("schema define admin_users com identificador normalizado e unico", () => {
  assert.match(sql, /create table if not exists public\.admin_users/i);
  assert.match(sql, /identifier text not null/i);
  assert.match(sql, /identifier = lower\(trim\(identifier\)\)/i);
  assert.match(sql, /create unique index if not exists admin_users_identifier_uidx/i);
});

test("schema define material de verificacao sem campo de senha bruta", () => {
  assert.match(sql, /credential_algorithm text not null/i);
  assert.match(sql, /credential_salt text not null/i);
  assert.match(sql, /credential_hash text not null/i);
  assert.match(sql, /credential_key_length integer not null/i);

  assert.equal(/\bpassword\b/i.test(sql), false);
  assert.equal(/\bcredential_raw\b/i.test(sql), false);
});

test("schema define admin_sessions com token hash unico e sem token bruto", () => {
  assert.match(sql, /create table if not exists public\.admin_sessions/i);
  assert.match(sql, /token_hash text not null/i);
  assert.match(sql, /create unique index if not exists admin_sessions_token_hash_uidx/i);
  assert.equal(/\btoken\s+text\b/i.test(sql), false);
});

test("schema protege invariantes temporais e versionamento", () => {
  assert.match(sql, /expires_at > issued_at/i);
  assert.match(sql, /revoked_at is null or revoked_at >= issued_at/i);
  assert.match(sql, /rotated_at is null or rotated_at >= issued_at/i);
  assert.match(sql, /version >= 1/i);
});

test("schema cria indices necessarios aos adapters aprovados", () => {
  assert.match(sql, /admin_sessions_user_id_idx/i);
  assert.match(sql, /admin_sessions_active_lookup_idx/i);
  assert.match(sql, /\(token_hash,\s*revoked_at,\s*expires_at\)/i);
});

test("schema fecha tabelas para anon e authenticated", () => {
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.admin_users from anon, authenticated/i);
  assert.match(sql, /revoke all on table public\.admin_sessions from anon, authenticated/i);
});

test("schema nao cria policy aberta para clientes", () => {
  const policyLines = sql
    .split(/\r?\n/)
    .filter((line) => /^\s*create\s+policy\b/i.test(line));

  assert.deepEqual(policyLines, []);
});
