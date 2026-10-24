import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, attending, count, notes } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  // TODO: save the RSVP here (email, Google Sheet, database)
  console.log({ name, attending, count, notes });

  return NextResponse.json({ ok: true });
}