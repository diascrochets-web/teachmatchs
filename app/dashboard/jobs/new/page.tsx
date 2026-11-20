import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { redirect } from "next/navigation";
import { createJob } from "@/app/jobs/actions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const messages: Record<string, string> = {
  configuration: "Connect Supabase before creating a job.",
  details: "Check the required fields, salary range, and description, then try again.",
  save: "We couldn't save this job. Please try again in a moment.",
};

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: school }, { error }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("school_profiles").select("school_name, verification_status").eq("id", userId).maybeSingle(),
    searchParams,
  ]);

  if (profile?.role !== "school" || !school) redirect("/dashboard");
  const isApproved = school.verification_status === "approved";
  const errorMessage = error ? messages[error] : undefined;

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link>
        <nav className="dashboard-nav"><Link href="/dashboard/jobs">Your jobs</Link><Link href="/dashboard">Dashboard</Link></nav>
      </header>
      <section className="job-editor">
        <Link className="back-link" href="/dashboard/jobs">← Back to your jobs</Link>
        <p className="eyebrow">Hiring at {school.school_name}</p>
        <h1>Share a teaching role.</h1>
        <p className="job-editor-intro">Give teachers the details they need to decide if this school and role are right for them.</p>

        {!isApproved && <p className="form-notice">Your school is still being verified. You can prepare this listing now; it will stay as a draft until your school is approved.</p>}
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

        <form action={createJob} className="job-form">
          <div className="form-field"><label htmlFor="title">Job title</label><input id="title" name="title" minLength={4} maxLength={120} placeholder="e.g. Mathematics Teacher" required /></div>
          <div className="job-form-row">
            <div className="form-field"><label htmlFor="subject">Subject</label><input id="subject" name="subject" maxLength={80} placeholder="e.g. Mathematics" required /></div>
            <div className="form-field"><label htmlFor="school_level">School level</label><select id="school_level" name="school_level" defaultValue="" required><option value="" disabled>Choose a level</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="both">Primary and secondary</option></select></div>
          </div>
          <div className="job-form-row">
            <div className="form-field"><label htmlFor="employment_type">Employment type</label><select id="employment_type" name="employment_type" defaultValue="full-time"><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option></select></div>
            <div className="form-field"><label htmlFor="application_deadline">Application deadline <span>(optional)</span></label><input id="application_deadline" name="application_deadline" type="date" /></div>
          </div>
          <div className="job-form-row">
            <div className="form-field"><label htmlFor="city">City</label><input id="city" name="city" maxLength={80} placeholder="e.g. Ikeja" required /></div>
            <div className="form-field"><label htmlFor="state">State</label><input id="state" name="state" maxLength={80} placeholder="e.g. Lagos" required /></div>
          </div>
          <fieldset className="salary-fieldset">
            <legend>Monthly salary in naira <span>(optional)</span></legend>
            <div className="job-form-row">
              <div className="form-field"><label htmlFor="salary_min">From</label><input id="salary_min" name="salary_min" type="number" min="0" step="1000" placeholder="150000" /></div>
              <div className="form-field"><label htmlFor="salary_max">To</label><input id="salary_max" name="salary_max" type="number" min="0" step="1000" placeholder="220000" /></div>
            </div>
          </fieldset>
          <div className="form-field"><label htmlFor="description">About the role</label><textarea id="description" name="description" minLength={30} maxLength={5000} rows={6} placeholder="What will the teacher do day to day? Include the classes, timetable, and anything that makes the role special." required /></div>
          <div className="form-field"><label htmlFor="requirements">What you’re looking for <span>(optional)</span></label><textarea id="requirements" name="requirements" maxLength={3000} rows={4} placeholder="Qualifications, experience, or teaching approach you value." /></div>
          <button className="button button-primary job-submit" type="submit">{isApproved ? "Publish teaching role" : "Save job draft"}<span aria-hidden="true">→</span></button>
          <p className="form-terms">By posting, you confirm this role is open at {school.school_name}.</p>
        </form>
      </section>
    </main>
  );
}
