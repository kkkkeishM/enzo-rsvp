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

export async function PATCH(req: Request) {
  const { password, id, approved } = await req.json().catch(() => ({}));
  if (!authorized(password) || typeof id !== "string" || typeof approved !== "boolean") return deny();
  const { error } = await getSupabase().from("wishes").update({ approved }).eq("id", id);
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