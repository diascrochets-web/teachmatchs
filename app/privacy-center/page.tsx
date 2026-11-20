import { InfoPageShell } from "@/components/info-page-shell";

export default function PrivacyCenterPage() {
  return (
    <InfoPageShell title="Privacy center" description="TeachMatchs records anonymous search and listing activity to show the topics, jobs, locations, and schools visitors explore most.">
      <p className="info-page-notice">A random ID is stored in your browser to count repeat visits from the same browser. Search terms and listing names are shown only as aggregated trends when at least two different browsers have used them in the last 30 days. We don’t store email addresses, phone numbers, or account IDs in this trend data. The full privacy policy is still being prepared.</p>
    </InfoPageShell>
  );
}
