import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabase } from "@/lib/supabase";
import { MAX_ATTENDANCE, MAX_NAME_LENGTH } from "@/lib/limits";

const COLUMNS = "id,name,attending,guests,notes,updated_at,adults,kids,invite_code,relation,admin_note,sponsor,side,present,missing,missing_note";
const LOCK_KEY = "guests_locked";
const LINKS_KEY = "required_links";

function safeEqual(input: unknown, expected: string | undefined) {
  if (!expected || typeof input !== "string") return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const authorized = (pw: unknown) => safeEqual(pw, process.env.ADMIN_PASSWORD);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGuest(r: Record<string, any>) {
  return {
    id: r.id as string,
    name: r.name as string,
    attending: r.attending ? "yes" : "no",
    count: r.guests as number,
    notes: (r.notes ?? "") as string,
    at: r.updated_at as string,
    adults: (r.adults ?? []) as string[],
    kids: (r.kids ?? []) as string[],
    invite: (r.invite_code ?? null) as string | null,
    relation: (r.relation ?? null) as "family" | "friend" | null,
    adminNote: (r.admin_note ?? "") as string,
    sponsor: (r.sponsor ?? null) as "ninang" | "ninong" | null,
    side: (r.side ?? null) as "eman" | "gwen" | null,
    present: !!r.present,
    missing: (r.missing ?? 0) as number,
    missingNote: (r.missing_note ?? "") as string,
  };
}

async function isLocked() {
  const { data, error } = await getSupabase().from("app_settings").select("value").eq("key", LOCK_KEY).maybeSingle();
  if (error) {
    console.error("Lock read failed (did you run lock-setup.sql?):", error);
    return false;
  }
  return data?.value === "true";
}

async function setLocked(on: boolean) {
  const { error } = await getSupabase().from("app_settings").upsert({ key: LOCK_KEY, value: on ? "true" : "false" });
  if (error) console.error("Lock write failed:", error);
  return !error;
}

// The unlock password lives in the database so it is the same on every server
// (local, Vercel, previews). UNLOCK_PASSWORD is only a fallback if nothing is stored there.
async function getUnlockPassword(): Promise<string | undefined> {
  const { data, error } = await getSupabase().from("app_settings").select("value").eq("key", "unlock_password").maybeSingle();
  if (error) console.error("Unlock password read failed:", error);
  const stored = typeof data?.value === "string" ? data.value : "";
  return stored || process.env.UNLOCK_PASSWORD || undefined;
}

// which reply belongs to each required Ninang / Ninong (shared by every server and device)
async function getLinks(): Promise<Record<string, string>> {
  const { data, error } = await getSupabase().from("app_settings").select("value").eq("key", LINKS_KEY).maybeSingle();
  if (error) {
    console.error("Links read failed:", error);
    return {};
  }
  try {
    const parsed = JSON.parse(typeof data?.value === "string" ? data.value : "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

const lockedReply = () => NextResponse.json({ error: "Locked", locked: true }, { status: 423 });

const cleanName = (x: unknown) =>
  typeof x === "string" ? x.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH) : "";
const cleanNames = (v: unknown) =>
  (Array.isArray(v) ? v : []).map(cleanName).filter(Boolean).slice(0, 98);

// load the list, or lock / unlock it
export async function POST(req: Request) {
  const { password, action, unlockPassword, requiredName, guestId } = await req.json().catch(() => ({}));
  if (!authorized(password)) return NextResponse.json({ error: "Wrong password" }, { status: 401 });

  if (action === "lock") {
    if (!(await setLocked(true))) return NextResponse.json({ error: "Could not lock" }, { status: 500 });
    return NextResponse.json({ ok: true, locked: true });
  }

  if (action === "unlock") {
    // a separate password that only the admin knows
    const expected = await getUnlockPassword();
    if (!expected) {
      return NextResponse.json(
        { error: "No unlock password is set yet. The admin needs to add one (see unlock-password.sql)." },
        { status: 500 }
      );
    }
    if (!safeEqual(unlockPassword, expected)) {
      return NextResponse.json({ error: "Wrong unlock password" }, { status: 403 });
    }
    if (!(await setLocked(false))) return NextResponse.json({ error: "Could not unlock" }, { status: 500 });
    return NextResponse.json({ ok: true, locked: false });
  }

  if (action === "set_link") {
    if (await isLocked()) return lockedReply();
    const key = cleanName(requiredName);
    if (!key) return NextResponse.json({ error: "Bad name" }, { status: 400 });
    if (guestId !== null && guestId !== undefined && typeof guestId !== "string") {
      return NextResponse.json({ error: "Bad reply" }, { status: 400 });
    }
    if (guestId) {
      const { data: found } = await getSupabase().from("rsvps").select("id").eq("id", guestId).maybeSingle();
      if (!found) return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }
    const links = await getLinks();
    if (guestId) links[key] = guestId;
    else delete links[key];
    if (Object.keys(links).length > 200) return NextResponse.json({ error: "Too many links" }, { status: 400 });
    const { error } = await getSupabase().from("app_settings").upsert({ key: LINKS_KEY, value: JSON.stringify(links) });
    if (error) {
      console.error("Links write failed:", error);
      return NextResponse.json({ error: "Could not save the link" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, links });
  }

  try {
    const { data, error } = await getSupabase().from("rsvps").select(COLUMNS).order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      guests: (data ?? []).map(toGuest),
      capacity: MAX_ATTENDANCE,
      locked: await isLocked(),
      requiredLinks: await getLinks(),
    });
  } catch (e) {
    console.error("Guest list failed:", e);
    return NextResponse.json({ error: "Could not load" }, { status: 500 });
  }
}

// add a guest by hand
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!authorized(body.password)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  if (await isLocked()) return lockedReply();

  const name = cleanName(body.name);
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const going = body.attending === "yes";
  const adults = going ? cleanNames(body.adults) : [];
  const kids = going ? cleanNames(body.kids) : [];

  let guests = 0;
  if (going) {
    const n = Number(body.count);
    if (!Number.isInteger(n) || n < 1 || n > 99) {
      return NextResponse.json({ error: "Total must be 1 to 99" }, { status: 400 });
    }
    const named = 1 + adults.length + kids.length;
    if (n < named) {
      return NextResponse.json({ error: `Total can’t be lower than ${named}` }, { status: 400 });
    }
    guests = n;
  }

  const { relation, sponsor, side } = body;
  if (relation !== undefined && relation !== null && relation !== "" && relation !== "family" && relation !== "friend") {
    return NextResponse.json({ error: "Bad type" }, { status: 400 });
  }
  if (sponsor !== undefined && sponsor !== null && sponsor !== "" && sponsor !== "ninang" && sponsor !== "ninong") {
    return NextResponse.json({ error: "Bad sponsor" }, { status: 400 });
  }
  if (side !== undefined && side !== null && side !== "" && side !== "eman" && side !== "gwen") {
    return NextResponse.json({ error: "Bad side" }, { status: 400 });
  }

  const row = {
    name,
    // same formula submit_rsvp uses for guests without an invite code
    name_key: name.toLowerCase().replace(/\s+/g, " "),
    attending: going,
    guests,
    notes: "",
    adults,
    kids,
    relation: relation === "family" || relation === "friend" ? relation : null,
    sponsor: sponsor === "ninang" || sponsor === "ninong" ? sponsor : null,
    side: side === "eman" || side === "gwen" ? side : null,
    admin_note: typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 300) : "",
  };

  const { data, error } = await getSupabase().from("rsvps").insert(row).select(COLUMNS).single();
  if (error) {
    console.error("Manual add failed:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "A reply with that name already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Could not add the guest", detail: `${error.code ?? "?"}: ${error.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, guest: toGuest(data) });
}

export async function DELETE(req: Request) {
  const { password, id } = await req.json().catch(() => ({}));
  if (!authorized(password) || typeof id !== "string") {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  if (await isLocked()) return lockedReply();
  const { error } = await getSupabase().from("rsvps").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { password, id, name, relation, adminNote, sponsor, count, adults, side, present, missing, missingNote } =
    await req.json().catch(() => ({}));
  if (!authorized(password) || typeof id !== "string") {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  // day-of changes (check-in and who is missing) still work while the list is locked;
  // every other edit does not
  const onlyDayOf =
    (present !== undefined || missing !== undefined || missingNote !== undefined) &&
    [name, relation, adminNote, sponsor, count, adults, side].every((v) => v === undefined);
  if (!onlyDayOf && (await isLocked())) return lockedReply();

  const update: Record<string, unknown> = {};

  // rename the guest who answered
  if (name !== undefined) {
    const newName = cleanName(name);
    if (!newName) return NextResponse.json({ error: "Name can’t be empty" }, { status: 400 });
    const { data: nr, error: nrError } = await getSupabase().from("rsvps").select("invite_code").eq("id", id).single();
    if (nrError || !nr) return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    update.name = newName;
    // guests without an invite code are matched by this key, so keep it in step with the name
    if (!nr.invite_code) update.name_key = newName.toLowerCase().replace(/\s+/g, " ");
  }

  if (present !== undefined) {
    if (typeof present !== "boolean") return NextResponse.json({ error: "Bad value" }, { status: 400 });
    update.present = present;
    // un-checking someone clears their "missing" details
    if (!present) {
      update.missing = 0;
      update.missing_note = "";
    }
  }

  // how many of a checked-in group are not with them, and who
  if (missing !== undefined || missingNote !== undefined) {
    let m: number | null = null;
    if (missing !== undefined) {
      m = Number(missing);
      if (!Number.isInteger(m) || m < 0 || m > 98) {
        return NextResponse.json({ error: "Bad number" }, { status: 400 });
      }
    }
    let mn: string | null = null;
    if (missingNote !== undefined) {
      if (typeof missingNote !== "string") return NextResponse.json({ error: "Bad note" }, { status: 400 });
      mn = missingNote.trim().slice(0, 300);
    }

    const { data: pr, error: prError } = await getSupabase()
      .from("rsvps")
      .select("attending,present,guests")
      .eq("id", id)
      .single();
    if (prError || !pr) return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    const isPresent = present !== undefined ? present : !!pr.present;
    if (!pr.attending || !isPresent) {
      return NextResponse.json({ error: "Check the guest in first" }, { status: 400 });
    }
    const most = (pr.guests as number) - 1;
    if (m !== null && m > most) {
      return NextResponse.json({ error: `At most ${most} can be missing` }, { status: 400 });
    }
    if (m !== null) update.missing = m;
    if (m === 0) update.missing_note = "";
    else if (mn !== null) update.missing_note = mn;
  }

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
  if (sponsor !== undefined) {
    if (sponsor !== null && sponsor !== "" && sponsor !== "ninang" && sponsor !== "ninong") {
      return NextResponse.json({ error: "Bad sponsor" }, { status: 400 });
    }
    update.sponsor = sponsor === "ninang" || sponsor === "ninong" ? sponsor : null;
  }
  if (side !== undefined) {
    if (side !== null && side !== "" && side !== "eman" && side !== "gwen") {
      return NextResponse.json({ error: "Bad side" }, { status: 400 });
    }
    update.side = side === "eman" || side === "gwen" ? side : null;
  }

  // manual total and/or adult names: both live on the same row and must agree
  if (count !== undefined || adults !== undefined) {
    let n: number | null = null;
    if (count !== undefined) {
      n = Number(count);
      if (!Number.isInteger(n) || n < 1 || n > 99) {
        return NextResponse.json({ error: "Bad total" }, { status: 400 });
      }
    }

    let newAdults: string[] | null = null;
    if (adults !== undefined) {
      if (!Array.isArray(adults) || adults.length > 98) {
        return NextResponse.json({ error: "Bad adult names" }, { status: 400 });
      }
      newAdults = cleanNames(adults);
    }

    const { data: row, error: readError } = await getSupabase()
      .from("rsvps")
      .select("attending,adults,kids,guests")
      .eq("id", id)
      .single();
    if (readError || !row) return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    if (!row.attending) return NextResponse.json({ error: "That guest isn’t coming" }, { status: 400 });

    const finalAdults = newAdults ?? ((row.adults ?? []) as string[]);
    const kidCount = ((row.kids ?? []) as string[]).length;
    const finalTotal = n ?? (row.guests as number);
    const named = 1 + finalAdults.length + kidCount;
    if (finalTotal < named) {
      return NextResponse.json({ error: `Total must be at least ${named} for the names listed` }, { status: 400 });
    }

    if (n !== null) update.guests = n;
    if (newAdults !== null) update.adults = newAdults;
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await getSupabase().from("rsvps").update(update).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A reply with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}