import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(
  new URL("../supabase/admin/002_admin_materialization_guard.sql", import.meta.url),
  "utf8",
);

function stripSqlLineComments(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

test("guard possui preflight read-only para existencia das tabelas", () => {
  assert.match(sql, /to_regclass\('public\.admin_users'\)/i);
  assert.match(sql, /to_regclass\('public\.admin_sessions'\)/i);
});

test("guard confirma RLS no postflight", () => {
  assert.match(sql, /relrowsecurity as rls_enabled/i);
  assert.match(sql, /admin_users/i);
  assert.match(sql, /admin_sessions/i);
});

test("guard verifica ausencia de policies", () => {
  assert.match(sql, /from pg_policies/i);
  assert.match(sql, /tablename in \('admin_users', 'admin_sessions'\)/i);
});

test("guard verifica grants de anon e authenticated", () => {
  assert.match(sql, /information_schema\.role_table_grants/i);
  assert.match(sql, /grantee in \('anon', 'authenticated'\)/i);
});

test("guard verifica indices obrigatorios", () => {
  assert.match(sql, /admin_users_identifier_uidx/i);
  assert.match(sql, /admin_sessions_token_hash_uidx/i);
  assert.match(sql, /admin_sessions_user_id_idx/i);
  assert.match(sql, /admin_sessions_active_lookup_idx/i);
});

test("guard nao contem comandos destrutivos ou de mutacao", () => {
  const executableSql = stripSqlLineComments(sql);

  assert.equal(
    /\b(drop|truncate|delete|insert|update|alter|create)\b/i.test(executableSql),
    false,
  );
});

test("checklist proibe secrets e exige parada se tabela ja existir", async () => {
  const md = await readFile(
    new URL("../src/planner/planning-book/CHANGELOG-V19.7T-ADMIN-MATERIALIZATION-GUARD.md", import.meta.url),
    "utf8",
  );

  assert.match(md, /não executa SQL remoto/i);
  assert.match(md, /não instala Supabase CLI/i);
  assert.match(md, /parar/i);
  assert.match(md, /SUPABASE_SERVICE_ROLE_KEY/i);
});
