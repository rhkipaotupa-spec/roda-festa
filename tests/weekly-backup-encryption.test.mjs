import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import {
  decryptFile,
  encryptFile,
  parseEncryptionKey,
  sha256File,
  WEEKLY_ENCRYPTION_FORMAT,
} from "../scripts/lib/backup-encryption.mjs";

function temporaryDirectory() {
  return mkdtempSync(join(tmpdir(), "roda-festa-weekly-"));
}

test("weekly encryption key must be exactly 32-byte hex", () => {
  assert.equal(parseEncryptionKey("ab".repeat(32)).length, 32);
  assert.throws(
    () => parseEncryptionKey("short"),
    /WEEKLY_ENCRYPTION_KEY_MUST_BE_32_BYTE_HEX/,
  );
});

test("weekly AES-256-GCM round-trip preserves bytes and SHA-256", async () => {
  const directory = temporaryDirectory();
  try {
    const sourcePath = join(directory, "source.dump");
    const encryptedPath = join(directory, "source.dump.rfenc");
    const decryptedPath = join(directory, "restored.dump");
    const sourceBytes = randomBytes(1024 * 64 + 17);
    writeFileSync(sourcePath, sourceBytes);

    const sourceSha = await sha256File(sourcePath);
    const key = randomBytes(32);
    const result = await encryptFile({
      sourcePath,
      outputPath: encryptedPath,
      key,
      aad: sourceSha,
    });

    assert.equal(result.format, WEEKLY_ENCRYPTION_FORMAT);
    assert.equal(result.authTagBytes, 16);
    assert.equal(readFileSync(encryptedPath).equals(sourceBytes), false);

    await decryptFile({
      encryptedPath,
      outputPath: decryptedPath,
      key,
      aad: sourceSha,
    });

    assert.deepEqual(readFileSync(decryptedPath), sourceBytes);
    assert.equal(await sha256File(decryptedPath), sourceSha);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("weekly encrypted copy fails authentication with the wrong key", async () => {
  const directory = temporaryDirectory();
  try {
    const sourcePath = join(directory, "source.dump");
    const encryptedPath = join(directory, "source.dump.rfenc");
    const wrongOutputPath = join(directory, "wrong.dump");
    writeFileSync(sourcePath, randomBytes(4096));

    const sourceSha = await sha256File(sourcePath);
    await encryptFile({
      sourcePath,
      outputPath: encryptedPath,
      key: randomBytes(32),
      aad: sourceSha,
    });

    await assert.rejects(
      decryptFile({
        encryptedPath,
        outputPath: wrongOutputPath,
        key: randomBytes(32),
        aad: sourceSha,
      }),
      /WEEKLY_ENCRYPTED_AUTHENTICATION_FAILED/,
    );

    assert.equal(existsSync(wrongOutputPath), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("weekly encryption scripts require explicit confirmations and never print the key", () => {
  const createText = readFileSync(
    new URL("../scripts/db/create-weekly-encrypted-copy.mjs", import.meta.url),
    "utf8",
  );
  const verifyText = readFileSync(
    new URL("../scripts/db/verify-weekly-encrypted-copy.mjs", import.meta.url),
    "utf8",
  );

  assert.match(createText, /CREATE_ENCRYPTED_WEEKLY_COPY/);
  assert.match(createText, /RODA_FESTA_BACKUP_ENCRYPTION_KEY/);
  assert.match(createText, /D:\\\\Backups\\\\Roda-Festa\\\\weekly/);
  assert.match(createText, /WEEKLY_BACKUP_DIRECTORY_MUST_BE_OUTSIDE_REPOSITORY/);
  assert.match(verifyText, /VERIFY_ENCRYPTED_WEEKLY_COPY/);
  assert.match(verifyText, /WEEKLY_DECRYPTION_AUTHENTICATION_OK/);
  assert.doesNotMatch(createText, /console\.log\([^\n]*RODA_FESTA_BACKUP_ENCRYPTION_KEY/);
  assert.doesNotMatch(verifyText, /console\.log\([^\n]*RODA_FESTA_BACKUP_ENCRYPTION_KEY/);
});
