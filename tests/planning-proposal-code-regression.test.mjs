import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }

test("proposal code authority lives on server, not browser localStorage during persisted finalize", () => {
  const api = read("api/planning-sessions.js");
  const planner = read("src/planner/planning-book/PlanningBook.jsx");
  assert.match(api, /delete submittedFinal\.code/);
  assert.match(api, /proposalCode/);
  assert.match(planner, /const draftSnapshot = buildSnapshot\(""\)/);
  assert.match(planner, /finalized\.proposalCode/);
  const finalizeStart = planner.indexOf("async function finalizePlanning()");
  const openPdfStart = planner.indexOf("function openPdf()", finalizeStart);
  assert.ok(finalizeStart >= 0 && openPdfStart > finalizeStart, "finalizePlanning function not found");
  const finalizeFunction = planner.slice(finalizeStart, openPdfStart);
  const persistedStart = finalizeFunction.indexOf("if (planningSessionPersistenceEnabled)");
  const persistedEnd = finalizeFunction.indexOf("} else {", persistedStart);
  assert.ok(persistedStart >= 0 && persistedEnd > persistedStart, "persisted finalize branch not found");
  const persistedBranch = finalizeFunction.slice(persistedStart, persistedEnd);
  assert.doesNotMatch(persistedBranch, /planningCode \|\| createPlanningCode/);
  assert.match(persistedBranch, /const draftSnapshot = buildSnapshot\(""\)/);
  assert.match(persistedBranch, /const code = String\(finalized\.proposalCode \|\| ""\)/);
});

test("finalization preserves planning timeline instead of replacing it with net deltas", () => {
  const supabase = read("api/_lib/planning-session-adapters/supabase.js");
  const memory = read("api/_lib/planning-session-adapters/memory.js");
  const supabaseFinalize = supabase.match(/async finalize\([\s\S]*?async touchContact/)?.[0] || "";
  const memoryFinalize = memory.match(/async finalize\([\s\S]*?async touchContact/)?.[0] || "";
  assert.doesNotMatch(supabaseFinalize, /planning_changes\s*:/);
  assert.doesNotMatch(memoryFinalize, /planning_changes\s*=/);
});

test("migration bootstraps sequence from existing canonical codes and denies browser roles", () => {
  const sql = read("infra/migrations/20260827_v19_8_server_proposal_codes.sql");
  assert.match(sql, /max\(right\(ps\.final_proposal_snapshot->>'code', 5\)::integer\)/);
  assert.match(sql, /on conflict \(business_date\) do update/);
  assert.match(sql, /revoke all on function public\.allocate_planning_proposal_code\(\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.allocate_planning_proposal_code\(\) to service_role/);
});
