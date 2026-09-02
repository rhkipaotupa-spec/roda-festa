import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { basename, resolve } from "node:path";

import {
  decryptFile,
  parseEncryptionKey,
  sha256File,
  WEEKLY_ENCRYPTION_FORMAT,
} from "../lib/backup-encryption.mjs";

const REQUIRED_CONFIRMATION = "VERIFY_ENCRYPTED_WEEKLY_COPY";

function readEnvelope(envelopePath) {
  let envelope;
  try {
    envelope = JSON.parse(readFileSync(envelopePath, "utf8"));
  } catch {
    throw new Error("WEEKLY_ENVELOPE_INVALID");
  }

  if (
    envelope?.format !== WEEKLY_ENCRYPTION_FORMAT
    || envelope?.algorithm !== "AES-256-GCM"
    || typeof envelope?.source?.sha256 !== "string"
    || !/^[0-9a-f]{64}$/i.test(envelope.source.sha256)
    || !Number.isFinite(Number(envelope?.source?.bytes))
    || typeof envelope?.encrypted?.backupFile !== "string"
    || typeof envelope?.encrypted?.manifestFile !== "string"
  ) {
    throw new Error("WEEKLY_ENVELOPE_INCOMPLETE");
  }

  return envelope;
}

async function main() {
  if (process.env.ALLOW_RODA_FESTA_WEEKLY_VERIFY !== REQUIRED_CONFIRMATION) {
    throw new Error("WEEKLY_VERIFY_EXPLICIT_CONFIRMATION_REQUIRED");
  }

  const envelopePath = process.argv[2] ? resolve(process.argv[2]) : null;
  if (!envelopePath || !existsSync(envelopePath)) {
    throw new Error("WEEKLY_ENVELOPE_MISSING");
  }

  const key = parseEncryptionKey(process.env.RODA_FESTA_BACKUP_ENCRYPTION_KEY);
  const envelope = readEnvelope(envelopePath);
  const directory = resolve(envelopePath, "..");
  const encryptedBackupPath = resolve(directory, envelope.encrypted.backupFile);
  const encryptedManifestPath = resolve(directory, envelope.encrypted.manifestFile);

  if (!existsSync(encryptedBackupPath) || !existsSync(encryptedManifestPath)) {
    throw new Error("WEEKLY_ENCRYPTED_COMPONENT_MISSING");
  }

  const encryptedBackupSha256 = await sha256File(encryptedBackupPath);
  const encryptedManifestSha256 = await sha256File(encryptedManifestPath);

  if (encryptedBackupSha256 !== envelope.encrypted.backupSha256) {
    throw new Error("WEEKLY_ENCRYPTED_BACKUP_SHA256_MISMATCH");
  }
  if (encryptedManifestSha256 !== envelope.encrypted.manifestSha256) {
    throw new Error("WEEKLY_ENCRYPTED_MANIFEST_SHA256_MISMATCH");
  }
  if (statSync(encryptedBackupPath).size !== Number(envelope.encrypted.backupBytes)) {
    throw new Error("WEEKLY_ENCRYPTED_BACKUP_SIZE_MISMATCH");
  }
  if (statSync(encryptedManifestPath).size !== Number(envelope.encrypted.manifestBytes)) {
    throw new Error("WEEKLY_ENCRYPTED_MANIFEST_SIZE_MISMATCH");
  }

  const temporaryDirectory = resolve(
    directory,
    `.verify-${process.pid}-${Date.now()}`,
  );
  mkdirSync(temporaryDirectory, { recursive: false });

  const decryptedBackupPath = resolve(temporaryDirectory, envelope.source.file);
  const decryptedManifestPath = `${decryptedBackupPath}.json`;

  try {
    await decryptFile({
      encryptedPath: encryptedBackupPath,
      outputPath: decryptedBackupPath,
      key,
      aad: envelope.source.sha256,
    });
    await decryptFile({
      encryptedPath: encryptedManifestPath,
      outputPath: decryptedManifestPath,
      key,
      aad: envelope.source.sha256,
    });

    const restoredBackupSha256 = await sha256File(decryptedBackupPath);
    if (restoredBackupSha256 !== envelope.source.sha256) {
      throw new Error("WEEKLY_DECRYPTED_BACKUP_SHA256_MISMATCH");
    }
    if (statSync(decryptedBackupPath).size !== Number(envelope.source.bytes)) {
      throw new Error("WEEKLY_DECRYPTED_BACKUP_SIZE_MISMATCH");
    }

    let sourceManifest;
    try {
      sourceManifest = JSON.parse(readFileSync(decryptedManifestPath, "utf8"));
    } catch {
      throw new Error("WEEKLY_DECRYPTED_MANIFEST_INVALID");
    }

    if (
      sourceManifest?.sha256 !== envelope.source.sha256
      || Number(sourceManifest?.bytes) !== Number(envelope.source.bytes)
      || sourceManifest?.file !== basename(decryptedBackupPath)
    ) {
      throw new Error("WEEKLY_DECRYPTED_MANIFEST_MISMATCH");
    }

    console.log("RODA_FESTA_WEEKLY_ENCRYPTED_VERIFY_OK");
    console.log(`SOURCE_BACKUP_SHA256=${restoredBackupSha256}`);
    console.log(`SOURCE_BACKUP_BYTES=${statSync(decryptedBackupPath).size}`);
    console.log("WEEKLY_DECRYPTION_AUTHENTICATION_OK");
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
    console.log("WEEKLY_VERIFY_TEMP_REMOVED");
  }
}

await main();
