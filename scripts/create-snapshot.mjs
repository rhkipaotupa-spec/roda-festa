import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");

function runGit(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fail(message, code = 1) {
  console.error(`\n${message}\n`);
  process.exit(code);
}

if (!existsSync(join(root, ".git"))) {
  fail("Snapshot exige execucao dentro do repositorio Git do projeto.");
}

let status;
try {
  status = runGit(["status", "--porcelain"]);
} catch (error) {
  fail(`Falha ao consultar git status: ${error.message}`);
}

if (status) {
  console.error("\nSnapshot BLOQUEADO: a working tree nao esta limpa.\n");
  console.error(status);
  console.error("\nReconcilie codigo + FINDINGS/DECISIONS/WORKLOG, faca os commits e tente novamente.\n");
  process.exit(2);
}

const head = runGit(["rev-parse", "HEAD"]);
const short = runGit(["rev-parse", "--short", "HEAD"]);
const branch = runGit(["branch", "--show-current"]) || "detached-head";
const now = new Date();
const date = now.toISOString().slice(0, 10);
const stamp = now.toISOString();
const parent = dirname(root);
const outDir = join(parent, "roda-festa-snapshots");
const tempRoot = mkdtempSync(join(tmpdir(), "roda-festa-snapshot-"));
const stage = join(tempRoot, "roda-festa");

mkdirSync(outDir, { recursive: true });
mkdirSync(stage, { recursive: true });

let tracked;
try {
  tracked = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
} catch (error) {
  rmSync(tempRoot, { recursive: true, force: true });
  fail(`Falha ao listar arquivos rastreados: ${error.message}`);
}

for (const relativePath of tracked) {
  const source = join(root, relativePath);
  const destination = join(stage, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { force: true, recursive: true });
}

const manifest = [
  "RODA FESTA SNAPSHOT",
  `Generated: ${stamp}`,
  `Branch: ${branch}`,
  `Commit: ${head}`,
  `Short commit: ${short}`,
  "Working tree: clean",
  "",
  "Governance: snapshot generated only after clean-tree verification.",
  "Review docs/FINDINGS.md, docs/DECISIONS.md and docs/WORKLOG.md for checkpoint context.",
  "",
].join("\r\n");

writeFileSync(join(stage, "SNAPSHOT-MANIFEST.txt"), manifest, "utf8");

const zipPath = join(outDir, `roda-festa-snapshot-${date}-${short}.zip`);
rmSync(zipPath, { force: true });

const tar = spawnSync(
  "tar",
  ["-a", "-c", "-f", zipPath, "roda-festa"],
  {
    cwd: tempRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (tar.status !== 0) {
  rmSync(tempRoot, { recursive: true, force: true });
  fail(`Falha ao compactar snapshot com tar.\n${tar.stderr || tar.stdout}`);
}

rmSync(tempRoot, { recursive: true, force: true });

console.log("\nSnapshot criado:");
console.log(zipPath);
