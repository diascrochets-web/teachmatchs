import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { createJobAlert, deleteJobAlert } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function JobAlertsPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profile }, { data: alerts }, { created, error }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("job_alerts").select("id, keywords, location, frequency, is_active, created_at").eq("teacher_id", userId).order("created_at", { ascending: false }),
    searchParams,
  ]);
  if (profile?.role !== "teacher") redirect("/dashboard");
  const activeAlerts = alerts ?? [];
  const { data: jobs } = activeAlerts.length ? await supabase.from("jobs").select("id, title, subject, city, state, school_level, created_at").eq("status", "published").order("created_at", { ascending: false }).limit(100) : { data: [] };
  return <main className="dashboard-shell feature-page">
    <header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link><Link href="/dashboard/saved-jobs">Saved jobs</Link></nav></header>
    <section className="feature-heading"><p className="eyebrow">Stay in the loop</p><h1>Job alerts</h1><p>Save a subject and location to see matching new roles here.</p></section>
    {created && <p className="form-success" role="status">Your job alert is active.</p>}{error && <p className="form-error" role="alert">Please check the alert details and try again.</p>}
    <section className="feature-card"><h2>Create an alert</h2><form action={createJobAlert} className="feature-form"><label className="form-field"><span>Subject or job title</span><input name="keywords" required minLength={2} maxLength={120} placeholder="For example, Primary Mathematics" /></label><label className="form-field"><span>Location</span><input name="location" maxLength={120} placeholder="Any location or enter a city/state" /></label><label className="form-field"><span>Frequency</span><select name="frequency" defaultValue="daily"><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label><button className="button button-primary" type="submit">Save alert</button></form><small className="feature-muted">Matching jobs are shown below. Email delivery can be enabled when a sender is configured.</small></section>
    <section className="feature-list"><h2>Your alerts</h2>{activeAlerts.length ? activeAlerts.map((alert) => {
      const terms: string[] = alert.keywords.toLowerCase().split(/\s+/).filter(Boolean);
      const place = alert.location.toLowerCase();
      const matches = (jobs ?? []).filter((job) => terms.some((term) => `${job.title} ${job.subject}`.toLowerCase().includes(term)) && (!place || `${job.city} ${job.state}`.toLowerCase().includes(place))).slice(0, 4);
      return <article className="feature-card" key={alert.id}><div className="feature-row"><div><h3>{alert.keywords}{alert.location ? ` · ${alert.location}` : " · Any location"}</h3><p>{alert.frequency} · {matches.length} matching open roles</p></div><form action={deleteJobAlert}><input type="hidden" name="alert_id" value={alert.id} /><button className="text-link" type="submit">Delete alert</button></form></div>{matches.length ? <ul className="matching-job-list">{matches.map((job) => <li key={job.id}><Link href={`/jobs/${job.id}`}>{job.title}</Link><span>{job.subject} · {job.city}, {job.state}</span></li>)}</ul> : <p className="feature-muted">No matching jobs right now. Your alert stays saved.</p>}</article>;
    }) : <p className="feature-card">No alerts saved yet.</p>}</section>
  </main>;
}
