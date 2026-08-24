import { promises as fs } from "fs";
import { NextRequest } from "next/server";
import { mimeForFile, resolveUploadPath } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const filePath = resolveUploadPath((await context.params).path ?? []);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(filePath);
    return new Response(data, {
      headers: {
        "Content-Type": mimeForFile(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
