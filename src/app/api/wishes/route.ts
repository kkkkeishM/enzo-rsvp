import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabase } from "@/lib/supabase";

const MAX_AUTHOR = 40;
const MAX_MESSAGE = 280;
const RATE_LIMIT = 6; // wishes per 10 minutes from one network (a party venue may share one Wi-Fi)

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("wishes")
      .select("id,author,message,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const wishes = (data ?? []).map((w) => ({ id: w.id as string, author: w.author as string, message: w.message as string, at: w.created_at as string }));
    return NextResponse.json({ wishes }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("Wishes load failed:", e);
    return fail("Could not load the wishes.", 500);
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Bad request");
  }

  // hidden field only bots fill in: pretend it worked
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });

  const author = clean(body.author, MAX_AUTHOR);
  const message = clean(body.message, MAX_MESSAGE);
  if (!author) return fail("Please add your name.");
  if (!message) return fail("Please write your wish.");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip + (process.env.WISH_SALT ?? process.env.ADMIN_PASSWORD ?? "")).digest("hex").slice(0, 32);
  const needApproval = process.env.WISHES_NEED_APPROVAL === "true";

  try {
    const db = getSupabase();
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count, error: cErr } = await db
      .from("wishes")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (cErr) throw cErr;
    if ((count ?? 0) >= RATE_LIMIT) return fail("That’s a lot of wishes! Please try again in a few minutes.", 429);

    const { error } = await db.from("wishes").insert({ author, message, approved: !needApproval, ip_hash: ipHash });
    if (error) throw error;
    return NextResponse.json({ ok: true, pending: needApproval });
  } catch (e) {
    console.error("Wish save failed:", e);
    return fail("Could not save your wish.", 500);
  }
}