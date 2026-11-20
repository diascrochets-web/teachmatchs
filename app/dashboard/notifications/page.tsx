import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { markNotificationRead } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: notifications } = await supabase.from("user_notifications").select("id, category, title, body, href, created_at, read_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  return <main className="dashboard-shell feature-page"><header className="dashboard-header"><Link className="brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><nav className="dashboard-nav"><Link href="/dashboard">Dashboard</Link></nav></header><section className="feature-heading"><p className="eyebrow">Your account</p><h1>Notifications</h1><p>Application updates, messages and interview reminders.</p></section>{notifications?.length ? <div className="feature-list">{notifications.map((notification) => <article className={`feature-card notification-row${notification.read_at ? " is-read" : ""}`} key={notification.id}><div><p className="eyebrow">{notification.category} · {new Date(notification.created_at).toLocaleString("en-NG")}</p><h2>{notification.title}</h2><p>{notification.body}</p></div><div className="feature-actions"><Link className="text-link" href={notification.href}>Open</Link>{!notification.read_at && <form action={markNotificationRead}><input type="hidden" name="notification_id" value={notification.id} /><button className="text-link" type="submit">Mark read</button></form>}</div></article>)}</div> : <section className="feature-card"><h2>You’re all caught up</h2><p>New application and interview updates will appear here.</p><Link href="/dashboard">Back to dashboard</Link></section>}</main>;
}
