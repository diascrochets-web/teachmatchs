import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { SiteMenu } from "@/components/site-menu";

export function SiteHeader() {
  return (
    <header className="public-site-header">
      <Link className="brand site-logo-link" href="/" aria-label="TeachMatchs home">
        <BrandWordmark />
      </Link>
      <SiteMenu />
    </header>
  );
}
