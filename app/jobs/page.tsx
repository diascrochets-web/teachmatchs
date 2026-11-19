import { JobSearchResults } from "@/components/job-search-results";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type JobRow = {
  id: string;
  title: string;
  subject: string;
  school_level: string;
  employment_type: string;
  state: string;
  city: string;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  school_profiles: { school_name: string; verification_status: string } | { school_name: string; verification_status: string }[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; location?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = firstParam(params.q);
  const initialLocation = firstParam(params.location);

  if (!isSupabaseConfigured()) {
    return <JobSearchResults jobs={[]} initialQuery={initialQuery} initialLocation={initialLocation} unavailable={false} />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, subject, school_level, employment_type, state, city, salary_min, salary_max, created_at, school_profiles!inner(school_name, verification_status)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  const jobs = ((data ?? []) as unknown as JobRow[]).map((row) => {
    const school = Array.isArray(row.school_profiles) ? row.school_profiles[0] : row.school_profiles;
    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      level: row.school_level,
      employment: row.employment_type,
      city: row.city,
      state: row.state,
      school: school?.school_name ?? "TeachMatchs school",
      verified: school?.verification_status === "approved",
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      createdAt: row.created_at,
    };
  });

  return <JobSearchResults jobs={jobs} initialQuery={initialQuery} initialLocation={initialLocation} unavailable={Boolean(error)} />;
}
