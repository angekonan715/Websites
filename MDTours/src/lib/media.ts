import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

export const MEDIA_PRESETS = {
  hero: { width: 1920, height: 1080 },
  card: { width: 1400, height: 1750 },
  wide: { width: 1600, height: 1000 },
} as const;

export type MediaPreset = keyof typeof MEDIA_PRESETS;
export type PublicFolder = "images" | "video" | "background";

export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const IMAGE_NAME = /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i;
const VIDEO_NAME = /\.(mp4|webm|mov|m4v)$/i;
const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  if (!value || typeof value === "string") return false;
  const file = value as File;
  return typeof file.arrayBuffer === "function" && Number(file.size) > 0;
}

export function isImageFile(value: FormDataEntryValue | null): value is File {
  if (!isUploadedFile(value)) return false;
  const type = (value.type || "").toLowerCase();
  const name = value.name || "";
  return type.startsWith("image/") || IMAGE_NAME.test(name);
}

export function isVideoFile(value: FormDataEntryValue | null): value is File {
  if (!isUploadedFile(value)) return false;
  const type = (value.type || "").toLowerCase();
  const name = value.name || "";
  return type.startsWith("video/") || VIDEO_NAME.test(name);
}

export function mediaSrc(folder: PublicFolder, filename: string) {
  return `/media/${folder}/${filename}`;
}

export function resolveStoredPath(storedPath: string) {
  const relative = storedPath.replace(/^\/+/, "").replace(/\\/g, "/");
  const parts = relative.split("/").filter((part) => part && part !== ".." && part !== ".");
  if (parts[0] === "media") {
    return path.join(UPLOAD_ROOT, ...parts.slice(1));
  }
  return path.join(process.cwd(), "public", ...parts);
}

export function resolveUploadPath(segments: string[]) {
  const parts = segments.filter((part) => part && part !== ".." && part !== ".");
  if (parts.length < 2) return null;
  const filePath = path.join(UPLOAD_ROOT, ...parts);
  const root = path.resolve(UPLOAD_ROOT);
  if (!path.resolve(filePath).startsWith(root + path.sep) && path.resolve(filePath) !== root) {
    return null;
  }
  return filePath;
}

export function mimeForFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  return "application/octet-stream";
}

async function ensureUploadDir(folder: PublicFolder) {
  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function toBuffer(input: File | Buffer | string) {
  if (Buffer.isBuffer(input)) return input;
  if (typeof input === "string") return fs.readFile(resolveStoredPath(input));
  return Buffer.from(await input.arrayBuffer());
}

export async function saveRawUpload(
  file: File,
  folder: PublicFolder,
  basename: string,
  extension: string
) {
  const dir = await ensureUploadDir(folder);
  const filename = `${basename}${extension}`;
  await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return mediaSrc(folder, filename);
}

export async function saveProcessedImage(
  input: File | Buffer | string,
  folder: Exclude<PublicFolder, "video">,
  basename: string,
  preset: MediaPreset
) {
  const { width, height } = MEDIA_PRESETS[preset];
  const dir = await ensureUploadDir(folder);
  const filename = `${basename}.jpg`;
  const outPath = path.join(dir, filename);
  try {
    await sharp(await toBuffer(input))
      .rotate()
      .resize(width, height, { fit: "cover", position: "centre" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outPath);
  } catch {
    throw new Error(
      "Cette photo n’a pas pu être lue. Envoyez un JPG, PNG ou WEBP (pas HEIC)."
    );
  }
  return mediaSrc(folder, filename);
}

function runFfmpeg(bin: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-800) || `ffmpeg a quitté avec le code ${code}`));
    });
  });
}

export async function saveProcessedVideo(input: File | string, basename: string) {
  if (isUploadedFile(input) && input.size > MAX_VIDEO_BYTES) {
    throw new Error("La vidéo dépasse 80 Mo. Compressez-la un peu, puis réessayez.");
  }

  const dir = await ensureUploadDir("video");
  const filename = `${basename}.mp4`;
  const outPath = path.join(dir, filename);
  const tmpIn = path.join(
    os.tmpdir(),
    `mdtours-in-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );

  try {
    if (typeof input === "string") {
      await fs.copyFile(resolveStoredPath(input), tmpIn);
    } else {
      await fs.writeFile(tmpIn, Buffer.from(await input.arrayBuffer()));
    }

    const bin = typeof ffmpegPath === "string" && ffmpegPath ? ffmpegPath : "";
    if (!bin) {
      await fs.copyFile(tmpIn, outPath);
      return mediaSrc("video", filename);
    }

    const { width, height } = MEDIA_PRESETS.hero;
    try {
      await runFfmpeg(bin, [
        "-y",
        "-i",
        tmpIn,
        "-vf",
        `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-an",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        outPath,
      ]);
    } catch {
      await fs.copyFile(tmpIn, outPath);
    }
    return mediaSrc("video", filename);
  } finally {
    await fs.unlink(tmpIn).catch(() => undefined);
  }
}
