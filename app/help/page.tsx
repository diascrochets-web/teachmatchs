import Link from "next/link";
import { InfoPageShell } from "@/components/info-page-shell";

export default function HelpPage() {
  return (
    <InfoPageShell title="How can we help?" description="Find your next step on TeachMatchs.">
      <div className="info-page-links">
        <Link href="/jobs">Browse teaching jobs <span aria-hidden="true">→</span></Link>
        <Link href="/register?type=teacher">Create a teacher account <span aria-hidden="true">→</span></Link>
        <Link href="/register?type=school">Register a school <span aria-hidden="true">→</span></Link>
        <Link href="/company-reviews">School reviews <span aria-hidden="true">→</span></Link>
      </div>
    </InfoPageShell>
  );
}
