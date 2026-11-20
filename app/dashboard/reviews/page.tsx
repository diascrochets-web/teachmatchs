import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { submitSchoolReview } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherReviewsPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const [{ submitted, error }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "teacher") redirect("/dashboard");
  const { data: applications } = await supabase.from("applications").select("id, job_id, created_at").eq("teacher_id", userId).order("created_at", { ascending: false });
  const applicationIds = applications?.map((app) => app.id) ?? [];
  const [{ data: jobs }, { data: reviews }] = applicationIds.length ? await Promise.all([
    supabase.from("jobs").select("id, title, school_id").in("id", [...new Set((applications ?? []).map((app) => app.job_id))]),
    supabase.from("school_reviews").select("application_id, status").eq("teacher_id", userId).in("application_id", applicationIds),
  ]) : [{ data: [] }, { data: [] }];
  const schoolIds = [...new Set((jobs ?? []).map((job) => job.school_id))];
  const { data: schools } = schoolIds.length ? await supabase.from("school_profiles").select("id, school_name").in("id", schoolIds) : { data: [] };
  const jobById = new Map((jobs ?? []).map((job) => [job.id, job]));
  const schoolById = new Map((schools ?? []).map((school) => [school.id, school.school_name]));
  const reviewedIds = new Set((reviews ?? []).map((review) => review.application_id));
  return <main className="dashboard-shell feature-page"><header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link></nav></header><section className="feature-heading"><p className="eyebrow">Share your experience</p><h1>School reviews</h1><p>Reviews are tied to an application and appear publicly only after moderation.</p></section>{submitted && <p className="form-success" role="status">Your review was submitted for moderation.</p>}{error && <p className="form-error" role="alert">We couldn’t submit that review. It may already be under review.</p>}{applications?.length ? <div className="feature-list">{applications.map((application) => { const job = jobById.get(application.job_id); if (!job) return null; return <article className="feature-card" key={application.id}><p className="eyebrow">{schoolById.get(job.school_id) ?? "School"}</p><h2>{job.title}</h2>{reviewedIds.has(application.id) ? <p>Your review is submitted and {reviews?.find((item) => item.application_id === application.id)?.status === "published" ? "published" : "awaiting moderation"}.</p> : <form action={submitSchoolReview} className="feature-form"><input type="hidden" name="application_id" value={application.id} /><label className="form-field"><span>Rating</span><select name="rating" defaultValue="5"><option value="5">5 · Excellent</option><option value="4">4 · Good</option><option value="3">3 · Okay</option><option value="2">2 · Poor</option><option value="1">1 · Very poor</option></select></label><label className="form-field"><span>Review title</span><input name="title" required minLength={4} maxLength={120} /></label><label className="form-field"><span>Your experience</span><textarea name="body" required minLength={20} maxLength={3000} rows={5} /></label><button className="button button-primary" type="submit">Submit review</button></form>}</article>; })}</div> : <section className="feature-card"><h2>Apply before reviewing</h2><p>When you’ve applied to a teaching job, you can leave a review of that school from here.</p><Link className="button button-primary" href="/jobs">Browse jobs</Link></section>}</main>;
}
