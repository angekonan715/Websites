import { NextResponse } from "next/server";
import { agencyContact } from "@/data/home";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { getAppUrl, issuePasswordReset } from "@/lib/passwordReset";
import { getUsers } from "@/lib/store";

const genericOk = {
  ok: true,
  message:
    "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé. Vérifiez aussi vos spams.",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const smtpReady = isEmailConfigured();
    const isProd = process.env.NODE_ENV === "production";
    if (!smtpReady && isProd) {
      return NextResponse.json(
        {
          error: `L’envoi d’email n’est pas configuré. Contactez-nous à ${agencyContact.email}.`,
        },
        { status: 503 }
      );
    }

    const users = await getUsers();
    const user = users.find((item) => item.email === email);
    if (!user) {
      return NextResponse.json(genericOk);
    }

    const issued = await issuePasswordReset(user.id);
    if (issued.throttled || !issued.token) {
      return NextResponse.json(genericOk);
    }

    const resetUrl = `${getAppUrl(request)}/connexion/reinitialiser?token=${issued.token}`;

    if (smtpReady) {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
      return NextResponse.json(genericOk);
    }

    console.info(`[password-reset] ${user.email} → ${resetUrl}`);
    return NextResponse.json({
      ...genericOk,
      resetUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Envoi impossible. Réessayez dans un instant." },
      { status: 500 }
    );
  }
}
