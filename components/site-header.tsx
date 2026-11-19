import Link from "next/link";
import { SiteMenu } from "@/components/site-menu";

export function SiteHeader() {
  return (
    <header className="public-site-header">
      <Link className="brand" href="/" aria-label="TeachMatchs home">
        <span className="brand-mark" aria-hidden="true"></span>
        <span>Teach<span className="brand-accent">Matchs</span></span>
      </Link>
      <SiteMenu />
    </header>
  );
}
