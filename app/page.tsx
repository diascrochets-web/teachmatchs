"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SiteMenu } from "@/components/site-menu";

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

const journeySteps = [
  { title: "Register", audience: "Both", description: "Create a free account as a teacher or a school. Choose your path and tell us what you need." },
  { title: "Get verified", audience: "Both", description: "Teachers add their TRCN number and certificates. Schools add CAC details or ministry approval." },
  { title: "Build a profile or post a job", audience: "Both", description: "Teachers add their experience, subjects and CV. Schools publish the role they need to fill." },
  { title: "Apply and send your CV", audience: "Teachers", description: "Apply to a role and send the CV from your profile. It is shared with that school only." },
  { title: "Meet on video", audience: "Both", description: "Interview inside TeachMatch from wherever you are. Both sides get notifications about the meeting." },
];

const faqSlides = [
  { question: "Is TeachMatch free to join?", answer: "Yes. Teacher and school accounts are free for now, and you will see the price before paying if we add paid plans later." },
  { question: "Who can see my CV?", answer: "Your CV is shared only with a school when you apply for one of its jobs." },
  { question: "How do verification checks work?", answer: "Teachers add their TRCN number and certificates. Schools provide CAC details or ministry approval for review." },
  { question: "How do video interviews work?", answer: "Interviews happen inside TeachMatch. The teacher and school both receive meeting notifications." },
];

