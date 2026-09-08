import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEmailConfigured, sendTestEmail } from "@/lib/email";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "SMTP n’est pas configuré. Sur Railway, ajoutez SMTP_HOST, SMTP_USER et SMTP_PASS.",
      },
      { status: 400 }
    );
  }

  try {
    await sendTestEmail(user.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Envoi impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
