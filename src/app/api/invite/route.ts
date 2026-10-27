import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { DEFAULT_LIMITS, MAX_ATTENDANCE, type InviteInfo } from "@/lib/limits";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim().slice(0, 64) || null;

  if (!code && process.env.REQUIRE_INVITE_CODE === "true") {
    return NextResponse.json({ error: "Please open the invitation using the personal link you were sent." }, { status: 403 });
  }

  try {
    const db = getSupabase();
    let info: Omit<InviteInfo, "full"> = { label: null, type: "friend", ...DEFAULT_LIMITS };

    if (code) {
      const { data, error } = await db
        .from("invites")
        .select("label,type,max_guests,max_adults,max_kids")
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: "This invitation link was not recognized. Please use the link you were sent." }, { status: 404 });
      }
      info = {
        label: data.label,
        type: data.type,
        maxGuests: data.max_guests,
        maxAdults: data.max_adults,
        maxKids: data.max_kids,
      };
    }

    const { data: rows, error: e2 } = await db.from("rsvps").select("guests").eq("attending", true);
    if (e2) throw e2;
    const total = (rows ?? []).reduce((sum, r) => sum + (r.guests as number), 0);

    return NextResponse.json({ ...info, full: total >= MAX_ATTENDANCE });
  } catch (e) {
    console.error("Invite lookup failed:", e);
    return NextResponse.json({ error: "Could not load your invitation." }, { status: 500 });
  }
}