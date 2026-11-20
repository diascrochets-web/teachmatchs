"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

function field(data: FormData, name: string) { return String(data.get(name) ?? "").trim(); }

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

export async function saveJob(data: FormData) {
  const jobId = field(data, "job_id");
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) redirect("/jobs");
  const { supabase, userId } = await currentUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "teacher") redirect("/dashboard");
  const { error } = await supabase.from("saved_jobs").insert({ teacher_id: userId, job_id: jobId });
  if (error && error.code !== "23505") redirect(`/jobs/${jobId}?error=save`);
  revalidatePath("/dashboard/saved-jobs");
  redirect(`/jobs/${jobId}?saved=1`);
}

export async function removeSavedJob(data: FormData) {
  const jobId = field(data, "job_id");
  const { supabase, userId } = await currentUser();
  await supabase.from("saved_jobs").delete().eq("teacher_id", userId).eq("job_id", jobId);
  revalidatePath("/dashboard/saved-jobs");
  revalidatePath(`/jobs/${jobId}`);
}

export async function createJobAlert(data: FormData) {
  const { supabase, userId } = await currentUser();
  const keywords = field(data, "keywords");
  const location = field(data, "location");
  const frequency = field(data, "frequency");
  if (keywords.length < 2 || keywords.length > 120 || location.length > 120 || !["daily", "weekly"].includes(frequency)) redirect("/dashboard/alerts?error=details");
  const { error } = await supabase.from("job_alerts").insert({ teacher_id: userId, keywords, location, frequency });
  if (error) redirect("/dashboard/alerts?error=save");
  revalidatePath("/dashboard/alerts");
  redirect("/dashboard/alerts?created=1");
}

export async function deleteJobAlert(data: FormData) {
  const { supabase, userId } = await currentUser();
  await supabase.from("job_alerts").delete().eq("id", field(data, "alert_id")).eq("teacher_id", userId);
  revalidatePath("/dashboard/alerts");
}

export async function sendApplicationMessage(data: FormData) {
  const { supabase, userId } = await currentUser();
  const applicationId = field(data, "application_id");
  const body = field(data, "body");
  if (!/^[0-9a-f-]{36}$/i.test(applicationId) || !body || body.length > 4000) redirect("/dashboard/messages?error=details");
  const { data: application } = await supabase.from("applications").select("id, teacher_id, job_id").eq("id", applicationId).maybeSingle();
  if (!application) redirect("/dashboard/messages?error=not-found");
  const { data: job } = await supabase.from("jobs").select("id, school_id, title").eq("id", application.job_id).maybeSingle();
  if (!job || ![application.teacher_id, job.school_id].includes(userId)) redirect("/dashboard");
  const recipientId = userId === application.teacher_id ? job.school_id : application.teacher_id;
  const { error } = await supabase.from("application_messages").insert({ application_id: applicationId, sender_id: userId, recipient_id: recipientId, body });
  if (error) redirect(`/dashboard/messages?application=${applicationId}&error=send`);
  await supabase.from("user_notifications").insert({ user_id: recipientId, category: "message", title: "New TeachMatchs message", body: body.slice(0, 180), href: `/dashboard/messages?application=${applicationId}` });
  revalidatePath("/dashboard/messages");
  redirect(`/dashboard/messages?application=${applicationId}&sent=1`);
}

export async function updateApplicationStatus(data: FormData) {
  const { supabase, userId } = await currentUser();
  const applicationId = field(data, "application_id");
  const status = field(data, "status");
  if (!/^[0-9a-f-]{36}$/i.test(applicationId) || !["submitted", "reviewing", "interview", "declined", "accepted"].includes(status)) redirect("/dashboard/applications");
  const { data: application } = await supabase.from("applications").select("id, teacher_id, job_id").eq("id", applicationId).maybeSingle();
  if (!application) redirect("/dashboard/applications");
  const { data: job } = await supabase.from("jobs").select("title").eq("id", application.job_id).eq("school_id", userId).maybeSingle();
  if (!job) redirect("/dashboard");
  const { error } = await supabase.from("applications").update({ status }).eq("id", applicationId);
  if (error) redirect("/dashboard/applications?error=save");
  await supabase.from("user_notifications").insert({ user_id: application.teacher_id, category: "application", title: "Application update", body: `${job.title}: your application is now ${status}.`, href: "/dashboard" });
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard");
  redirect("/dashboard/applications?updated=1");
}

