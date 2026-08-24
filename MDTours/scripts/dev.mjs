import { spawn } from "child_process";
import { createConnection } from "net";
import { readFileSync, existsSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const PORT = Number(process.env.MDTOURS_PG_PORT || 54329);
const LOCAL_URL = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres`;

function loadEnvFile(filename) {
  const filePath = path.join(ROOT, filename);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function isLocalDatabaseUrl(url) {
  return !url || url.includes("127.0.0.1:54329") || url.includes("localhost:54329");
}

function waitForPort(port, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = createConnection({ host: "127.0.0.1", port }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Local Postgres did not start on port ${port}.`));
          return;
        }
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

const configuredUrl = process.env.DATABASE_URL?.trim() || "";
if (isLocalDatabaseUrl(configuredUrl)) {
  process.env.DATABASE_URL = configuredUrl || LOCAL_URL;
  try {
    await waitForPort(PORT, 400);
  } catch {
    const db = spawn(process.execPath, [path.join("scripts", "local-postgres.mjs")], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, MDTOURS_PG_PORT: String(PORT) },
    });
    db.on("exit", (code) => {
      if (code && code !== 0) process.exit(code);
    });
    await waitForPort(PORT);
  }
}

const next = spawn("npx", ["next", "dev"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

next.on("exit", (code) => process.exit(code ?? 0));
