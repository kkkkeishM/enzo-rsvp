import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabase } from "@/lib/supabase";

const MAX_AUTHOR = 60; // keep this the same as MAX_AUTHOR in the admin page

function authorized(pw: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof pw !== "string") return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
const deny = () => NextResponse.json({ error: "Not allowed" }, { status: 401 });

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (!authorized(password)) return deny();
  const { data, error } = await getSupabase()
    .from("wishes")
    .select("id,author,message,approved,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load" }, { status: 500 });
  return NextResponse.json({ wishes: data ?? [] });
}

// show / hide a wish, and/or rename who it is from
export async function PATCH(req: Request) {
  const { password, id, approved, author } = await req.json().catch(() => ({}));
  if (!authorized(password) || typeof id !== "string") return deny();

  const update: Record<string, unknown> = {};

  if (approved !== undefined) {
    if (typeof approved !== "boolean") return NextResponse.json({ error: "Bad value" }, { status: 400 });
    update.approved = approved;
  }

  if (author !== undefined) {
    if (typeof author !== "string") return NextResponse.json({ error: "Bad name" }, { status: 400 });
    const a = author.trim().replace(/\s+/g, " ").slice(0, MAX_AUTHOR);
    if (!a) return NextResponse.json({ error: "Name required" }, { status: 400 });
    update.author = a;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await getSupabase().from("wishes").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { password, id } = await req.json().catch(() => ({}));
  if (!authorized(password) || typeof id !== "string") return deny();
  const { error } = await getSupabase().from("wishes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}