export async function scheduleInterview(data: FormData) {
  const { supabase, userId } = await currentUser();
  const applicationId = field(data, "application_id");
  const scheduledAt = new Date(field(data, "scheduled_at"));
  const meetingUrl = field(data, "meeting_url");
  const notes = field(data, "notes");
  if (!/^[0-9a-f-]{36}$/i.test(applicationId) || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date() || !/^https:\/\//i.test(meetingUrl) || meetingUrl.length > 500 || notes.length > 1000) redirect(`/dashboard/interviews?error=details&application=${applicationId}`);
  const { data: application } = await supabase.from("applications").select("id, teacher_id, job_id").eq("id", applicationId).maybeSingle();
  if (!application) redirect("/dashboard/interviews?error=not-found");
  const { data: job } = await supabase.from("jobs").select("school_id, title").eq("id", application.job_id).maybeSingle();
  if (!job || ![application.teacher_id, job.school_id].includes(userId)) redirect("/dashboard");
  const { error } = await supabase.from("interviews").insert({ application_id: applicationId, created_by: userId, scheduled_at: scheduledAt.toISOString(), meeting_url: meetingUrl, notes: notes || null });
  if (error) redirect(`/dashboard/interviews?error=save&application=${applicationId}`);
  const recipientId = userId === application.teacher_id ? job.school_id : application.teacher_id;
  await supabase.from("user_notifications").insert({ user_id: recipientId, category: "interview", title: "Video interview scheduled", body: `${job.title} · ${scheduledAt.toLocaleString("en-NG")}`, href: "/dashboard/interviews" });
  revalidatePath("/dashboard/interviews");
  redirect("/dashboard/interviews?created=1");
}

export async function submitSchoolReview(data: FormData) {
  const { supabase, userId } = await currentUser();
  const applicationId = field(data, "application_id");
  const rating = Number(field(data, "rating"));
  const title = field(data, "title");
  const body = field(data, "body");
  if (!/^[0-9a-f-]{36}$/i.test(applicationId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || title.length < 4 || title.length > 120 || body.length < 20 || body.length > 3000) redirect("/dashboard/reviews?error=details");
  const { data: application } = await supabase.from("applications").select("id, job_id").eq("id", applicationId).eq("teacher_id", userId).maybeSingle();
  if (!application) redirect("/dashboard/reviews?error=not-eligible");
  const { data: job } = await supabase.from("jobs").select("school_id, title").eq("id", application.job_id).maybeSingle();
  if (!job) redirect("/dashboard/reviews?error=not-eligible");
  const { error } = await supabase.from("school_reviews").insert({ school_id: job.school_id, teacher_id: userId, application_id: application.id, rating, title, body, status: "pending" });
  if (error) redirect("/dashboard/reviews?error=save");
  await supabase.from("user_notifications").insert({ user_id: job.school_id, category: "review", title: "A teacher reviewed your school", body: `${job.title} · Review pending moderation.`, href: "/company-reviews" });
  revalidatePath("/company-reviews");
  redirect("/dashboard/reviews?submitted=1");
}

export async function moderateSchoolReview(data: FormData) {
  const { supabase, userId } = await currentUser();
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");
  const reviewId = field(data, "review_id");
  const status = field(data, "status");
  if (!/^[0-9a-f-]{36}$/i.test(reviewId) || !["published", "rejected"].includes(status)) redirect("/dashboard/reviews/moderation");
  const { error } = await supabase.from("school_reviews").update({ status }).eq("id", reviewId);
  if (error) redirect("/dashboard/reviews/moderation?error=save");
  revalidatePath("/dashboard/reviews/moderation");
  revalidatePath("/company-reviews");
  redirect("/dashboard/reviews/moderation?updated=1");
}

export async function reportSchoolReview(data: FormData) {
  const { supabase, userId } = await currentUser();
  const reviewId = field(data, "review_id");
  const reason = field(data, "reason");
  if (!/^[0-9a-f-]{36}$/i.test(reviewId) || reason.length < 8 || reason.length > 500) redirect("/company-reviews?error=details");
  const { error } = await supabase.from("school_review_reports").insert({ review_id: reviewId, reporter_id: userId, reason });
  if (error && error.code !== "23505") redirect("/company-reviews?error=report");
  revalidatePath("/company-reviews");
}

export async function markNotificationRead(data: FormData) {
  const { supabase, userId } = await currentUser();
  await supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", field(data, "notification_id")).eq("user_id", userId);
  revalidatePath("/dashboard/notifications");
}
