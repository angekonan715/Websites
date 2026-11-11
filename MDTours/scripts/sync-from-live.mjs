import { spawn } from "child_process";
import path from "path";

const ROOT = process.cwd();
const optional = process.argv.includes("--optional");

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, "scripts", script)], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

console.log("Syncing this folder from the live website (voyages, menus, photos)…");

try {
  await run("pull-live-content.mjs");
  await run("seed-uploads.mjs");
  console.log("Local copy matches the live site. Safe to edit code.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (optional) {
    console.warn(`Live sync skipped (${message}). Continuing with the files already here.`);
    process.exit(0);
  }
  console.error(`Live sync failed: ${message}`);
  process.exit(1);
}
