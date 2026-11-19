"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { registerAccount, type RegistrationState } from "@/app/register/actions";

const initialState: RegistrationState = {};
const states = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

export default function RegisterPage() {
  const [accountType, setAccountType] = useState("teacher");
  const [state, formAction, pending] = useActionState(registerAccount, initialState);

  useEffect(() => {
    const requestedType = new URLSearchParams(window.location.search).get("type");
    if (requestedType === "school" || requestedType === "teacher") setAccountType(requestedType);
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand auth-brand" href="/" aria-label="TeachMatchs home">
          <span className="brand-mark" aria-hidden="true"></span>
          <span>Teach<span className="brand-accent">Matchs</span></span>
        </Link>
        <p className="eyebrow">Join Nigeria&apos;s teaching community</p>
        <h1 className="auth-title">Let&apos;s find your<br />right match.</h1>
        <p className="auth-intro">Create your free account and take the next step in your school or teaching journey.</p>

        <div className="account-choice" role="group" aria-label="Choose account type">
          <button className={accountType === "teacher" ? "choice-card is-selected" : "choice-card"} type="button" onClick={() => setAccountType("teacher")} aria-pressed={accountType === "teacher"}>
            <span className="choice-icon teacher-choice">T</span><span><b>I&apos;m a teacher</b><small>Find teaching jobs</small></span><span className="choice-radio" aria-hidden="true"></span>
          </button>
          <button className={accountType === "school" ? "choice-card is-selected" : "choice-card"} type="button" onClick={() => setAccountType("school")} aria-pressed={accountType === "school"}>
            <span className="choice-icon school-choice">S</span><span><b>I&apos;m a school</b><small>Find great teachers</small></span><span className="choice-radio" aria-hidden="true"></span>
          </button>
        </div>

        <form action={formAction} className="auth-form">
          <input type="hidden" name="account_type" value={accountType} />
          <div className="form-field"><label htmlFor="full_name">{accountType === "school" ? "Contact person" : "Full name"}</label><input id="full_name" name="full_name" autoComplete="name" required placeholder="Your name" /></div>
          {accountType === "school" && <div className="form-field"><label htmlFor="school_name">School name</label><input id="school_name" name="school_name" autoComplete="organization" required placeholder="Your school's name" /></div>}
          <div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></div>
          <div className="form-row">
            <div className="form-field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="080 0000 0000" /></div>
            <div className="form-field"><label htmlFor="state">State</label><select id="state" name="state" required defaultValue=""><option value="" disabled>Select state</option>{states.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label htmlFor="city">City or town</label><input id="city" name="city" required placeholder="e.g. Ikeja" /></div>
            {accountType === "school" ? (
              <div className="form-field"><label htmlFor="school_type">School type</label><select id="school_type" name="school_type" required defaultValue=""><option value="" disabled>Select type</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="both">Primary and secondary</option><option value="other">Other</option></select></div>
            ) : (
              <div className="form-field"><label htmlFor="years_experience">Teaching experience</label><select id="years_experience" name="years_experience" defaultValue="0"><option value="0">New teacher</option><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="5">4–6 years</option><option value="7">7+ years</option></select></div>
            )}
          </div>
          {accountType === "teacher" ? (
            <>
              <div className="form-field"><label htmlFor="subjects">Subjects or class levels <span>(separate with commas)</span></label><input id="subjects" name="subjects" placeholder="Mathematics, JSS, Primary" /></div>
              <div className="form-field"><label htmlFor="qualification">Highest qualification <span>(optional)</span></label><input id="qualification" name="qualification" placeholder="e.g. B.Ed Mathematics" /></div>
            </>
          ) : (
            <p className="verification-note"><span>✓</span> Schools are reviewed before posting jobs. We&apos;ll ask for your school documents after registration.</p>
          )}
          <div className="form-field"><label htmlFor="password">Create password</label><input id="password" type="password" name="password" autoComplete="new-password" minLength={10} required placeholder="At least 10 characters" /></div>

          {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
          {state.success && <p className="form-message form-success" role="status">{state.success}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? "Creating your account…" : "Create my account"}<span aria-hidden="true">→</span></button>
          <p className="form-terms">By joining, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </form>

        <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
      </section>
      <aside className="auth-aside">
        <span className="aside-kicker">TeachMatchs · Nigeria</span>
        <div className="aside-copy"><span className="aside-spark">✳</span><p>Every great classroom starts with the right people.</p><span className="aside-caption">A place for teachers and schools to meet.</span></div>
        <span className="aside-footer">Your next chapter starts here ↗</span>
      </aside>
    </main>
  );
}
