import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createAdminQuotesHttpHandler } from "../api/admin-quotes.js";
import { createAdminQuoteLifecycleHttpHandler } from "../api/admin-quote-lifecycle.js";
import { createPlanningAdminLifecycleStore } from "../api/_lib/planning-admin-lifecycle-store.js";

function responseRecorder() {
  const headers = new Map();
  return {
    statusCode: 0,
    body: "",
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    end(value) { this.body = String(value ?? ""); },
    json() { return JSON.parse(this.body); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
  };
}

function adminAuth() {
  return {
    authenticationComposition: {
      authenticate: async () => ({
        principal: { userId: "owner-1", role: "OWNER", capabilities: [], active: true },
      }),
    },
    authorizationBoundary: { assert: () => true },
  };
}

test("V19.10I migration cria lifecycle reversivel sem hard delete", () => {
  const sql = fs.readFileSync(
    new URL("../infra/migrations/20260829_v19_10i_admin_quote_lifecycle.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /admin_state text not null default 'ACTIVE'/);
  assert.match(sql, /'ACTIVE', 'ARCHIVED', 'TRASHED'/);
  assert.match(sql, /planning_sessions_admin_state_activity_idx/);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.planning_sessions/i);
  assert.doesNotMatch(sql, /drop\s+table/i);
});

test("V19.10I endpoint de lifecycle aceita somente POST e bloqueia origin nao confiavel", async () => {
  const common = adminAuth();
  const handler = createAdminQuoteLifecycleHttpHandler({
    ...common,
    lifecycleStore: { changeState: async () => null },
    trustedMutationRequest: () => false,
  });

  const methodResponse = responseRecorder();
  await handler({ method: "GET", headers: {} }, methodResponse);
  assert.equal(methodResponse.statusCode, 405);
  assert.equal(methodResponse.getHeader("allow"), "POST");

  const originResponse = responseRecorder();
  await handler({ method: "POST", headers: {}, body: { id: "q-1", action: "ARCHIVE" } }, originResponse);
  assert.equal(originResponse.statusCode, 403);
  assert.deepEqual(originResponse.json(), { ok: false, error: "request_not_allowed" });
});

test("V19.10I lifecycle usa identidade administrativa confiavel e preserva reversibilidade", async () => {
  let received = null;
  const handler = createAdminQuoteLifecycleHttpHandler({
    ...adminAuth(),
    lifecycleStore: {
      async changeState(input) {
        received = input;
        return { sessionId: input.sessionId, adminState: "ARCHIVED" };
      },
    },
    trustedMutationRequest: () => true,
  });
  const response = responseRecorder();
  await handler({
    method: "POST",
    headers: { cookie: "rf_admin_session=opaque" },
    body: { id: "quote-1", action: "ARCHIVE" },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(received, {
    sessionId: "quote-1",
    action: "ARCHIVE",
    actorUserId: "owner-1",
  });
  assert.equal(response.json().lifecycle.adminState, "ARCHIVED");
});

test("V19.10I store altera somente colunas administrativas do lifecycle", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if ((options.method || "GET") === "GET") {
      return new Response(JSON.stringify([{
        id: "quote-1",
        admin_state: "ACTIVE",
        archived_at: null,
        trashed_at: null,
      }]), { status: 200 });
    }
    return new Response(JSON.stringify([{
      id: "quote-1",
      admin_state: "ARCHIVED",
      admin_state_updated_at: "2026-08-29T18:00:00.000Z",
      admin_state_updated_by: "owner-1",
      archived_at: "2026-08-29T18:00:00.000Z",
      trashed_at: null,
    }]), { status: 200 });
  };

  const store = createPlanningAdminLifecycleStore({
    env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "server-key" },
    fetchImpl,
    now: () => "2026-08-29T18:00:00.000Z",
  });
  const result = await store.changeState({
    sessionId: "quote-1",
    action: "ARCHIVE",
    actorUserId: "owner-1",
  });

  assert.equal(result.adminState, "ARCHIVED");
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /admin_state=eq\.ACTIVE/);
  const body = JSON.parse(calls[1].options.body);
  assert.deepEqual(Object.keys(body).sort(), [
    "admin_state",
    "admin_state_updated_at",
    "admin_state_updated_by",
    "archived_at",
    "trashed_at",
  ]);
  assert.equal("status" in body, false);
  assert.equal("recommendation_snapshot" in body, false);
  assert.equal("final_proposal_snapshot" in body, false);
  assert.equal(String(calls[1].options.method).toUpperCase(), "PATCH");
});

test("V19.10I leitura separa ACTIVE ARCHIVED TRASHED e Agenda fica somente ACTIVE", async () => {
  let listArgs = null;
  const handler = createAdminQuotesHttpHandler({
    ...adminAuth(),
    planningReadStore: {
      async listRecent(args) { listArgs = args; return []; },
      async getById() { return null; },
    },
  });
  const response = responseRecorder();
  await handler({
    method: "GET",
    headers: { cookie: "rf_admin_session=opaque" },
    query: { state: "archived", limit: "25" },
  }, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(listArgs, { limit: "25", state: "ARCHIVED" });

  const readStore = fs.readFileSync(new URL("../api/_lib/planning-admin-read-store.js", import.meta.url), "utf8");
  assert.match(readStore, /listRecent\(\{ limit = DEFAULT_LIMIT, state = "ACTIVE" \}/);
  assert.match(readStore, /admin_state=\$\{eq\(safeState\)\}/);
  assert.match(readStore, /listByEventDateRange[\s\S]*admin_state=\$\{eq\("ACTIVE"\)\}/);
});

test("V19.10I UI expoe Ativos Arquivados Lixeira e microajustes aprovados", () => {
  const source = fs.readFileSync(new URL("../src/admin/AdminWorkspace.jsx", import.meta.url), "utf8");
  const adminCss = fs.readFileSync(new URL("../src/admin/AdminWorkspace.css", import.meta.url), "utf8");
  const plannerCss = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.css", import.meta.url), "utf8");

  assert.match(source, /QUOTE_LIFECYCLE_ENDPOINT/);
  assert.match(source, />Ativos</);
  assert.match(source, />Arquivados</);
  assert.match(source, />Lixeira</);
  assert.match(source, /Mover para lixeira/);
  assert.match(source, /Restaurar/);
  assert.match(adminCss, /V19\.10I_MOBILE_BACK_CLEARANCE/);
  assert.match(adminCss, /bottom:\s*calc\(86px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(adminCss, /V19\.10I_DESKTOP_BACK_REFINEMENT/);
  assert.match(plannerCss, /\.rf-contracted-conclusion strong \{[\s\S]*font-size:\s*24px;/);
});
