"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="auth-shell auth-login-shell">
      <section className="auth-panel auth-login-panel">
        <Link className="brand auth-brand" href="/" aria-label="TeachMatchs home">
          <span className="brand-mark" aria-hidden="true"></span>
          <span>Teach<span className="brand-accent">Matchs</span></span>
        </Link>
        <p className="eyebrow">Welcome back</p>
        <h1 className="auth-title">Good to have<br />you back.</h1>
        <p className="auth-intro">Log in to see your applications, interviews and offers.</p>

        <form action={formAction} className="auth-form">
          <div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></div>
          <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" name="password" autoComplete="current-password" required placeholder="Your password" /></div>
          {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? "Logging in…" : "Log in"}<span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New to TeachMatchs? <Link href="/register">Create an account</Link></p>
        <Link className="back-home" href="/">← Back to TeachMatchs</Link>
      </section>
      <aside className="auth-aside">
        <span className="aside-kicker">TeachMatchs · Nigeria</span>
        <div className="aside-copy"><span className="aside-spark">✳</span><p>Find a place where your work makes a difference.</p><span className="aside-caption">A good school or a great teacher is one match away.</span></div>
        <span className="aside-footer">Your next chapter starts here ↗</span>
      </aside>
    </main>
  );
}
