import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { updateApplicationStatus } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

type Application = { id: string; teacher_id: string; job_id: string; status: string; cover_note: string | null; created_at: string };

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!profile) redirect("/dashboard");
  let applications: Application[] = [];
  let jobsById = new Map<string, { title: string; school_id: string }>();
  if (profile.role === "school") {
    const { data: jobs } = await supabase.from("jobs").select("id, title, school_id").eq("school_id", userId);
    jobsById = new Map((jobs ?? []).map((job) => [job.id, { title: job.title, school_id: job.school_id }]));
    const { data } = jobs?.length ? await supabase.from("applications").select("id, teacher_id, job_id, status, cover_note, created_at").in("job_id", jobs.map((job) => job.id)).order("created_at", { ascending: false }) : { data: [] };
    applications = (data ?? []) as Application[];
  } else {
    const { data } = await supabase.from("applications").select("id, teacher_id, job_id, status, cover_note, created_at").eq("teacher_id", userId).order("created_at", { ascending: false });
    applications = (data ?? []) as Application[];
    const ids = [...new Set(applications.map((application) => application.job_id))];
    const { data: jobs } = ids.length ? await supabase.from("jobs").select("id, title, school_id").in("id", ids) : { data: [] };
    jobsById = new Map((jobs ?? []).map((job) => [job.id, { title: job.title, school_id: job.school_id }]));
  }
  const teacherIds = [...new Set(applications.map((application) => application.teacher_id))];
  const [{ data: profiles }, { data: teacherProfiles }, { data: resumes }] = profile.role === "school" && teacherIds.length ? await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", teacherIds),
    supabase.from("teacher_profiles").select("id, state, city, qualification, years_experience, subjects").in("id", teacherIds),
    supabase.from("teacher_resumes").select("teacher_id, object_path, original_filename").in("teacher_id", teacherIds),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const names = new Map((profiles ?? []).map((entry) => [entry.id, entry.full_name]));
  const teacherData = new Map((teacherProfiles ?? []).map((entry) => [entry.id, entry]));
  const resumeData = new Map((resumes ?? []).map((entry) => [entry.teacher_id, entry]));
  const resumeUrls = new Map<string, string>();
  if (profile.role === "school") for (const resume of resumes ?? []) {
    const { data } = await supabase.storage.from("teacher-cvs").createSignedUrl(resume.object_path, 600);
    if (data?.signedUrl) resumeUrls.set(resume.teacher_id, data.signedUrl);
  }
  return <main className="dashboard-shell feature-page">
    <header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link>{profile.role === "school" && <Link href="/dashboard/jobs">Your jobs</Link>}</nav></header>
    <section className="feature-heading"><p className="eyebrow">Hiring workspace</p><h1>{profile.role === "school" ? "Applicants" : "Your applications"}</h1><p>{profile.role === "school" ? "Review teachers who applied to your roles and keep each application moving." : "See the latest status for each role you applied to."}</p></section>
    {applications.length ? <div className="feature-list">{applications.map((application) => {
      const job = jobsById.get(application.job_id);
      const teacher = teacherData.get(application.teacher_id);
      const resume = resumeData.get(application.teacher_id);
      return <article className="feature-card applicant-card" key={application.id}>
        <div className="feature-row"><div><p className="eyebrow">{profile.role === "school" ? names.get(application.teacher_id) ?? "Teacher" : "Application status"}</p><h2>{job?.title ?? "Teaching role"}</h2><p>{profile.role === "school" && teacher ? `${teacher.city}, ${teacher.state} · ${teacher.qualification ?? "Qualification not listed"} · ${teacher.years_experience} years` : `Applied ${new Date(application.created_at).toLocaleDateString("en-NG")}`}</p></div><span className={`job-status status-${application.status}`}>{application.status}</span></div>
        {profile.role === "school" && teacher?.subjects?.length ? <p>Subjects: {teacher.subjects.join(", ")}</p> : null}
        {application.cover_note && <blockquote className="applicant-note">“{application.cover_note}”</blockquote>}
        <div className="feature-actions"><Link className="text-link" href={`/dashboard/messages?application=${application.id}`}>Message</Link><Link className="text-link" href={`/dashboard/interviews?application=${application.id}`}>Schedule / view interview</Link>{profile.role === "school" && resume && resumeUrls.get(application.teacher_id) ? <a className="text-link" href={resumeUrls.get(application.teacher_id)} target="_blank" rel="noreferrer">Open CV · {resume.original_filename}</a> : null}</div>
        {profile.role === "school" ? <form action={updateApplicationStatus} className="inline-action-form"><input type="hidden" name="application_id" value={application.id} /><label className="form-field"><span>Application stage</span><select name="status" defaultValue={application.status}><option value="submitted">Submitted</option><option value="reviewing">Reviewing</option><option value="interview">Interview</option><option value="declined">Declined</option><option value="accepted">Accepted</option></select></label><button className="button button-primary" type="submit">Update stage</button></form> : null}
      </article>;
    })}</div> : <section className="feature-card"><h2>{profile.role === "school" ? "No applications yet" : "You haven’t applied yet"}</h2><p>{profile.role === "school" ? "Applications to your published roles will appear here." : "Find a role that fits your subjects and location, then apply directly from its page."}</p><Link className="button button-primary" href={profile.role === "school" ? "/dashboard/jobs" : "/jobs"}>{profile.role === "school" ? "Manage jobs" : "Browse jobs"}</Link></section>}
  </main>;
}
