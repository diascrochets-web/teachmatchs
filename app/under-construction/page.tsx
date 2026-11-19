import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TeachMatchs — Coming soon",
  description: "TeachMatchs is getting ready to connect teachers with schools across Nigeria.",
};

export default function UnderConstructionPage() {
  return (
    <main className="construction-page">
      <header className="construction-header">
        <Link className="brand" href="/" aria-label="TeachMatchs home">
          <span className="brand-mark" aria-hidden="true"></span>
          <span>Teach<span className="brand-accent">Matchs</span></span>
        </Link>
        <span className="construction-status" role="status"><span aria-hidden="true"></span>Website under construction</span>
      </header>
      <section className="construction-hero" aria-labelledby="construction-title">
        <div className="construction-copy">
          <p className="construction-eyebrow"><span aria-hidden="true">✦</span> Coming soon · Nigeria</p>
          <h1 id="construction-title">Good teachers.<br /><span>Great schools.</span><br />One match away.</h1>
          <p className="construction-message">We’re building TeachMatchs to help teachers find the right schools and help schools meet the teachers they need.</p>
          <div className="construction-audience" aria-label="Made for teachers and schools"><span>For teachers</span><span>For schools</span></div>
        </div>
        <div className="construction-art" aria-hidden="true">
          <div className="construction-orbit construction-orbit-one"></div><div className="construction-orbit construction-orbit-two"></div>
          <div className="construction-card"><div className="construction-card-logo"><span className="brand-mark"></span></div><div className="construction-card-lines"><span></span><span></span></div><div className="construction-card-banner"></div><div className="construction-card-footer"><span></span><span></span><i></i></div></div>
          <span className="construction-spark construction-spark-one">✦</span><span className="construction-spark construction-spark-two">✳</span><div className="construction-note"><span>✦</span>A better way to meet</div>
        </div>
      </section>
      <footer className="construction-footer"><span>Teach<span className="brand-accent">Matchs</span></span><span>Where teachers meet the schools that need them.</span><span>Made for Nigeria</span></footer>
    </main>
  );
}
