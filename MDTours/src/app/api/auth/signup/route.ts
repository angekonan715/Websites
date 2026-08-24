import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import {
  ensureAdminUser,
  getUsers,
  saveUsers,
  toPublicUser,
} from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Le nom doit contenir au moins 2 caractères." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    await ensureAdminUser();
    const users = await getUsers();
    if (users.some((user) => user.email === email)) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@voyagezmdtours.com").toLowerCase();
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: email === adminEmail ? ("admin" as const) : ("user" as const),
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    await saveUsers(users);

    const publicUser = toPublicUser(user);
    const token = await createSessionToken(publicUser);
    await setSessionCookie(token);

    return NextResponse.json({ user: publicUser });
  } catch {
    return NextResponse.json(
      { error: "Inscription impossible." },
      { status: 500 }
    );
  }
}
