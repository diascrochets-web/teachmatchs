import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { removeSavedJob } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

type SavedJob = { job_id: string; jobs: { id: string; title: string; subject: string; city: string; state: string; employment_type: string; school_profiles: { school_name: string } | { school_name: string }[] } | { id: string; title: string; subject: string; city: string; state: string; employment_type: string; school_profiles: { school_name: string } | { school_name: string }[] }[] };

export default async function SavedJobsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("saved_jobs").select("job_id, jobs!inner(id, title, subject, city, state, employment_type, school_profiles!inner(school_name))").eq("teacher_id", userId).order("created_at", { ascending: false }),
  ]);
  if (profile?.role !== "teacher") redirect("/dashboard");
  const saved = (data ?? []) as unknown as SavedJob[];
  return <main className="dashboard-shell feature-page">
    <header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link><Link href="/dashboard/alerts">Job alerts</Link></nav></header>
    <section className="feature-heading"><p className="eyebrow">Your job search</p><h1>Saved jobs</h1><p>Pick up where you left off and apply when you’re ready.</p></section>
    {saved.length ? <div className="feature-list">{saved.map((item) => { const job = Array.isArray(item.jobs) ? item.jobs[0] : item.jobs; if (!job) return null; const school = Array.isArray(job.school_profiles) ? job.school_profiles[0]?.school_name : job.school_profiles.school_name; return <article className="feature-card feature-row" key={job.id}><div><p className="eyebrow">{school}</p><h2><Link href={`/jobs/${job.id}`}>{job.title}</Link></h2><p>{job.subject} · {job.city}, {job.state} · {job.employment_type}</p></div><div className="feature-actions"><Link className="button button-primary" href={`/jobs/${job.id}`}>View job</Link><form action={removeSavedJob}><input type="hidden" name="job_id" value={job.id} /><button className="text-link" type="submit">Remove</button></form></div></article>; })}</div> : <section className="feature-card"><h2>No saved jobs yet</h2><p>Save a role from its job page and it will appear here.</p><Link className="button button-primary" href="/jobs">Browse teaching jobs</Link></section>}
  </main>;
}
