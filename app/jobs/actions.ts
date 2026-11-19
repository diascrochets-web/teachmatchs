"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function textField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function salaryField(formData: FormData, name: string) {
  const value = textField(formData, name);
  if (!value) return null;
  if (!/^\d{1,9}$/.test(value)) return Number.NaN;
  return Number(value);
}

export async function createJob(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/dashboard/jobs/new?error=configuration");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "school") redirect("/dashboard");

  const { data: school } = await supabase
    .from("school_profiles")
    .select("verification_status")
    .eq("id", userId)
    .maybeSingle();
  if (!school) redirect("/dashboard");

  const title = textField(formData, "title");
  const subject = textField(formData, "subject");
  const schoolLevel = textField(formData, "school_level");
  const employmentType = textField(formData, "employment_type");
  const state = textField(formData, "state");
  const city = textField(formData, "city");
  const description = textField(formData, "description");
  const requirements = textField(formData, "requirements");
  const deadline = textField(formData, "application_deadline");
  const salaryMin = salaryField(formData, "salary_min");
  const salaryMax = salaryField(formData, "salary_max");

  if (
    title.length < 4 || title.length > 120 ||
    subject.length < 2 || subject.length > 80 ||
    !["primary", "secondary", "both"].includes(schoolLevel) ||
    !["full-time", "part-time", "contract"].includes(employmentType) ||
    !state || !city || description.length < 30 || description.length > 5000 ||
    Number.isNaN(salaryMin) || Number.isNaN(salaryMax) ||
    (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) ||
    (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
  ) {
    redirect("/dashboard/jobs/new?error=details");
  }

  const status = school.verification_status === "approved" ? "published" : "draft";
  const { error } = await supabase.from("jobs").insert({
    school_id: userId,
    title,
    subject,
    school_level: schoolLevel,
    employment_type: employmentType,
    state,
    city,
    salary_min: salaryMin,
    salary_max: salaryMax,
    description,
    requirements: requirements || null,
    application_deadline: deadline || null,
    status,
  });

  if (error) redirect("/dashboard/jobs/new?error=save");

  revalidatePath("/");
  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs?created=${status}`);
}

export async function applyForJob(formData: FormData) {
  const jobId = textField(formData, "job_id");
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) redirect("/jobs");
  if (!isSupabaseConfigured()) redirect(`/jobs/${jobId}?error=configuration`);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "teacher") redirect("/dashboard");

  const coverNote = textField(formData, "cover_note");
  if (coverNote.length > 2000) redirect(`/jobs/${jobId}?error=details`);

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    teacher_id: userId,
    cover_note: coverNote || null,
  });

  if (error?.code === "23505") redirect(`/jobs/${jobId}?error=duplicate`);
  if (error) redirect(`/jobs/${jobId}?error=apply`);

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  redirect(`/jobs/${jobId}?applied=1`);
}
