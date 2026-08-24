import { mkdir } from "fs/promises";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.MDTOURS_PG_PORT || 54329);
const HOST = "127.0.0.1";
const dataDir = path.join(process.cwd(), "data", "pglite");

await mkdir(dataDir, { recursive: true });
const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({
  db,
  port: PORT,
  host: HOST,
  maxConnections: 20,
});

await server.start();
console.log(`MD Tours Postgres (PGlite) listening on ${HOST}:${PORT}`);

async function shutdown() {
  await server.stop();
  await db.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
