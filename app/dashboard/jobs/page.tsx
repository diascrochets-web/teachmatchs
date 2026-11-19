import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function SchoolJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: school }, { data: jobs, error }, { created }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("school_profiles").select("school_name, verification_status").eq("id", userId).maybeSingle(),
    supabase.from("jobs").select("id, title, subject, city, state, status, created_at").eq("school_id", userId).order("created_at", { ascending: false }),
    searchParams,
  ]);

  if (profile?.role !== "school" || !school) redirect("/dashboard");
  const successMessage = created === "published"
    ? "Your teaching role is live and visible to teachers."
    : created === "draft"
      ? "Your job draft is saved. It can be published after your school is verified."
      : undefined;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"></span><span>Teach<span className="brand-accent">Matchs</span></span></Link>
        <nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link></nav>
      </header>
      <section className="job-editor job-listing-page">
        <p className="eyebrow">Hiring at {school.school_name}</p>
        <div className="job-listing-heading"><div><h1>Your teaching roles.</h1><p className="job-editor-intro">Manage the openings your school has shared with teachers.</p></div><Link className="button button-primary" href="/dashboard/jobs/new">Post a job <span>→</span></Link></div>
        {successMessage && <p className="form-success" role="status">{successMessage}</p>}
        {!school.verification_status || school.verification_status !== "approved" ? <p className="form-notice">School verification is pending. New roles are saved as drafts and will be ready to publish after approval.</p> : null}
        {error && <p className="form-error" role="alert">We couldn&apos;t load your roles. Refresh the page to try again.</p>}
        {jobs?.length ? <div className="school-job-list">{jobs.map((job) => <article className="school-job-row" key={job.id}><div><h2>{job.title}</h2><p>{job.subject} · {job.city}, {job.state}</p></div><span className={`job-status status-${job.status}`}>{job.status === "published" ? "Live" : job.status}</span></article>)}</div> : !error ? <div className="jobs-empty-card"><span className="empty-icon">✳</span><h2>Your next teacher starts here.</h2><p>Post your first role so teachers can find out about your school.</p><Link className="underlined-link" href="/dashboard/jobs/new">Create a teaching role <span>→</span></Link></div> : null}
      </section>
    </main>
  );
}
