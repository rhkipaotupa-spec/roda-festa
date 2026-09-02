import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve, sep } from "node:path";

import {
  encryptFile,
  parseEncryptionKey,
  sha256File,
  WEEKLY_ENCRYPTION_FORMAT,
} from "../lib/backup-encryption.mjs";

const ROOT = process.cwd();
const REQUIRED_CONFIRMATION = "CREATE_ENCRYPTED_WEEKLY_COPY";
const DEFAULT_WINDOWS_WEEKLY_DIRECTORY = "D:\\Backups\\Roda-Festa\\weekly";

function resolveWeeklyDirectory() {
  const configured = process.env.RODA_FESTA_WEEKLY_BACKUP_DIR?.trim();
  const candidate = configured
    || (process.platform === "win32"
      ? DEFAULT_WINDOWS_WEEKLY_DIRECTORY
      : resolve(ROOT, "..", "roda-festa-weekly-backups"));

  const outputDirectory = resolve(candidate);
  const repositoryPrefix = `${resolve(ROOT)}${sep}`;

  if (outputDirectory === resolve(ROOT) || outputDirectory.startsWith(repositoryPrefix)) {
    throw new Error("WEEKLY_BACKUP_DIRECTORY_MUST_BE_OUTSIDE_REPOSITORY");
  }

  return outputDirectory;
}

function readSourceManifest(backupPath) {
  const manifestPath = `${backupPath}.json`;
  if (!existsSync(manifestPath)) throw new Error("WEEKLY_SOURCE_MANIFEST_MISSING");

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error("WEEKLY_SOURCE_MANIFEST_INVALID");
  }

  if (
    typeof manifest?.sha256 !== "string"
    || !/^[0-9a-f]{64}$/i.test(manifest.sha256)
    || !Number.isFinite(Number(manifest?.bytes))
    || Number(manifest.bytes) <= 0
  ) {
    throw new Error("WEEKLY_SOURCE_MANIFEST_INCOMPLETE");
  }

  const sourceSize = statSync(backupPath).size;
  const sourceHash = createHash("sha256").update(readFileSync(backupPath)).digest("hex");

  if (sourceSize !== Number(manifest.bytes)) {
    throw new Error("WEEKLY_SOURCE_SIZE_MISMATCH");
  }
  if (sourceHash !== manifest.sha256) {
    throw new Error("WEEKLY_SOURCE_SHA256_MISMATCH");
  }

  return Object.freeze({ manifestPath, manifest, sourceSize, sourceHash });
}

async function main() {
  if (process.env.ALLOW_RODA_FESTA_WEEKLY_ENCRYPTION !== REQUIRED_CONFIRMATION) {
    throw new Error("WEEKLY_ENCRYPTION_EXPLICIT_CONFIRMATION_REQUIRED");
  }

  const backupPath = process.argv[2] ? resolve(process.argv[2]) : null;
  if (!backupPath || !existsSync(backupPath)) {
    throw new Error("WEEKLY_SOURCE_BACKUP_MISSING");
  }

  const key = parseEncryptionKey(process.env.RODA_FESTA_BACKUP_ENCRYPTION_KEY);
  const source = readSourceManifest(backupPath);
  const outputDirectory = resolveWeeklyDirectory();
  mkdirSync(outputDirectory, { recursive: true });

  const sourceName = basename(backupPath);
  const encryptedBackupName = `${sourceName}.rfenc`;
  const encryptedManifestName = `${sourceName}.json.rfenc`;
  const encryptedBackupPath = resolve(outputDirectory, encryptedBackupName);
  const encryptedManifestPath = resolve(outputDirectory, encryptedManifestName);

  if (existsSync(encryptedBackupPath) || existsSync(encryptedManifestPath)) {
    throw new Error("WEEKLY_ENCRYPTED_OUTPUT_ALREADY_EXISTS");
  }

  const backupEncryption = await encryptFile({
    sourcePath: backupPath,
    outputPath: encryptedBackupPath,
    key,
    aad: source.sourceHash,
  });

  try {
    await encryptFile({
      sourcePath: source.manifestPath,
      outputPath: encryptedManifestPath,
      key,
      aad: source.sourceHash,
    });
  } catch (error) {
    throw new Error("WEEKLY_MANIFEST_ENCRYPTION_FAILED", { cause: error });
  }

  const encryptedBackupSha256 = await sha256File(encryptedBackupPath);
  const encryptedManifestSha256 = await sha256File(encryptedManifestPath);
  const envelopePath = resolve(outputDirectory, `${sourceName}.weekly.json`);

  const envelope = {
    createdAt: new Date().toISOString(),
    format: WEEKLY_ENCRYPTION_FORMAT,
    algorithm: "AES-256-GCM",
    source: {
      file: sourceName,
      bytes: source.sourceSize,
      sha256: source.sourceHash,
    },
    encrypted: {
      backupFile: encryptedBackupName,
      backupBytes: statSync(encryptedBackupPath).size,
      backupSha256: encryptedBackupSha256,
      manifestFile: encryptedManifestName,
      manifestBytes: statSync(encryptedManifestPath).size,
      manifestSha256: encryptedManifestSha256,
      authTagBytes: backupEncryption.authTagBytes,
    },
  };

  writeFileSync(envelopePath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");

  console.log("RODA_FESTA_WEEKLY_ENCRYPTED_COPY_OK");
  console.log(`WEEKLY_ENCRYPTED_BACKUP=${encryptedBackupPath}`);
  console.log(`WEEKLY_ENCRYPTED_MANIFEST=${encryptedManifestPath}`);
  console.log(`WEEKLY_ENVELOPE=${envelopePath}`);
  console.log(`SOURCE_BACKUP_SHA256=${source.sourceHash}`);
  console.log(`ENCRYPTED_BACKUP_SHA256=${encryptedBackupSha256}`);
  console.log(`ENCRYPTED_MANIFEST_SHA256=${encryptedManifestSha256}`);
}

await main();
