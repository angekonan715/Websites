import { NextResponse } from "next/server";
import { getContactMessages, saveContactMessages } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (name.length < 2 || !email.includes("@") || message.length < 10) {
      return NextResponse.json(
        { error: "Nom, email et message sont requis." },
        { status: 400 }
      );
    }

    const messages = await getContactMessages();
    messages.push({
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      message,
      createdAt: new Date().toISOString(),
    });
    await saveContactMessages(messages);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
  }
}
