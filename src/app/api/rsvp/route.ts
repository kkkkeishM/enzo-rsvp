import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const attending = body.attending === "yes" ? "yes" : body.attending === "no" ? "no" : null;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : "";
  if (!name || !attending) {
    return NextResponse.json({ error: "Name and answer required" }, { status: 400 });
  }
  const guests =
    attending === "yes" ? Math.min(Math.max(Math.round(Number(body.count)) || 1, 1), 10) : 0;

  // same name again = update the earlier reply instead of adding a duplicate
  const nameKey = name.toLowerCase().replace(/\s+/g, " ");

  try {
    const { error } = await getSupabase()
      .from("rsvps")
      .upsert(
        { name, name_key: nameKey, attending: attending === "yes", guests, notes, updated_at: new Date().toISOString() },
        { onConflict: "name_key" }
      );
    if (error) throw error;
  } catch (e) {
    console.error("RSVP save failed:", e);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}