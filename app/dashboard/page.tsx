import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { redirect } from "next/navigation";
import { signOut } from "@/app/dashboard/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: school }] = await Promise.all([
    supabase.from("profiles").select("role, full_name").eq("id", userId).maybeSingle(),
    supabase.from("school_profiles").select("school_name, verification_status").eq("id", userId).maybeSingle(),
  ]);
  const [{ count: applicationCount }, { count: savedCount }, { count: notificationCount }] = await Promise.all([
    profile?.role === "school"
      ? supabase.from("applications").select("id", { count: "exact", head: true }).in("job_id", (await supabase.from("jobs").select("id").eq("school_id", userId)).data?.map((job) => job.id) ?? [])
      : supabase.from("applications").select("id", { count: "exact", head: true }).eq("teacher_id", userId),
    supabase.from("saved_jobs").select("job_id", { count: "exact", head: true }).eq("teacher_id", userId),
    supabase.from("user_notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
  ]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link>
        <form action={signOut}><button className="text-link" type="submit">Log out</button></form>
      </header>
      <section className="dashboard-welcome">
        <p className="eyebrow">Your TeachMatchs account</p>
        <h1>Welcome, {profile?.full_name ?? "there"}.</h1>
        {profile?.role === "school" ? (
          <>
            <p>{school?.school_name ?? "Your school"} can now prepare teaching roles for educators across Nigeria.</p>
            {school?.verification_status !== "approved" && <span className="status-pill">School review pending</span>}
            <div className="dashboard-actions">
              <Link className="button button-primary" href="/dashboard/jobs">Manage teaching roles <span>→</span></Link>
              <Link className="dashboard-secondary-link" href="/dashboard/jobs/new">Post a job</Link>
              <Link className="dashboard-secondary-link" href="/dashboard/applications">Review applicants ({applicationCount ?? 0})</Link>
            </div>
          </>
        ) : (
          <>
            <p>Your teacher profile is ready. Browse open teaching roles and apply directly to schools.</p>
            <div className="dashboard-actions"><Link className="button button-primary" href="/jobs">Browse teaching jobs <span>→</span></Link><Link className="dashboard-secondary-link" href="/dashboard/profile">Profile & CV</Link><Link className="dashboard-secondary-link" href="/dashboard/applications">Applications ({applicationCount ?? 0})</Link><Link className="dashboard-secondary-link" href="/dashboard/saved-jobs">Saved jobs ({savedCount ?? 0})</Link><Link className="dashboard-secondary-link" href="/dashboard/alerts">Job alerts</Link><Link className="dashboard-secondary-link" href="/dashboard/reviews">School reviews</Link></div>
          </>
        )}
        <div className="dashboard-actions dashboard-feature-links"><Link className="dashboard-secondary-link" href="/dashboard/messages">Messages</Link><Link className="dashboard-secondary-link" href="/dashboard/interviews">Interviews</Link><Link className="dashboard-secondary-link" href="/dashboard/notifications">Notifications ({notificationCount ?? 0} new)</Link></div>
      </section>
    </main>
  );
}
