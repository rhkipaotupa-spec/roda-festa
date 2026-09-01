import { resolve } from "node:path";

export function parsePostgresConnection(value, label) {
  if (!value) throw new Error(`${label}_MISSING`);

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label}_INVALID`);
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(`${label}_INVALID_PROTOCOL`);
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const username = decodeURIComponent(url.username);
  const hostname = String(url.hostname || "").toLowerCase();
  const port = url.port || "5432";

  if (!hostname || !database || !username) {
    throw new Error(`${label}_INCOMPLETE`);
  }

  const childEnv = {
    ...process.env,
    PGHOST: hostname,
    PGPORT: port,
    PGUSER: username,
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: database,
  };

  const sslMode = url.searchParams.get("sslmode");
  if (sslMode) childEnv.PGSSLMODE = sslMode;

  delete childEnv.DATABASE_URL;
  delete childEnv.DIRECT_URL;
  delete childEnv.RODA_FESTA_DATABASE_URL;
  delete childEnv.RODA_FESTA_RESTORE_DATABASE_URL;

  return Object.freeze({
    childEnv,
    database,
    hostname,
    port,
    username,
    targetKey: [hostname, port, database, username].join("|"),
  });
}

export function assertLocalRestoreTarget(connection) {
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (!localHosts.has(connection.hostname)) {
    throw new Error("RESTORE_TARGET_MUST_BE_LOCALHOST");
  }
  if (connection.database !== "roda_festa_restore_test") {
    throw new Error("RESTORE_TARGET_DATABASE_NAME_INVALID");
  }
}

export function postgresTool(name, env = process.env) {
  const bin = String(env.POSTGRES_BIN || "").trim();
  if (!bin) return name;
  const executable = process.platform === "win32" ? `${name}.exe` : name;
  return resolve(bin, executable);
}
