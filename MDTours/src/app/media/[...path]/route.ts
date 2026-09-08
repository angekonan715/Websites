import { promises as fs } from "fs";
import { NextRequest } from "next/server";
import { mimeForFile, resolveSeedPath, resolveUploadPath } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const segments = (await context.params).path ?? [];
  const candidates = [resolveUploadPath(segments), resolveSeedPath(segments)].filter(
    (value): value is string => Boolean(value)
  );
  if (!candidates.length) {
    return new Response("Not found", { status: 404 });
  }

  for (const filePath of candidates) {
    try {
      const data = await fs.readFile(filePath);
      return new Response(data, {
        headers: {
          "Content-Type": mimeForFile(filePath),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // try the next location (volume first, then image seed)
    }
  }

  return new Response("Not found", { status: 404 });
}
