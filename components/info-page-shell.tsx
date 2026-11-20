import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export function InfoPageShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="info-page">
      <SiteHeader />
      <section className="info-page-content">
        <p className="eyebrow">TeachMatchs</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        <Link href="/" className="info-page-home">Back to home <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
