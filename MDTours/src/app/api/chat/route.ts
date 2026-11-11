import { NextResponse } from "next/server";
import { answerChat } from "@/lib/chatAnswers";
import { getDestinations } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let message = "";
  try {
    const body = (await request.json()) as { message?: string };
    message = String(body.message ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  if (!message || message.length > 500) {
    return NextResponse.json(
      { error: "Écrivez une question (500 caractères maximum)." },
      { status: 400 }
    );
  }

  const trips = await getDestinations();
  return NextResponse.json(answerChat(message, trips));
}
