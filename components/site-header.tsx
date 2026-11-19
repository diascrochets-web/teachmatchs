import Link from "next/link";
import Image from "next/image";
import { SiteMenu } from "@/components/site-menu";

export function SiteHeader() {
  return (
    <header className="public-site-header">
      <Link className="brand site-logo-link" href="/" aria-label="TeachMatchs home">
        <Image className="site-logo-image" src="/teachmatchs-logo.png" alt="TeachMatchs" width={2206} height={386} priority />
      </Link>
      <SiteMenu />
    </header>
  );
}
