import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Alert = { id: string; teacher_id: string; keywords: string; location: string; frequency: "daily" | "weekly"; last_sent_at: string | null };
type Job = { id: string; title: string; subject: string; city: string; state: string; created_at: string; school_profiles: { school_name: string } | { school_name: string }[] };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function POST(request: Request) {
  const cronSecret = process.env.JOB_ALERTS_CRON_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teachmatchs.com";
  const authorization = request.headers.get("authorization");
  if (!cronSecret || !resendKey || !from) return NextResponse.json({ error: "Job alert delivery is not configured." }, { status: 503 });
  if (authorization !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase service credentials are not configured." }, { status: 503 });

  const [{ data: alerts, error: alertError }, { data: jobs, error: jobError }] = await Promise.all([
    supabase.from("job_alerts").select("id, teacher_id, keywords, location, frequency, last_sent_at").eq("is_active", true),
    supabase.from("jobs").select("id, title, subject, city, state, created_at, school_profiles!inner(school_name)").eq("status", "published").order("created_at", { ascending: false }).limit(500),
  ]);
  if (alertError || jobError) return NextResponse.json({ error: "Could not load alert data." }, { status: 500 });
  const activeAlerts = (alerts ?? []) as Alert[];
  const jobRows = (jobs ?? []) as unknown as Job[];
  const teacherIds = [...new Set(activeAlerts.map((alert) => alert.teacher_id))];
  const { data: profiles, error: profileError } = teacherIds.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", teacherIds)
    : { data: [], error: null };
  if (profileError) return NextResponse.json({ error: "Could not load teacher accounts." }, { status: 500 });
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  let sent = 0;
  let skipped = 0;

  for (const alert of activeAlerts) {
    const recipient = profileById.get(alert.teacher_id);
    if (!recipient?.email) { skipped += 1; continue; }
    const intervalMs = alert.frequency === "daily" ? 86_400_000 : 7 * 86_400_000;
    const now = Date.now();
    const lastSentAt = alert.last_sent_at ? new Date(alert.last_sent_at).getTime() : null;
    if (lastSentAt !== null && now - lastSentAt < intervalMs) { skipped += 1; continue; }
    const cutoff = lastSentAt ?? now - intervalMs;
    const terms = alert.keywords.toLowerCase().split(/\s+/).filter(Boolean);
    const place = alert.location.trim().toLowerCase();
    const matches = jobRows.filter((job) => new Date(job.created_at).getTime() > cutoff
      && terms.some((term) => `${job.title} ${job.subject}`.toLowerCase().includes(term))
      && (!place || `${job.city} ${job.state}`.toLowerCase().includes(place)))
      .slice(0, 10);
    if (!matches.length) { skipped += 1; continue; }

    const results = matches.map((job) => {
      const school = Array.isArray(job.school_profiles) ? job.school_profiles[0]?.school_name : job.school_profiles.school_name;
      return `<li style="margin:0 0 16px"><a href="${siteUrl}/jobs/${job.id}"><strong>${escapeHtml(job.title)}</strong></a><br>${escapeHtml(job.subject)} · ${escapeHtml(job.city)}, ${escapeHtml(job.state)} · ${escapeHtml(school ?? "TeachMatchs school")}</li>`;
    }).join("");
    const query = new URLSearchParams({ q: alert.keywords, ...(alert.location ? { location: alert.location } : {}) });
    const unsubscribe = `${siteUrl}/dashboard/alerts`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [recipient.email],
        subject: `New teaching jobs for ${alert.keywords}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172436"><p>Hello ${escapeHtml(recipient.full_name ?? "teacher")},</p><h1 style="font-size:24px">New teaching jobs for ${escapeHtml(alert.keywords)}</h1><p>${matches.length} new match${matches.length === 1 ? "" : "es"}${alert.location ? ` near ${escapeHtml(alert.location)}` : ""}:</p><ul>${results}</ul><p><a href="${siteUrl}/jobs?${query}">See matching jobs on TeachMatchs</a></p><hr><p style="font-size:12px;color:#657080">Manage or remove this alert in <a href="${unsubscribe}">your job alert settings</a>.</p></div>`,
      }),
    });
    if (!response.ok) { skipped += 1; continue; }
    await supabase.from("job_alerts").update({ last_sent_at: new Date().toISOString() }).eq("id", alert.id);
    sent += 1;
  }

  return NextResponse.json({ sent, skipped });
}
