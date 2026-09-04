import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const SECURITY_TESTS = Object.freeze([
  "tests/admin-auth-http-boundary.test.mjs",
  "tests/admin-authentication-composition.test.mjs",
  "tests/admin-authentication-contract.test.mjs",
  "tests/admin-authorization-boundary.test.mjs",
  "tests/admin-login-real-boundary-integration.test.mjs",
  "tests/admin-runtime-composition.test.mjs",
  "tests/admin-session-live-identity-security.test.mjs",
  "tests/admin-session-repository.test.mjs",
  "tests/admin-supabase-identity-store.test.mjs",
  "tests/admin-supabase-session-adapter.test.mjs",
  "tests/planning-session-api.test.mjs",
  "tests/planning-session-repository.test.mjs",
  "tests/planning-session-security.test.mjs",
  "tests/planning-session-supabase-adapter.test.mjs",
  "tests/admin-persistence-schema-contract.test.mjs",
  "tests/admin-commercial-v1-persistence.test.mjs",
  "tests/supabase-modern-secret-key.test.mjs",
  "tests/vercel-api-routing-boundary.test.mjs",
  "tests/concierge-v1.test.mjs",
]);

const FRONTEND_ROOTS = Object.freeze(["src"]);
const FRONTEND_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const DANGEROUS_FRONTEND_SINKS = Object.freeze([
  "dangerouslySetInnerHTML",
  ".innerHTML",
  "eval(",
  "new Function(",
]);
const SERVER_SECRET_MARKERS = Object.freeze([
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "DATABASE_URL",
  "RODA_FESTA_BACKUP_ENCRYPTION_KEY",
  "OPENAI_API_KEY",
]);

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(absolute));
    } else if (FRONTEND_EXTENSIONS.has(extname(entry.name))) {
      files.push(absolute);
    }
  }

  return files;
}

async function frontendSources() {
  const files = [];
  for (const root of FRONTEND_ROOTS) {
    files.push(...await walkFiles(join(ROOT, root)));
  }
  return files;
}

export async function assertNoDangerousFrontendSinks() {
  const violations = [];
  for (const file of await frontendSources()) {
    const source = await readFile(file, "utf8");
    for (const marker of DANGEROUS_FRONTEND_SINKS) {
      if (source.includes(marker)) {
        violations.push(`${relative(ROOT, file)}:${marker}`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`dangerous_frontend_sink_detected:${violations.join(",")}`);
  }
}

export async function assertNoServerSecretsInFrontend() {
  const violations = [];
  for (const file of await frontendSources()) {
    const source = await readFile(file, "utf8");
    for (const marker of SERVER_SECRET_MARKERS) {
      if (source.includes(marker)) {
        violations.push(`${relative(ROOT, file)}:${marker}`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`server_secret_marker_in_frontend:${violations.join(",")}`);
  }
}

function runFocusedSecurityTests() {
  execFileSync(process.execPath, ["--test", ...SECURITY_TESTS], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  runFocusedSecurityTests();
  await assertNoDangerousFrontendSinks();
  await assertNoServerSecretsInFrontend();
  process.stdout.write("Security regression gates: GREEN\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
