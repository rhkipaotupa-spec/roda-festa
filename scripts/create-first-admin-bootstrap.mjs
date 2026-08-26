import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

import {
  assertBootstrapPasswordPolicy,
  buildFirstAdminBootstrapSql,
  normalizeBootstrapIdentifier,
} from "../api/_lib/admin-bootstrap-provisioning.js";
import { hashAdminCredential } from "../api/_lib/admin-credential-verification.js";

function askLine(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function askHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("admin_bootstrap_interactive_tty_required");
  }

  return new Promise((resolve, reject) => {
    let value = "";

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
    }

    function onData(chunk) {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("admin_bootstrap_cancelled"));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }

        if (char >= " ") {
          value += char;
        }
      }
    }

    process.stdin.on("data", onData);
  });
}

async function main() {
  console.log("Roda Festa — provisionamento local do primeiro Admin");
  console.log("A senha nao sera exibida nem gravada em texto puro.");
  console.log("O SQL sensivel sera criado somente na pasta temporaria do Windows.\n");

  const identifier = normalizeBootstrapIdentifier(
    await askLine("E-mail do primeiro Admin: "),
  );

  const password = assertBootstrapPasswordPolicy(
    await askHidden("Senha forte (min. 16 caracteres): "),
  );

  const confirmation = await askHidden("Confirme a senha: ");

  if (password !== confirmation) {
    throw new Error("admin_bootstrap_password_confirmation_mismatch");
  }

  const credential = hashAdminCredential(password, {
    salt: randomBytes(16),
  });

  const sql = buildFirstAdminBootstrapSql({
    identifier,
    credential,
  });

  const filename = `roda-festa-admin-bootstrap-${Date.now()}.sql`;
  const outputPath = path.join(os.tmpdir(), filename);

  await writeFile(outputPath, sql, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });

  console.log("\nBootstrap gerado com sucesso.");
  console.log(`Arquivo temporario: ${outputPath}`);
  console.log("Nao envie o conteudo deste arquivo por chat, e-mail ou Git.");
  console.log("Depois da execucao no Supabase e da verificacao, apague o arquivo.");
}

main().catch((error) => {
  console.error(`Falha segura: ${error.message}`);
  process.exitCode = 1;
});
