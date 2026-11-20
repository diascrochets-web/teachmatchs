import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { ResumeUploadForm } from "@/components/resume-upload-form";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherProfilePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profile }, { data: teacher }, { data: resume }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone, role").eq("id", userId).maybeSingle(),
    supabase.from("teacher_profiles").select("state, city, qualification, years_experience, subjects").eq("id", userId).maybeSingle(),
    supabase.from("teacher_resumes").select("original_filename, updated_at").eq("teacher_id", userId).maybeSingle(),
  ]);
  if (profile?.role !== "teacher" || !teacher) redirect("/dashboard");
  return <main className="dashboard-shell feature-page">
    <header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link><Link href="/dashboard/applications">Applications</Link></nav></header>
    <section className="feature-heading"><p className="eyebrow">Teacher account</p><h1>Your profile and CV</h1><p>Keep your teaching experience ready for schools when you apply.</p></section>
    <section className="feature-card"><h2>Profile</h2><dl className="profile-details"><div><dt>Name</dt><dd>{profile.full_name}</dd></div><div><dt>Email</dt><dd>{profile.email}</dd></div><div><dt>Phone</dt><dd>{profile.phone || "Not added"}</dd></div><div><dt>Location</dt><dd>{teacher.city}, {teacher.state}</dd></div><div><dt>Qualification</dt><dd>{teacher.qualification || "Not added"}</dd></div><div><dt>Experience</dt><dd>{teacher.years_experience} years</dd></div><div><dt>Subjects</dt><dd>{teacher.subjects?.join(", ") || "Not added"}</dd></div></dl><p className="feature-muted">Contact and teaching history can be edited from your account profile. For now, this page provides secure CV upload.</p></section>
    <section className="feature-card"><h2>CV</h2><p>Attach a current CV to your applications. Schools can access it only after you apply to one of their jobs.</p><ResumeUploadForm currentFilename={resume?.original_filename} />{resume?.updated_at && <small className="feature-muted">Last updated {new Date(resume.updated_at).toLocaleDateString("en-NG")}</small>}</section>
  </main>;
}
