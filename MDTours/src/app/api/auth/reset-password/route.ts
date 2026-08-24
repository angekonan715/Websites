import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { consumePasswordReset } from "@/lib/passwordReset";
import { getUserById, toPublicUser, updateUser } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };
    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!token) {
      return NextResponse.json(
        { error: "Lien de réinitialisation invalide." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "La confirmation ne correspond pas." },
        { status: 400 }
      );
    }

    const reset = await consumePasswordReset(token);
    if (!reset) {
      return NextResponse.json(
        {
          error:
            "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
        },
        { status: 400 }
      );
    }

    const user = await getUserById(reset.userId);
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await updateUser(user);

    const publicUser = toPublicUser(user);
    const session = await createSessionToken(publicUser);
    await setSessionCookie(session);

    return NextResponse.json({ user: publicUser });
  } catch {
    return NextResponse.json(
      { error: "Réinitialisation impossible." },
      { status: 500 }
    );
  }
}
