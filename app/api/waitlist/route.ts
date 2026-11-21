import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncWaitlistContact } from "@/lib/resend/waitlist";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let payload: { email?: unknown; website?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (typeof payload.website === "string" && payload.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (email.length > 254 || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "The waitlist is temporarily unavailable." }, { status: 503 });
  }

  const { error } = await supabase.from("launch_waitlist").insert({ email });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "We couldn’t save your email. Please try again." }, { status: 500 });
  }

  if (await syncWaitlistContact(email) === "synced") {
    await supabase
      .from("launch_waitlist")
      .update({ resend_synced_at: new Date().toISOString() })
      .eq("email", email);
  }

  return NextResponse.json({ ok: true }, { status: error ? 200 : 201 });
}
