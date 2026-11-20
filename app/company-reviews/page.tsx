import Link from "next/link";
import { InfoPageShell } from "@/components/info-page-shell";
import { reportSchoolReview } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyReviewsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [supabase, { error }] = await Promise.all([createClient(), searchParams]);
  const [{ data: claims }, { data: reviews }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("school_reviews").select("id, school_id, rating, title, body, created_at, school_profiles!inner(school_name)").eq("status", "published").order("created_at", { ascending: false }).limit(50),
  ]);
  const userId = claims?.claims?.sub;
  return <InfoPageShell title="School reviews" description="Read reviews from teachers who applied to schools through TeachMatchs.">
    {error && <p className="form-error" role="alert">We couldn’t submit that report.</p>}
    {reviews?.length ? <div className="public-review-list">{reviews.map((review) => { const school = Array.isArray(review.school_profiles) ? review.school_profiles[0] : review.school_profiles; return <article className="feature-card public-review-card" key={review.id}><p className="eyebrow">{school?.school_name} · Verified application · {new Date(review.created_at).toLocaleDateString("en-NG")}</p><div className="review-rating" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} <span>{review.rating}/5</span></div><h2>{review.title}</h2><p>{review.body}</p>{userId ? <details><summary>Report this review</summary><form action={reportSchoolReview} className="feature-form"><input type="hidden" name="review_id" value={review.id} /><label className="form-field"><span>Why should we review it?</span><textarea name="reason" minLength={8} maxLength={500} rows={2} required /></label><button className="text-link" type="submit">Send report</button></form></details> : <Link className="text-link" href="/login">Sign in to report a review</Link>}</article>; })}</div> : <p className="info-page-notice">No published reviews yet. Reviews from verified applications will appear here after moderation.</p>}
    <p className="review-cta">Applied to a school? <Link href="/dashboard/reviews">Share your experience from your account</Link>.</p>
  </InfoPageShell>;
}
