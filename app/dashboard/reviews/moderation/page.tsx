import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { moderateSchoolReview } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewModerationPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");
  const { data: reviews } = await supabase.from("school_reviews").select("id, school_id, teacher_id, title, body, rating, created_at, school_profiles!inner(school_name)").eq("status", "pending").order("created_at", { ascending: true });
  return <main className="dashboard-shell feature-page"><header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link></nav></header><section className="feature-heading"><p className="eyebrow">Moderation</p><h1>School reviews</h1><p>Approve reviews that follow the review policy or reject ones that don’t.</p></section>{reviews?.length ? <div className="feature-list">{reviews.map((review) => { const school = Array.isArray(review.school_profiles) ? review.school_profiles[0] : review.school_profiles; return <article className="feature-card" key={review.id}><p className="eyebrow">{school?.school_name} · Verified TeachMatchs teacher · {review.rating}/5</p><h2>{review.title}</h2><p>{review.body}</p><form action={moderateSchoolReview} className="feature-actions"><input type="hidden" name="review_id" value={review.id} /><button className="button button-primary" type="submit" name="status" value="published">Publish</button><button className="button button-secondary" type="submit" name="status" value="rejected">Reject</button></form></article>; })}</div> : <section className="feature-card"><h2>Nothing to review</h2><p>New teacher reviews will be listed here.</p></section>}</main>;
}
