import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageUrl = new URL("../package.json", import.meta.url);
const workflowUrl = new URL("../.github/workflows/admin-commercial-v1.yml", import.meta.url);
const runnerUrl = new URL("../scripts/security/run-regression-gates.mjs", import.meta.url);

async function readUtf8(url) {
  try {
    return await readFile(url, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

test("P2: package expoe comando dedicado e estavel para regressao de seguranca", async () => {
  const pkg = JSON.parse(await readFile(packageUrl, "utf8"));

  assert.equal(
    pkg.scripts?.["test:security"],
    "node scripts/security/run-regression-gates.mjs",
  );
});

test("P2: CI executa security regression gates como etapa explicita antes da suite completa", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /- name: Security regression gates\s+run: npm run test:security/);
  assert.ok(
    workflow.indexOf("Security regression gates") < workflow.indexOf("Full test suite"),
    "security regression gate must run before the full suite",
  );
});

test("P2: runner dedicado cobre auth Admin, ownership Planning, RLS/grants, XSS sinks e fronteira de segredos", async () => {
  const runner = await readUtf8(runnerUrl);
  assert.ok(runner, "scripts/security/run-regression-gates.mjs must exist");

  for (const marker of [
    "admin-session-live-identity-security.test.mjs",
    "planning-session-api.test.mjs",
    "planning-session-repository.test.mjs",
    "planning-session-supabase-adapter.test.mjs",
    "admin-persistence-schema-contract.test.mjs",
    "admin-commercial-v1-persistence.test.mjs",
    "supabase-modern-secret-key.test.mjs",
    "assertNoDangerousFrontendSinks",
    "assertNoServerSecretsInFrontend",
  ]) {
    assert.equal(
      runner.includes(marker),
      true,
      `security runner missing required coverage marker: ${marker}`,
    );
  }
});
