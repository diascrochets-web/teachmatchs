import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { scheduleInterview } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function InterviewsPage({ searchParams }: { searchParams: Promise<{ application?: string; created?: string; error?: string }> }) {
  const [{ application: selectedId, created, error }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!profile) redirect("/dashboard");
  let applications: { id: string; job_id: string; teacher_id: string }[] = [];
  if (profile.role === "teacher") {
    const { data } = await supabase.from("applications").select("id, job_id, teacher_id").eq("teacher_id", userId).order("created_at", { ascending: false });
    applications = data ?? [];
  } else {
    const { data: jobs } = await supabase.from("jobs").select("id").eq("school_id", userId);
    const { data } = jobs?.length ? await supabase.from("applications").select("id, job_id, teacher_id").in("job_id", jobs.map((job) => job.id)).order("created_at", { ascending: false }) : { data: [] };
    applications = data ?? [];
  }
  const appIds = applications.map((app) => app.id);
  const [{ data: interviews }, { data: jobs }] = appIds.length ? await Promise.all([
    supabase.from("interviews").select("id, application_id, scheduled_at, duration_minutes, meeting_url, notes, status").in("application_id", appIds).order("scheduled_at", { ascending: true }),
    supabase.from("jobs").select("id, title").in("id", [...new Set(applications.map((app) => app.job_id))]),
  ]) : [{ data: [] }, { data: [] }];
  const jobNames = new Map((jobs ?? []).map((job) => [job.id, job.title]));
  const chosen = applications.find((app) => app.id === selectedId) ?? applications[0];
  return <main className="dashboard-shell feature-page">
    <header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link><Link href="/dashboard/applications">Applications</Link></nav></header>
    <section className="feature-heading"><p className="eyebrow">Meet on video</p><h1>Interviews</h1><p>Schedule a meeting using a Zoom, Google Meet, Teams or other secure video link.</p></section>
    {created && <p className="form-success" role="status">The interview is scheduled and the other person has an in-site notification.</p>}{error && <p className="form-error" role="alert">We couldn’t save the interview. Check the date and secure meeting link.</p>}
    {interviews?.length ? <section className="feature-list"><h2>Upcoming and past interviews</h2>{interviews.map((interview) => <article className="feature-card feature-row" key={interview.id}><div><p className="eyebrow">{jobNames.get(applications.find((app) => app.id === interview.application_id)?.job_id ?? "") ?? "Teaching role"}</p><h3>{new Date(interview.scheduled_at).toLocaleString("en-NG")} · {interview.duration_minutes} minutes</h3><p>{interview.status}{interview.notes ? ` · ${interview.notes}` : ""}</p></div><a className="button button-primary" href={interview.meeting_url} target="_blank" rel="noreferrer">Join meeting</a></article>)}</section> : null}
    {chosen ? <section className="feature-card"><h2>Schedule an interview</h2><p>For: {jobNames.get(chosen.job_id) ?? "Teaching role"}</p><form action={scheduleInterview} className="feature-form"><input type="hidden" name="application_id" value={chosen.id} /><label className="form-field"><span>Date and time</span><input name="scheduled_at" type="datetime-local" required /></label><label className="form-field"><span>Video meeting link</span><input name="meeting_url" type="url" placeholder="https://meet.google.com/..." required /></label><label className="form-field"><span>Notes (optional)</span><textarea name="notes" rows={3} maxLength={1000} placeholder="Anything the teacher should prepare" /></label><button className="button button-primary" type="submit">Schedule interview</button></form></section> : <section className="feature-card"><h2>No applications to schedule yet</h2><p>Interview scheduling becomes available once a teacher has applied.</p><Link className="button button-primary" href={profile.role === "school" ? "/dashboard/jobs" : "/jobs"}>Continue</Link></section>}
  </main>;
}