function AnimatedWords({ text }: { text: string }) {
  return (
    <>
      <span className="animated-word-list" data-reveal="words" aria-hidden="true">
        {text.split(" ").map((word, index) => <span className="animated-word" style={{ "--word-index": index } as CSSProperties} key={`${word}-${index}`}>{word}&nbsp;</span>)}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}

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
  const [activeStep, setActiveStep] = useState(1);
  const [activeFaq, setActiveFaq] = useState(0);

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frames = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const updateParallax = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const viewportCenter = window.innerHeight / 2;
        frames.forEach((item) => {
          const bounds = item.getBoundingClientRect();
          const distance = bounds.top + bounds.height / 2 - viewportCenter;
          const strength = Number(item.dataset.parallax) || 0.035;
          const offset = Math.max(-22, Math.min(22, distance * strength));
          item.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
        });
      });
    };

    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    window.addEventListener("resize", updateParallax);
    return () => {
      window.removeEventListener("scroll", updateParallax);
      window.removeEventListener("resize", updateParallax);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let active = true;
    const supabase = createClient();
    void supabase
      .from("jobs")
      .select("id, title, subject, school_level, employment_type, state, city, salary_min, salary_max, created_at, school_profiles!inner(school_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setJobs(((data ?? []) as unknown as PublicJobRow[]).map(mapJob));
      });

    return () => { active = false; };
  }, []);

  const featuredJob = jobs[0];

  return (
    <>
      <div className="home-page-content">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="TeachMatch home"><span className="header-wordmark">TeachMatch</span></Link>
        <SiteMenu />
      </header>

      <main id="top">
        <section className="hero">
          <video className="section-background-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
            <source src="/teachmatch-background.mp4" type="video/mp4" />
          </video>
          <div className="section-video-overlay" aria-hidden="true"></div>
          <div className="hero-copy">
            <p className="eyebrow" data-reveal="fade-up">For teachers ready for what&apos;s next</p>
            <h1 aria-label="Your next classroom is waiting. Take the first step today."><AnimatedWords text="Your next classroom is waiting. Take the first step today." /></h1>
            <p className="hero-intro" data-reveal="fade-up">Build one profile, apply to jobs, send your CV and meet on video, all in one place.</p>
            <div className="hero-actions" data-reveal="fade-up">
              <Link className="button button-dark" href="/register?type=teacher">Start for free <span aria-hidden="true">→</span></Link>
              <Link className="button hero-waitlist-button" href="/register?type=teacher&source=waitlist">Join waitlist</Link>
            </div>
          </div>
        </section>

        <section className="goals-section" id="goal-videos">
          <video className="section-background-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
            <source src="/life-goals-background.mp4" type="video/mp4" />
          </video>
          <div className="section-video-overlay goals-video-overlay" aria-hidden="true"></div>
          <div className="goals-content goals-content-simple">
            <p className="eyebrow" data-reveal="fade-up">A future built one step at a time</p>
            <h2 aria-label="Build the life you want, one goal at a time."><AnimatedWords text="Build the life you want, one goal at a time." /></h2>
            <p className="goals-intro" data-reveal="fade-up">Choose a goal, find your next step, and build a teaching career that fits the life you want.</p>
            <Link className="button button-dark" data-reveal="fade-up" href="/register?type=teacher">Register for free <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="how-section section-shell" id="how-it-works">
          <div className="section-heading-row">
            <div data-reveal="fade-up"><p className="eyebrow">Section 3 · How it works</p><h2 aria-label="Every step, in one place"><AnimatedWords text="Every step, in one place" /></h2><p className="section-intro">From first account to first interview.</p></div>
            <Link className="button button-dark" href="/register">Register for free <span aria-hidden="true">→</span></Link>
          </div>
          <div className="how-layout">
            <div className="journey-column">
              <div className="journey-progress" role="progressbar" aria-label="Getting started progress" aria-valuemin={1} aria-valuemax={journeySteps.length} aria-valuenow={activeStep}>
                <span style={{ width: `${(activeStep / journeySteps.length) * 100}%` }}></span>
              </div>
              <p className="progress-caption">Step {activeStep} of {journeySteps.length}</p>
              <ol className="journey-list">
                {journeySteps.map((step, index) => {
                  const stepNumber = index + 1;
                  return (
                    <li className={`journey-step${activeStep === stepNumber ? " is-active" : ""}`} data-reveal="step" key={step.title}>
                      <button type="button" className="journey-step-select" onClick={() => setActiveStep(stepNumber)} aria-current={activeStep === stepNumber ? "step" : undefined}>
                        <span className="journey-number">{stepNumber}</span>
                        <span className="journey-title">{step.title}</span>
                        <span className="journey-audience">{step.audience}</span>
                      </button>
                      <p>{step.description}</p>
                    </li>
                  );
                })}
              </ol>
              <button className="text-action" type="button" onClick={() => setActiveStep((step) => Math.min(step + 1, journeySteps.length))} disabled={activeStep === journeySteps.length}>Next step <span aria-hidden="true">→</span></button>
            </div>
            <figure className="section-photo how-photo" data-reveal="photo-right" data-parallax="0.045">
              <Image src="/images/how-it-works.jpg" alt="TeachMatch shown on a phone" fill sizes="(max-width: 760px) 100vw, 42vw" style={{ objectFit: "cover" }} />
              <figcaption>A clear path from profile to first interview.</figcaption>
            </figure>
          </div>
        </section>

        <section className="hiring-section" id="jobs">
          <div className="section-shell">
            <header className="section-heading-row">
              <div data-reveal="fade-up"><p className="eyebrow">Section 4 · Get hired faster</p><h2 aria-label="Find a job. Apply in one tap."><AnimatedWords text="Find a job. Apply in one tap." /></h2></div>
              <Link className="button button-dark" href="/jobs">See open jobs <span aria-hidden="true">→</span></Link>
            </header>
            <div className="hiring-layout">
              <div className="hiring-benefits">
                <article data-reveal="card"><span>01</span><div><h3>Quick apply</h3><p>Your profile and CV are ready when the right role appears.</p></div></article>
                <article data-reveal="card"><span>02</span><div><h3>Job alerts</h3><p>Get notified when a job matches your subject and level.</p></div></article>
                <article data-reveal="card"><span>03</span><div><h3>Verified schools</h3><p>Filter your search to see schools that have been checked.</p></div></article>
                <article data-reveal="card"><span>04</span><div><h3>Video interviews</h3><p>Meet schools from home, right inside TeachMatch.</p></div></article>
              </div>
              <div className="hiring-visuals">
                <figure className="section-photo hiring-photo" data-reveal="photo-zoom" data-parallax="0.04">
                  <Image src="/images/getting-hired.jpg" alt="A teacher speaking with a school representative" fill sizes="(max-width: 760px) 100vw, 40vw" style={{ objectFit: "cover" }} />
                </figure>
                <figure className="section-photo video-meeting-photo" data-reveal="photo-left" data-parallax="0.055">
                  <Image src="/images/video-meetings.jpg" alt="A teacher in a video meeting on a phone" fill sizes="180px" style={{ objectFit: "cover" }} />
                  <figcaption>Meet from wherever you are.</figcaption>
                </figure>
                <article className="sample-job-card" data-reveal="card">
                  <div className="sample-job-heading"><span>Sample role</span><span className="sample-verified">Verified school</span></div>
                  <h3>{featuredJob?.title ?? "Primary Mathematics Teacher"}</h3>
                  <p>{featuredJob ? `${featuredJob.school} · ${featuredJob.location}` : "Example school · Lagos, Nigeria"}</p>
                  <div className="sample-job-tags"><span>{featuredJob?.tags[0] ?? "Primary"}</span><span>{featuredJob?.tags[1] ?? "Full time"}</span></div>
                  <div className="sample-job-bottom"><span>{featuredJob?.salary ?? "Salary discussed"}</span><Link href={featuredJob ? `/jobs/${featuredJob.id}` : "/jobs"}>View role <span aria-hidden="true">→</span></Link></div>
                </article>
              </div>
            </div>
            <div className="next-steps-line" data-reveal="line"><strong>What happens next</strong><span>Apply</span><i>→</i><span>The school reviews</span><i>→</i><span>Interview</span><i>→</i><span>Offer</span></div>
            <div className="section-actions" data-reveal="fade-up"><Link className="button button-dark" href="/jobs">See open jobs</Link><Link className="button button-light" href="/register?type=teacher&source=job-alerts">Set up job alerts</Link></div>
          </div>
        </section>

        <section className="education-section section-shell" id="teaching-matters">
          <header className="education-heading" data-reveal="fade-up"><p className="eyebrow">Section 5 · Education</p><h2 aria-label="Every great career starts in a classroom."><AnimatedWords text="Every great career starts in a classroom." /></h2><p>Teaching gives young people knowledge, confidence and the chance to imagine a bigger future. The right teacher can make that future feel possible.</p></header>
          <div className="education-layout">
            <div className="education-values">
              <article data-reveal="card"><span>01</span><div><h3>Teachers shape futures</h3><p>Every lesson can help a student see what they are capable of. A patient teacher can change how a young person sees themselves.</p></div></article>
              <article data-reveal="card"><span>02</span><div><h3>Good schools need good teachers</h3><p>Great learning grows from people who care about their students. Schools thrive when teachers have the support to do their best work.</p></div></article>
              <article data-reveal="card"><span>03</span><div><h3>Education opens doors</h3><p>Strong foundations give students more choices as they grow. Teachers help turn curiosity into skills they can carry for life.</p></div></article>
              <article data-reveal="card"><span>04</span><div><h3>The right match helps every student</h3><p>Teachers do their best work where their strengths are valued. Finding the right school helps students and teachers move forward together.</p></div></article>
            </div>
            <figure className="section-photo education-photo" data-reveal="photo-left" data-parallax="0.04">
              <Image src="/images/teaching-matters.jpg" alt="A teacher planning a lesson at a classroom board" fill sizes="(max-width: 760px) 100vw, 44vw" style={{ objectFit: "cover" }} />
            </figure>
          </div>
          <div className="education-closing" data-reveal="fade-up"><p>Help a school find you, or help a student find their teacher.</p><Link className="button button-dark" href="/register">Register for free <span aria-hidden="true">→</span></Link></div>
        </section>

        <section className="payment-section" id="payment">
          <div className="section-shell payment-layout">
            <div className="payment-copy"><p className="eyebrow" data-reveal="fade-up">Section 6 · Payment</p><h2 aria-label="Free to join. No hidden fees."><AnimatedWords text="Free to join. No hidden fees." /></h2><p data-reveal="fade-up">Start building your next step without a joining fee.</p>
              <div className="payment-cards">
                <article className="payment-card" data-reveal="card"><span className="payment-audience">For teachers</span><h3>Free</h3><ul><li>Create a profile</li><li>Apply to jobs</li><li>Send your CV</li><li>Video interviews</li></ul><Link href="/register?type=teacher">Join as a teacher <span aria-hidden="true">→</span></Link></article>
                <article className="payment-card" data-reveal="card"><span className="payment-audience">For schools</span><h3>Free for now</h3><ul><li>Register your school</li><li>Post jobs</li><li>Review applicants</li><li>Video interviews</li></ul><Link href="/register?type=school">Join as a school <span aria-hidden="true">→</span></Link></article>
              </div>
              <p className="payment-note">If we add paid plans later, you will see the price before you pay.</p>
              <p className="future-price">Future plan placeholder: <strong>[YOUR PRICE]</strong></p>
              <p className="salary-confirm">[CONFIRM: salaries are agreed directly between school and teacher]</p>
            </div>
            <figure className="section-photo payment-photo" data-reveal="photo-zoom" data-parallax="0.035"><Image src="/images/payment.jpg" alt="An hourglass representing time and planning for the future" fill sizes="(max-width: 760px) 100vw, 34vw" style={{ objectFit: "cover", objectPosition: "center 58%" }} /></figure>
          </div>
        </section>

        <section className="faq-section section-shell" id="faq">
          <header className="faq-heading" data-reveal="fade-up"><p className="eyebrow">Section 7 · Frequently asked questions</p><h2 aria-label="Good to know before you begin."><AnimatedWords text="Good to know before you begin." /></h2><p>Quick answers to the things teachers and schools ask most.</p></header>
          <div className="faq-slideshow" aria-live="polite" data-reveal="faq">
            <span className="faq-slide-count">{String(activeFaq + 1).padStart(2, "0")} / {String(faqSlides.length).padStart(2, "0")}</span>
            <h3>{faqSlides[activeFaq].question}</h3><p>{faqSlides[activeFaq].answer}</p>
            <div className="faq-controls"><button type="button" onClick={() => setActiveFaq((index) => (index - 1 + faqSlides.length) % faqSlides.length)} aria-label="Previous question">←</button><div className="faq-dots" aria-label="Choose a question">{faqSlides.map((faq, index) => <button type="button" key={faq.question} className={activeFaq === index ? "is-active" : ""} onClick={() => setActiveFaq(index)} aria-label={`Show question ${index + 1}`} aria-pressed={activeFaq === index}></button>)}</div><button type="button" onClick={() => setActiveFaq((index) => (index + 1) % faqSlides.length)} aria-label="Next question">→</button></div>
          </div>
        </section>
      </main>

      <footer className="site-footer site-footer-final" id="sign-in" data-reveal="fade-up"><div><Link className="brand footer-brand" href="/" aria-label="TeachMatch home"><span>TeachMatch</span></Link><p>Where teachers meet the schools that need them.</p></div><nav aria-label="Footer navigation"><Link href="/jobs">Find jobs</Link><Link href="/register?type=school">For schools</Link><Link href="#how-it-works">How it works</Link><Link href="#faq">FAQs</Link><Link href="/login">Log in</Link></nav><span className="copyright">© 2026 TeachMatch · Made for Nigeria</span></footer>
      </div>
    </>
  );
}
