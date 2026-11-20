"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const launchAt = new Date("2027-05-01T00:00:00+01:00").getTime();

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(): TimeLeft {
  const remaining = Math.max(0, launchAt - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1_000),
  };
}

const units: Array<{ key: keyof TimeLeft; label: string }> = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

export function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="launch-countdown" aria-label="Countdown to launch">
      {units.map(({ key, label }) => (
        <div className="launch-countdown-unit" key={key}>
          <span className="launch-countdown-value" aria-live={key === "seconds" ? "off" : undefined}>
            {timeLeft ? String(timeLeft[key]).padStart(2, "0") : "--"}
          </span>
          <span className="launch-countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function LaunchWaitlistForm() {
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          website: formData.get("website"),
        }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setStatus(result.error ?? "Please check your email and try again.");
        return;
      }

      form.reset();
      setStatus("You’re on the list. See you at launch.");
    } catch {
      setStatus("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="launch-waitlist-wrap">
      <p className="launch-waitlist-title">Get a launch reminder</p>
      <form className="launch-waitlist-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="launch-email">Your email address</label>
        <input
          id="launch-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          required
        />
        <label className="launch-honeypot" aria-hidden="true">
          Leave this field empty
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Joining…" : "Join waitlist"}
        </button>
      </form>
      <p className="launch-waitlist-note" aria-live="polite">
        {status || "One email when we launch. No spam."}
      </p>
    </div>
  );
}
