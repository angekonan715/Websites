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

function publicDir(folder: PublicFolder) {
  return path.join(process.cwd(), "public", folder);
}

export function publicFilePath(publicPath: string) {
  const relative = publicPath.replace(/^\/+/, "").replace(/[\\/]/g, path.sep);
  return path.join(process.cwd(), "public", relative);
}

async function toBuffer(input: File | Buffer | string) {
  if (Buffer.isBuffer(input)) return input;
  if (typeof input === "string") return fs.readFile(publicFilePath(input));
  return Buffer.from(await input.arrayBuffer());
}

export async function saveProcessedImage(
  input: File | Buffer | string,
  folder: Exclude<PublicFolder, "video">,
  basename: string,
  preset: MediaPreset
) {
  const { width, height } = MEDIA_PRESETS[preset];
  const dir = publicDir(folder);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${basename}.jpg`;
  try {
    await sharp(await toBuffer(input))
      .rotate()
      .resize(width, height, { fit: "cover", position: "centre" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(dir, filename));
  } catch {
    throw new Error(
      "Cette photo n’a pas pu être lue. Envoyez un JPG, PNG ou WEBP (pas HEIC)."
    );
  }
  return `/${folder}/${filename}`;
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

  const dir = publicDir("video");
  await fs.mkdir(dir, { recursive: true });
  const filename = `${basename}.mp4`;
  const outPath = path.join(dir, filename);
  const tmpIn = path.join(
    os.tmpdir(),
    `mdtours-in-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );

  try {
    if (typeof input === "string") {
      await fs.copyFile(publicFilePath(input), tmpIn);
    } else {
      await fs.writeFile(tmpIn, Buffer.from(await input.arrayBuffer()));
    }

    const bin = typeof ffmpegPath === "string" && ffmpegPath ? ffmpegPath : "";
    if (!bin) {
      await fs.copyFile(tmpIn, outPath);
      return `/video/${filename}`;
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
    return `/video/${filename}`;
  } finally {
    await fs.unlink(tmpIn).catch(() => undefined);
  }
}
