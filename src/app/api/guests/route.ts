import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabase } from "@/lib/supabase";

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
      .select("id,name,attending,guests,notes,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const guests = (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      attending: r.attending ? "yes" : "no",
      count: r.guests as number,
      notes: r.notes as string,
      at: r.updated_at as string,
    }));
    return NextResponse.json({ guests });
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