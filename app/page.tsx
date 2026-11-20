"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { SiteMenu } from "@/components/site-menu";
import type { ActivityCategory } from "@/lib/search-activity";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Job = {
  id: string;
  initials: string;
  logo: string;
  school: string;
  location: string;
  title: string;
  subject: string;
  tags: string[];
  salary: string;
  salarySort: number;
  posted: string;
};

type PublicJobRow = {
  id: string;
  title: string;
  subject: string;
  school_level: string;
  employment_type: string;
  state: string;
  city: string;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  school_profiles: { school_name: string } | { school_name: string }[];
};

type TrendingActivity = { category: ActivityCategory; term: string; visitors: number };

function formatSalary(min: number | null, max: number | null) {
  const format = (amount: number) => `₦${Math.round(amount / 1000)}k`;
  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`;
  if (min !== null) return `From ${format(min)}`;
  if (max !== null) return `Up to ${format(max)}`;
  return "Salary not listed";
}

function postedLabel(date: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 7) return `Posted ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "Posted 1 week ago" : `Posted ${weeks} weeks ago`;
}

function mapJob(row: PublicJobRow, index: number): Job {
  const schoolProfile = Array.isArray(row.school_profiles) ? row.school_profiles[0] : row.school_profiles;
  const schoolName = schoolProfile?.school_name ?? "TeachMatch school";
  const logoClasses = ["logo-blue", "logo-cream", "logo-green", "logo-peach"];
  const initials = schoolName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const level = row.school_level === "both" ? "Primary & secondary" : row.school_level[0].toUpperCase() + row.school_level.slice(1);
  const employment = row.employment_type.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    id: row.id,
    initials,
    logo: logoClasses[index % logoClasses.length],
    school: schoolName,
    location: `${row.city}, ${row.state}`,
    title: row.title,
    subject: `${row.subject} ${row.school_level} ${row.city} ${row.state}`,
    tags: [level, employment],
    salary: formatSalary(row.salary_min, row.salary_max),
    salarySort: row.salary_max ?? row.salary_min ?? 0,
    posted: postedLabel(row.created_at),
  };
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trending, setTrending] = useState<TrendingActivity[]>([]);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const revealAll = () => targets.forEach((target) => target.classList.add("is-visible"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    document.documentElement.classList.add("has-scroll-motion");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -38px 0px" });

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const goals = document.querySelector<HTMLElement>("#goal-videos");
    if (!goals) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const paintOnScroll = () => {
      if (reducedMotion) {
        goals.style.setProperty("--paint-progress", "1");
        return;
      }
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const bounds = goals.getBoundingClientRect();
        const start = window.innerHeight * 0.72;
        const end = -bounds.height * 0.18;
        const progress = Math.max(0, Math.min(1, (start - bounds.top) / (start - end)));
        goals.style.setProperty("--paint-progress", progress.toFixed(3));
      });
    };

    paintOnScroll();
    window.addEventListener("scroll", paintOnScroll, { passive: true });
    window.addEventListener("resize", paintOnScroll);
    return () => {
      window.removeEventListener("scroll", paintOnScroll);
      window.removeEventListener("resize", paintOnScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".hero-header");
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".hero, .job-discovery-section, #goal-videos, .site-footer-final"));
    if (!header || sections.length === 0) return;

    let frame = 0;
    const updateHeaderTheme = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const marker = Math.min(120, window.innerHeight * 0.18);
        const current = sections.find((section) => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= marker && bounds.bottom > marker;
        }) ?? sections[0];
        header.dataset.theme = current.id || (current.classList.contains("site-footer-final") ? "footer" : current.classList.contains("job-discovery-section") ? "jobs-discovery" : "hero");
      });
    };

    updateHeaderTheme();
    window.addEventListener("scroll", updateHeaderTheme, { passive: true });
    window.addEventListener("resize", updateHeaderTheme);
    return () => {
      window.removeEventListener("scroll", updateHeaderTheme);
      window.removeEventListener("resize", updateHeaderTheme);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let active = true;
    const supabase = createClient();
    void Promise.all([
      supabase
        .from("jobs")
        .select("id, title, subject, school_level, employment_type, state, city, salary_min, salary_max, created_at, school_profiles!inner(school_name)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.rpc("get_trending_activity"),
    ]).then(([jobsResult, trendsResult]) => {
      if (!active) return;
      if (!jobsResult.error) setJobs(((jobsResult.data ?? []) as unknown as PublicJobRow[]).map(mapJob));
      if (!trendsResult.error) setTrending((trendsResult.data ?? []) as TrendingActivity[]);
    });

    return () => { active = false; };
  }, []);

  const featuredJob = jobs[0];
  const activityFor = (category: ActivityCategory) => trending.filter((activity) => activity.category === category);

  return (
    <>
      <div className="home-page-content">
      <main id="top">
        <section className="hero">
          <video className="section-background-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
            <source src="/hero-section.mp4" type="video/mp4" />
          </video>
          <div className="section-video-overlay" aria-hidden="true"></div>
          <header className="site-header hero-header" data-theme="hero">
            <Link className="brand hero-brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link>
            <nav className="hero-nav" aria-label="Main navigation">
              <Link className="is-active" href="#top" aria-current="page">Home</Link>
              <Link href="/jobs">Find jobs</Link>
              <Link href="/register?type=school">For schools</Link>
              <Link href="/register?type=school">Post a job</Link>
              <Link className="hero-nav-cta" href="/register?type=teacher">Start for free</Link>
            </nav>
            <SiteMenu />
          </header>
          <div className="hero-copy">
            <h1>Your next classroom is waiting.</h1>
            <p className="hero-intro">Find a teaching job that fits your subject, level and location.</p>
            <form className="hero-search-form" action="/jobs" method="get">
              <label><span aria-hidden="true">⌕</span><input aria-label="Job title or subject" name="q" placeholder="Job title, subject, or school" /></label>
              <label><span aria-hidden="true">⌖</span><input aria-label="City or state" name="location" placeholder="City or state in Nigeria" /></label>
              <button type="submit">Find jobs <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>

        <section className="job-discovery-section" aria-labelledby="job-discovery-title">
          <div className="job-discovery-inner">
            <div className="job-discovery-heading"><div><p className="eyebrow">Explore TeachMatchs</p><h2 id="job-discovery-title">What’s trending</h2></div><Link href="/jobs" className="job-discovery-all">See all teaching jobs <span aria-hidden="true">→</span></Link></div>
            <div className="job-discovery-grid">
              <div className="job-discovery-column"><h3>Trending searches</h3><div className="job-discovery-chips">{activityFor("search").length ? activityFor("search").map(({ term, visitors }) => <Link href={`/jobs?q=${encodeURIComponent(term)}`} key={term}>{term}<small>{visitors} browsers searched</small></Link>) : <p>Searches will appear here after visitors use TeachMatchs.</p>}</div></div>
              <div className="job-discovery-column"><h3>Trending jobs</h3><div className="job-discovery-list">{activityFor("job").length ? activityFor("job").map(({ term, visitors }) => <Link href={`/jobs?q=${encodeURIComponent(term)}`} key={term}><strong>{term}</strong><span>{visitors} browsers viewed</span></Link>) : <p>Jobs will trend here as visitors open job listings.</p>}</div></div>
              <div className="job-discovery-column"><h3>Trending locations</h3><div className="job-discovery-chips">{activityFor("location").length ? activityFor("location").map(({ term, visitors }) => <Link href={`/jobs?location=${encodeURIComponent(term)}`} key={term}>{term}<small>{visitors} browsers searched</small></Link>) : <p>Locations will trend here after visitors search for them.</p>}</div></div>
              <div className="job-discovery-column" id="trending-schools"><h3>Trending schools</h3><div className="job-discovery-list">{activityFor("school").length ? activityFor("school").map(({ term, visitors }) => <Link href={`/jobs?q=${encodeURIComponent(term)}`} key={term}><strong>{term}</strong><span>{visitors} browsers viewed</span></Link>) : <p>Schools will trend here as visitors explore their jobs.</p>}</div></div>
            </div>
            <div className="homepage-directory">
              <section className="homepage-directory-group"><h3>Get started, job seekers</h3><Link href="/help">Help</Link><Link href="#trending-schools">Browse schools</Link><Link href="/jobs">Browse jobs</Link><Link href="/register?type=teacher">Create a CV</Link></section>
              <section className="homepage-directory-group"><h3>Employers</h3><Link href="/register?type=school">Post a job</Link><Link href="/help">Help center</Link></section>
              <section className="homepage-directory-group" id="about"><h3>About TeachMatchs</h3><Link href="/company-reviews">Company reviews</Link><Link href="/terms">Terms</Link><Link href="/help">Help</Link><Link href="/privacy-center">Privacy center</Link></section>
            </div>
          </div>
        </section>

        <section className="goals-section" id="goal-videos">
          <div className="goals-content goals-content-simple">
            <p className="eyebrow">A future built one step at a time</p>
            <h2>Build the life you want, one goal at a time.</h2>
            <p className="goals-intro">Choose a goal, find your next step, and build a teaching career that fits the life you want.</p>
            <Link className="button button-dark" href="/register?type=teacher">Register now and get hired <span aria-hidden="true">→</span></Link>
          </div>
        </section>

      </main>

      <footer className="site-footer site-footer-final" id="sign-in" data-reveal="fade-up"><div><Link className="brand footer-brand site-logo-link" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><p>Where teachers meet the schools that need them.</p></div><nav aria-label="Footer navigation"><Link href="/jobs">Find jobs</Link><Link href="/register?type=school">For schools</Link><Link href="/register">Register</Link><Link href="/login">Log in</Link></nav><span className="copyright">© 2026 TeachMatchs · Made for Nigeria</span></footer>
      </div>
    </>
  );
}
