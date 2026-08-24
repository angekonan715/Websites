import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Accès administrateur requis." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "La confirmation ne correspond pas." },
        { status: 400 }
      );
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l’actuel." },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const user = users.find((item) => item.id === session.id);
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect." },
        { status: 401 }
      );
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await saveUsers(users);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Modification impossible." },
      { status: 500 }
    );
  }
}
