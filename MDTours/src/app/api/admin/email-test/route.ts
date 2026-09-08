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
          "Email non configuré. Sur Railway Hobby, ajoutez RESEND_API_KEY. Sur Railway Pro, SMTP_HOST / SMTP_USER / SMTP_PASS suffisent.",
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
