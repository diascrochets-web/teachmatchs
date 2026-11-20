"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BrandWordmark } from "@/components/brand-wordmark";
import { recordActivity } from "@/lib/search-activity";

type Job = {
  id: string;
  title: string;
  subject: string;
  level: string;
  employment: string;
  city: string;
  state: string;
  school: string;
  verified: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
};

type Props = {
  jobs: Job[];
  initialQuery: string;
  initialLocation: string;
  unavailable: boolean;
};

function salaryLabel(min: number | null, max: number | null) {
  const short = (amount: number) => `₦${Math.round(amount / 1000)}k`;
  if (min !== null && max !== null) return `${short(min)}–${short(max)} / month`;
  if (min !== null) return `From ${short(min)} / month`;
  if (max !== null) return `Up to ${short(max)} / month`;
  return "Salary not listed";
}

function postedLabel(date: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

export function JobSearchResults({ jobs, initialQuery, initialLocation, unavailable }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [sort, setSort] = useState("recent");
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [salaryFloor, setSalaryFloor] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (initialQuery) void recordActivity("search", initialQuery);
    if (initialLocation) void recordActivity("location", initialLocation);
  }, [initialLocation, initialQuery]);

  function trackJobClick(job: Job) {
    void recordActivity("job", job.title);
    void recordActivity("school", job.school);
  }

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();
    const matches = jobs.filter((job) => {
      const searchText = `${job.title} ${job.subject} ${job.school}`.toLowerCase();
      const place = `${job.city} ${job.state}`.toLowerCase();
      const salary = job.salaryMax ?? job.salaryMin ?? 0;
      return (!normalizedQuery || searchText.includes(normalizedQuery))
        && (!normalizedLocation || place.includes(normalizedLocation))
        && (!employmentTypes.length || employmentTypes.includes(job.employment))
        && (!levels.length || levels.includes(job.level))
        && (!locations.length || locations.some((item) => place.includes(item.toLowerCase())))
        && (!salaryFloor || salary >= 200000);
    });
    if (sort === "salary") matches.sort((a, b) => (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0));
    if (sort === "oldest") matches.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return matches;
  }, [employmentTypes, jobs, levels, location, locations, query, salaryFloor, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const visibleJobs = filteredJobs.slice((page - 1) * pageSize, page * pageSize);

  function toggleValue(values: string[], setValues: (value: string[]) => void, value: string) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    setPage(1);
  }

  function clearFilters() {
    setEmploymentTypes([]);
    setLevels([]);
    setLocations([]);
    setSalaryFloor(false);
    setPage(1);
  }

  return (
    <main className="job-search-page">
      <SiteHeader />
      <section className="job-search-hero">
        <div className="job-search-hero-inner">
          <h1>Find teaching jobs in Nigeria</h1>
          <p>Search by subject, school level, or location.</p>
          <form className="results-search-form" action="/jobs" method="get">
            <label><span className="sr-only">Subject or job title</span><input name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Subject or job title" /></label>
            <label><span className="sr-only">State or city</span><input name="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="State or city" /></label>
            <button className="button button-primary" type="submit">Search jobs</button>
          </form>
        </div>
      </section>

      <section className="job-results-layout" aria-label="Teaching job search results">
        <aside className={`job-filters${filtersOpen ? " is-open" : ""}`}>
          <div className="job-filters-heading"><h2>Filters</h2><button type="button" onClick={clearFilters}>Clear all</button></div>
          <fieldset><legend>Employment type</legend>{[["full-time", "Full-time"], ["part-time", "Part-time"], ["contract", "Contract"]].map(([value, label]) => <label className="filter-option" key={value}><input type="checkbox" checked={employmentTypes.includes(value)} onChange={() => toggleValue(employmentTypes, setEmploymentTypes, value)} />{label}</label>)}</fieldset>
          <fieldset><legend>School level</legend>{[["primary", "Primary"], ["secondary", "Secondary"], ["both", "Primary & secondary"]].map(([value, label]) => <label className="filter-option" key={value}><input type="checkbox" checked={levels.includes(value)} onChange={() => toggleValue(levels, setLevels, value)} />{label}</label>)}</fieldset>
          <fieldset><legend>Location</legend>{["Lagos", "Abuja"].map((value) => <label className="filter-option" key={value}><input type="checkbox" checked={locations.includes(value)} onChange={() => toggleValue(locations, setLocations, value)} />{value}</label>)}</fieldset>
          <fieldset><legend>Monthly salary</legend><label className="filter-option"><input type="checkbox" checked={salaryFloor} onChange={(event) => { setSalaryFloor(event.target.checked); setPage(1); }} />₦200,000 and above</label></fieldset>
        </aside>

        <div className="job-results-main">
          <div className="job-results-toolbar">
            <button className="mobile-filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>☷ <span>Filters</span></button>
            <p>Teaching roles matching your search <span>({filteredJobs.length})</span></p>
            <label className="job-results-sort">Sort: <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Most recent</option><option value="salary">Highest salary</option><option value="oldest">Oldest</option></select></label>
          </div>
          {visibleJobs.length ? <div className="job-results-list">{visibleJobs.map((job) => <article className="job-result-card" key={job.id}>
            <div className="job-result-meta"><span className="job-result-school">{job.school}{job.verified && <span className="verified-label"> · Verified</span>}</span><span className="job-result-posted">{postedLabel(job.createdAt)}</span></div>
            <h2><Link href={`/jobs/${job.id}`} onClick={() => trackJobClick(job)}>{job.title}</Link></h2>
            <p className="job-result-details">{job.city}, {job.state} · {job.level === "both" ? "Primary & secondary" : job.level} · {job.employment.replace("-", " ")}</p>
            <div className="job-result-bottom"><strong>{salaryLabel(job.salaryMin, job.salaryMax)}</strong><Link href={`/jobs/${job.id}`} onClick={() => trackJobClick(job)}>View details <span aria-hidden="true">→</span></Link></div>
          </article>)}</div> : <div className="job-results-empty"><h2>{unavailable ? "We couldn’t load open roles" : "No roles match those filters yet"}</h2><p>{unavailable ? "Please try again in a moment." : "Try another subject or location, or clear your filters to see more teaching jobs."}</p>{!unavailable && <button className="button button-primary" type="button" onClick={() => { setQuery(""); setLocation(""); clearFilters(); }}>Clear search and filters</button>}</div>}
          {pageCount > 1 && <nav className="job-pagination" aria-label="Job result pages"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => <button type="button" key={number} className={number === page ? "is-active" : ""} aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}{pageCount > 5 && <span>…</span>}<button type="button" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next ›</button></nav>}
        </div>
      </section>
      <footer className="site-footer job-search-footer"><Link className="brand footer-brand" href="/" aria-label="TeachMatchs home"><BrandWordmark /></Link><p>Where teachers meet the schools that need them.</p><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/register?type=school">For schools</Link><Link href="/login">Log in</Link></nav></footer>
    </main>
  );
}
