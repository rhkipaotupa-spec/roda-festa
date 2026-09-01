import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../infra/migrations/20260831_admin_commercial_v1.sql", import.meta.url),
  "utf8",
);
const store = await readFile(
  new URL("../api/_lib/product-catalog-store.js", import.meta.url),
  "utf8",
);

test("migração fecha catálogo direto para anon/authenticated e mantém RLS", () => {
  assert.match(migration, /alter table public\.product_catalog_overrides enable row level security;/);
  assert.match(migration, /alter table public\.product_catalog_history enable row level security;/);
  assert.match(migration, /revoke all on table public\.product_catalog_overrides from anon, authenticated;/);
  assert.match(migration, /revoke all on table public\.product_catalog_history from anon, authenticated;/);
});

test("histórico de catálogo é append-only no banco", () => {
  assert.match(migration, /create or replace function public\.protect_product_catalog_history\(\)/);
  assert.match(migration, /before update or delete on public\.product_catalog_history/);
  assert.match(migration, /product_catalog_history_is_append_only/);
});

test("revisões administrativas exigem incremento único e append de histórico", () => {
  assert.match(migration, /admin_commercial_revision_must_increment_once/);
  assert.match(migration, /admin_revision_history_must_append_once/);
  assert.match(migration, /admin_revision_history_is_append_only/);
  assert.match(migration, /admin_commercial_revision_metadata_required/);
});

test("escrita de catálogo é atômica via RPC server-only", () => {
  assert.match(migration, /create or replace function public\.rf_admin_write_product_catalog/);
  assert.match(migration, /revoke all on function public\.rf_admin_write_product_catalog[\s\S]*from public, anon, authenticated;/);
  assert.match(migration, /grant execute on function public\.rf_admin_write_product_catalog[\s\S]*to service_role;/);
  assert.match(store, /rpc\/rf_admin_write_product_catalog/);
  assert.doesNotMatch(store, /request\("product_catalog_history"/);
  assert.doesNotMatch(store, /product_catalog_overrides\?on_conflict=product_id/);
});
