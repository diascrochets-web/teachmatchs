import type { Metadata } from "next";
import { BrandWordmark } from "@/components/brand-wordmark";
import { LaunchCountdown, LaunchWaitlistForm } from "@/components/launch-waitlist";

export const metadata: Metadata = {
  title: "TeachMatchs — Launching soon",
  description: "Join the TeachMatchs launch waitlist. We launch May 1, 2027.",
};

export default function UnderConstructionPage() {
  return (
    <main className="launch-page">
      <video className="launch-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/hero-section.mp4" type="video/mp4" />
      </video>
      <div className="launch-scrim" aria-hidden="true" />

      <header className="launch-header">
        <span className="launch-brand" aria-label="TeachMatchs">
          <BrandWordmark />
        </span>
        <span className="launch-header-note">TEACHERS <i aria-hidden="true">×</i> SCHOOLS</span>
      </header>

      <section className="launch-content" aria-labelledby="launch-title">
        <p className="launch-kicker"><span aria-hidden="true" /> Launching May 1, 2027</p>
        <h1 id="launch-title">Launching<br />soon.</h1>
        <p className="launch-description">Your next classroom is on the way.</p>
        <LaunchCountdown />
        <LaunchWaitlistForm />
      </section>

      <footer className="launch-footer">
        <span>TeachMatchs</span>
        <span>Made for teachers and schools in Nigeria</span>
      </footer>
    </main>
  );
}
