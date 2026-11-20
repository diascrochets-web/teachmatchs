import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { sendApplicationMessage } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ application?: string; error?: string; sent?: string }> }) {
  const [{ application: selectedId }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!profile) redirect("/dashboard");
  let applications: { id: string; job_id: string; teacher_id: string }[] = [];
  if (profile.role === "teacher") {
    const { data } = await supabase.from("applications").select("id, job_id, teacher_id").eq("teacher_id", userId).order("created_at", { ascending: false });
    applications = data ?? [];
  } else {
    const { data: jobs } = await supabase.from("jobs").select("id").eq("school_id", userId);
    const { data } = jobs?.length ? await supabase.from("applications").select("id, job_id, teacher_id").in("job_id", jobs.map((job) => job.id)).order("created_at", { ascending: false }) : { data: [] };
    applications = data ?? [];
  }
  const application = applications.find((item) => item.id === selectedId) ?? applications[0];
  const [{ data: jobs }, { data: messages }] = application ? await Promise.all([
    supabase.from("jobs").select("id, title, school_id").eq("id", application.job_id).maybeSingle(),
    supabase.from("application_messages").select("id, sender_id, body, created_at").eq("application_id", application.id).order("created_at", { ascending: true }),
  ]) : [{ data: null }, { data: [] }];
  const otherSide = profile.role === "teacher" ? "School" : "Teacher";
  return <main className="dashboard-shell feature-page">
    <header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link><Link href="/dashboard/applications">Applications</Link></nav></header>
    <section className="feature-heading"><p className="eyebrow">Application conversations</p><h1>Messages</h1><p>Keep communication about each teaching role in one place.</p></section>
    {applications.length ? <div className="message-layout"><aside className="feature-card message-threads"><h2>Conversations</h2>{applications.map((item) => <Link key={item.id} className={application?.id === item.id ? "thread-link is-active" : "thread-link"} href={`/dashboard/messages?application=${item.id}`}>Application · {item.id.slice(0, 8)}</Link>)}</aside>
      <section className="feature-card message-conversation"><p className="eyebrow">{jobs?.title ?? "Teaching role"} · {otherSide}</p>{messages?.length ? <div className="message-list">{messages.map((message) => <article className={message.sender_id === userId ? "message-bubble is-own" : "message-bubble"} key={message.id}><p>{message.body}</p><small>{message.sender_id === userId ? "You" : otherSide} · {new Date(message.created_at).toLocaleString("en-NG")}</small></article>)}</div> : <p className="feature-muted">No messages yet. Send a note to begin the conversation.</p>}
        <form action={sendApplicationMessage} className="feature-form"><input type="hidden" name="application_id" value={application?.id} /><label className="form-field"><span>Message</span><textarea name="body" rows={4} minLength={1} maxLength={4000} required placeholder="Write a message about this application" /></label><button className="button button-primary" type="submit">Send message</button></form>
      </section></div> : <section className="feature-card"><h2>No conversations yet</h2><p>Messages become available after a teacher applies to a school’s role.</p><Link className="button button-primary" href={profile.role === "school" ? "/dashboard/jobs" : "/jobs"}>{profile.role === "school" ? "View jobs" : "Find a teaching job"}</Link></section>}
  </main>;
}
