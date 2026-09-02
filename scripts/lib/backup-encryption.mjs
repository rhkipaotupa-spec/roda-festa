import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import {
  createReadStream,
  createWriteStream,
} from "node:fs";
import {
  appendFile,
  open,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { pipeline } from "node:stream/promises";

const MAGIC = Buffer.from("RFENCV1\n", "ascii");
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const HEADER_BYTES = MAGIC.length + IV_BYTES;

export const WEEKLY_ENCRYPTION_FORMAT = "rf-weekly-aes-256-gcm-v1";

export function parseEncryptionKey(value) {
  const normalized = String(value ?? "").trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("WEEKLY_ENCRYPTION_KEY_MUST_BE_32_BYTE_HEX");
  }

  return Buffer.from(normalized, "hex");
}

export async function sha256File(filePath) {
  const hash = createHash("sha256");
  const input = createReadStream(filePath);

  for await (const chunk of input) {
    hash.update(chunk);
  }

  return hash.digest("hex");
}

export async function encryptFile({ sourcePath, outputPath, key, aad }) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "hex"));

  const temporaryPath = `${outputPath}.tmp-${process.pid}-${Date.now()}`;
  const output = createWriteStream(temporaryPath, { flags: "wx" });

  try {
    output.write(MAGIC);
    output.write(iv);
    await pipeline(createReadStream(sourcePath), cipher, output);
    await appendFile(temporaryPath, cipher.getAuthTag());
    await rename(temporaryPath, outputPath);
  } catch (error) {
    output.destroy();
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }

  return Object.freeze({
    ivHex: iv.toString("hex"),
    authTagBytes: AUTH_TAG_BYTES,
    format: WEEKLY_ENCRYPTION_FORMAT,
  });
}

export async function decryptFile({ encryptedPath, outputPath, key, aad }) {
  const encryptedStat = await stat(encryptedPath);
  const minimumSize = HEADER_BYTES + AUTH_TAG_BYTES + 1;
  if (encryptedStat.size < minimumSize) {
    throw new Error("WEEKLY_ENCRYPTED_FILE_TOO_SMALL");
  }

  const handle = await open(encryptedPath, "r");
  let iv;
  let authTag;

  try {
    const header = Buffer.alloc(HEADER_BYTES);
    const headerRead = await handle.read(header, 0, HEADER_BYTES, 0);
    if (headerRead.bytesRead !== HEADER_BYTES) {
      throw new Error("WEEKLY_ENCRYPTED_HEADER_INCOMPLETE");
    }

    const magic = header.subarray(0, MAGIC.length);
    if (!magic.equals(MAGIC)) {
      throw new Error("WEEKLY_ENCRYPTED_MAGIC_INVALID");
    }

    iv = header.subarray(MAGIC.length, HEADER_BYTES);
    authTag = Buffer.alloc(AUTH_TAG_BYTES);
    const tagRead = await handle.read(
      authTag,
      0,
      AUTH_TAG_BYTES,
      encryptedStat.size - AUTH_TAG_BYTES,
    );
    if (tagRead.bytesRead !== AUTH_TAG_BYTES) {
      throw new Error("WEEKLY_ENCRYPTED_AUTH_TAG_INCOMPLETE");
    }
  } finally {
    await handle.close();
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(aad, "hex"));
  decipher.setAuthTag(authTag);

  const temporaryPath = `${outputPath}.tmp-${process.pid}-${Date.now()}`;
  const ciphertextStart = HEADER_BYTES;
  const ciphertextEnd = encryptedStat.size - AUTH_TAG_BYTES - 1;

  try {
    await pipeline(
      createReadStream(encryptedPath, {
        start: ciphertextStart,
        end: ciphertextEnd,
      }),
      decipher,
      createWriteStream(temporaryPath, { flags: "wx" }),
    );
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw new Error("WEEKLY_ENCRYPTED_AUTHENTICATION_FAILED", { cause: error });
  }
}
