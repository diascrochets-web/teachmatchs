type SyncResult = "synced" | "not-configured" | "failed";

export async function syncWaitlistContact(email: string): Promise<SyncResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_LAUNCH_SEGMENT_ID;
  if (!apiKey || !segmentId) return "not-configured";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const create = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  });

  if (create.ok) return "synced";
  if (create.status !== 409) return "failed";

  const addToSegment = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segmentId)}`,
    { method: "POST", headers },
  );
  return addToSegment.ok ? "synced" : "failed";
}
