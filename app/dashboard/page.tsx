import Link from "next/link";
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

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"></span><span>Teach<span className="brand-accent">Matchs</span></span></Link>
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
            </div>
          </>
        ) : (
          <>
            <p>Your teacher profile is ready. Browse open teaching roles and apply directly to schools.</p>
            <Link className="button button-primary" href="/#jobs">Browse teaching jobs <span>→</span></Link>
          </>
        )}
      </section>
    </main>
  );
}
