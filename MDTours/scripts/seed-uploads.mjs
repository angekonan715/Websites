import { copyFile, mkdir, readdir, stat } from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const SEED = path.join(ROOT, "data", "media-seed");
const DEST = path.join(ROOT, "data", "uploads");

async function copyMissing(fromDir, toDir) {
  let entries = [];
  try {
    entries = await readdir(fromDir, { withFileTypes: true });
  } catch {
    return 0;
  }

  await mkdir(toDir, { recursive: true });
  let copied = 0;

  for (const entry of entries) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copied += await copyMissing(from, to);
      continue;
    }
    if (!entry.isFile()) continue;
    try {
      await stat(to);
    } catch {
      await copyFile(from, to);
      copied += 1;
    }
  }

  return copied;
}

const copied = await copyMissing(SEED, DEST);
await mkdir(path.join(DEST, "images"), { recursive: true });
await mkdir(path.join(DEST, "video"), { recursive: true });
await mkdir(path.join(DEST, "background"), { recursive: true });
console.log(`seed-uploads: ${copied} missing file(s) copied to data/uploads`);
