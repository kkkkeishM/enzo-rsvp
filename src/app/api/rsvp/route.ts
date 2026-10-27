import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { MAX_NAME_LENGTH } from "@/lib/limits";

function names(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH) : ""));
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Bad request");
  }

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH) : "";
  const attending = body.attending === "yes" ? "yes" : body.attending === "no" ? "no" : null;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : "";
  const code = typeof body.code === "string" && body.code.trim() ? body.code.trim().slice(0, 64) : null;

  if (!name || !attending) return bad("Name and answer required");
  if (!code && process.env.REQUIRE_INVITE_CODE === "true") {
    return bad("Please open the invitation using the personal link you were sent.", 403);
  }

  let adults: string[] = [];
  let kids: string[] = [];
  if (attending === "yes") {
    if (body.bringAdult === true) {
      adults = names(body.adults);
      if (adults.length === 0 || adults.some((n) => !n)) return bad("Please enter the full name of each adult guest.");
    }
    if (body.bringKids === true) {
      kids = names(body.kids);
      if (kids.length === 0 || kids.some((n) => !n)) return bad("Please enter the full name of each child.");
    }
    if (adults.length > 10 || kids.length > 10) return bad("Too many guests.");
  }

  try {
    // all limit checks (allowance + 80 total) happen inside one locked database transaction
    const { data, error } = await getSupabase().rpc("submit_rsvp", {
      p_name: name,
      p_attending: attending === "yes",
      p_adults: adults,
      p_kids: kids,
      p_notes: notes,
      p_code: code,
    });
    if (error) throw error;

    if (!data?.ok) {
      const status = data?.code === "full" ? 409 : data?.code === "invalid_invite" ? 404 : data?.code === "over_allowance" ? 422 : 400;
      return NextResponse.json({ error: data?.message ?? "Could not save", code: data?.code, remaining: data?.remaining }, { status });
    }
    return NextResponse.json({ ok: true, party: data.party });
  } catch (e) {
    console.error("RSVP save failed:", e);
    return bad("Could not save", 500);
  }
}