import Link from "next/link";
import { notFound } from "next/navigation";
import { applyForJob } from "@/app/jobs/actions";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type JobDetail = {
  id: string;
  title: string;
  subject: string;
  school_level: string;
  employment_type: string;
  city: string;
  state: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  requirements: string | null;
  application_deadline: string | null;
  created_at: string;
  school_profiles: { school_name: string; verification_status: string } | { school_name: string; verification_status: string }[];
};

function formatSalary(min: number | null, max: number | null) {
  const format = (amount: number) => `₦${new Intl.NumberFormat("en-NG").format(amount)}`;
  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`;
  if (min !== null) return `From ${format(min)}`;
  if (max !== null) return `Up to ${format(max)}`;
  return "Salary not listed";
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ applied?: string; error?: string }>;
}) {
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const [{ data }, { data: claims }] = await Promise.all([
    supabase.from("jobs").select("id, title, subject, school_level, employment_type, city, state, salary_min, salary_max, description, requirements, application_deadline, created_at, school_profiles!inner(school_name, verification_status)").eq("id", jobId).eq("status", "published").maybeSingle(),
    supabase.auth.getClaims(),
  ]);
  if (!data) notFound();

  const job = data as unknown as JobDetail;
  const school = Array.isArray(job.school_profiles) ? job.school_profiles[0] : job.school_profiles;
  const userId = claims?.claims?.sub;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };
  const isTeacher = profile?.role === "teacher";
  const isSignedIn = Boolean(userId);
  const errorMessage = query.error === "duplicate"
    ? "You’ve already applied for this role."
    : query.error === "details"
      ? "Please shorten your note and try again."
      : query.error
        ? "We couldn’t send your application. Please try again."
        : undefined;

  return (
    <main className="job-detail-page">
      <SiteHeader />
      <div className="job-detail-layout">
        <Link className="job-detail-back" href="/jobs">← Back to search results</Link>
        <article className="job-detail-card">
          <p className="job-detail-school">{school?.school_name ?? "A TeachMatchs school"}{school?.verification_status === "approved" && <span> · Verified school</span>}</p>
          <h1>{job.title}</h1>
          <p className="job-detail-location">{job.city}, {job.state} · {job.school_level === "both" ? "Primary & secondary" : `${job.school_level} school`}</p>
          <div className="job-tags"><span>{job.subject}</span><span>{job.school_level === "both" ? "Primary & secondary" : job.school_level}</span><span>{job.employment_type}</span></div>
          <div className="job-detail-salary"><span>MONTHLY SALARY</span><strong>{formatSalary(job.salary_min, job.salary_max)}</strong></div>
          <section className="job-detail-section"><h2>About the role</h2><p>{job.description}</p></section>
          {job.requirements && <section className="job-detail-section"><h2>What the school is looking for</h2><p>{job.requirements}</p></section>}
          {job.application_deadline && <p className="job-deadline">Apply by {new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(new Date(`${job.application_deadline}T00:00:00`))}</p>}
        </article>

        <aside className="apply-card">
          <p className="eyebrow">Your next step</p>
          <h2>Interested in this role?</h2>
          <p className="apply-intro">Send a short note to the school. Your application will be attached to your teacher account.</p>
          {query.applied ? <p className="form-success" role="status">Your application has been sent to {school?.school_name ?? "the school"}.</p> : errorMessage ? <p className="form-error" role="alert">{errorMessage}</p> : null}
          {isTeacher && !query.applied ? (
            <form action={applyForJob} className="job-form apply-form">
              <input type="hidden" name="job_id" value={job.id} />
              <div className="form-field"><label htmlFor="cover_note">A note to the school <span>(optional)</span></label><textarea id="cover_note" name="cover_note" maxLength={2000} rows={5} placeholder="Share why this role feels like a good fit." /></div>
              <button className="button button-primary job-submit" type="submit">Apply for this role</button>
              <p className="apply-help">Your note will be sent through TeachMatchs.</p>
            </form>
          ) : !isSignedIn ? (
            <div><p>Sign in as a teacher to send your application directly to the school.</p><Link className="button button-primary job-submit" href="/login">Log in to apply</Link><p className="apply-signup">New to TeachMatchs? <Link href="/register?type=teacher">Create a teacher account</Link></p></div>
          ) : !isTeacher ? <p>Teacher accounts can apply to this role. Switch to a teacher account to continue.</p> : null}
        </aside>
      </div>
    </main>
  );
}
