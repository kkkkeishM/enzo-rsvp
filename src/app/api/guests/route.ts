import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabase } from "@/lib/supabase";
import { MAX_ATTENDANCE } from "@/lib/limits";

function authorized(pw: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof pw !== "string") return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (!authorized(password)) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

  try {
    const { data, error } = await getSupabase()
      .from("rsvps")
      .select("id,name,attending,guests,notes,updated_at,adults,kids,invite_code,relation,admin_note")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const guests = (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      attending: r.attending ? "yes" : "no",
      count: r.guests as number,
      notes: r.notes as string,
      at: r.updated_at as string,
      adults: (r.adults ?? []) as string[],
      kids: (r.kids ?? []) as string[],
      invite: (r.invite_code ?? null) as string | null,
      relation: (r.relation ?? null) as "family" | "friend" | null,
      adminNote: (r.admin_note ?? "") as string,
    }));
    return NextResponse.json({ guests, capacity: MAX_ATTENDANCE });
  } catch (e) {
    console.error("Guest list failed:", e);
    return NextResponse.json({ error: "Could not load" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { password, id } = await req.json().catch(() => ({}));
  if (!authorized(password) || typeof id !== "string") {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const { error } = await getSupabase().from("rsvps").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { password, id, relation, adminNote } = await req.json().catch(() => ({}));
  if (!authorized(password) || typeof id !== "string") {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const update: Record<string, unknown> = {};
  if (relation !== undefined) {
    if (relation !== null && relation !== "" && relation !== "family" && relation !== "friend") {
      return NextResponse.json({ error: "Bad type" }, { status: 400 });
    }
    update.relation = relation === "family" || relation === "friend" ? relation : null;
  }
  if (adminNote !== undefined) {
    if (typeof adminNote !== "string") return NextResponse.json({ error: "Bad note" }, { status: 400 });
    update.admin_note = adminNote.trim().slice(0, 300);
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await getSupabase().from("rsvps").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}