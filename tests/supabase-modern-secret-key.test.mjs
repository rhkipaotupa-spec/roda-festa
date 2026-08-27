import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildSupabaseRestHeaders } from "../api/_lib/supabase-rest-auth.js";

const MODERN_SECRET = "sb_secret_example_test_only_12345678";
const LEGACY_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiJ9.test-only.signature";

const ADAPTER_PATHS = [
  "api/_lib/planning-session-adapters/supabase.js",
  "api/_lib/admin-identity-adapters/supabase.js",
  "api/_lib/admin-session-adapters/supabase.js",
  "api/_lib/planning-admin-read-store.js",
];

test("secret key moderna usa apenas apikey e nunca vira Bearer", () => {
  const headers = buildSupabaseRestHeaders(MODERN_SECRET);

  assert.equal(headers.apikey, MODERN_SECRET);
  assert.equal("Authorization" in headers, false);
});

test("service_role legacy preserva Authorization Bearer para compatibilidade", () => {
  const headers = buildSupabaseRestHeaders(LEGACY_SERVICE_ROLE);

  assert.equal(headers.apikey, LEGACY_SERVICE_ROLE);
  assert.equal(headers.Authorization, `Bearer ${LEGACY_SERVICE_ROLE}`);
});

test("Prefer continua centralizado sem alterar autenticacao", () => {
  const headers = buildSupabaseRestHeaders(MODERN_SECRET, {
    prefer: "return=representation",
  });

  assert.equal(headers.Prefer, "return=representation");
  assert.equal("Authorization" in headers, false);
});

test("todos os adapters Supabase usam o helper central e nao montam Bearer diretamente", async () => {
  for (const path of ADAPTER_PATHS) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(source, /buildSupabaseRestHeaders/);
    assert.doesNotMatch(source, /Authorization\s*:/);
    assert.doesNotMatch(source, /Bearer\s+\$\{serviceRoleKey\}/);
  }
});
