"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const acceptedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function ResumeUploadForm({ currentFilename }: { currentFilename?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(formData: FormData) {
    const file = formData.get("resume");
    if (!(file instanceof File) || file.size === 0) return setMessage("Choose a CV file to upload.");
    if (!acceptedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) return setMessage("Use a PDF or Word document up to 10 MB.");
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;
    if (userError || !user) { setBusy(false); return setMessage("Sign in again to upload your CV."); }
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${user.id}/resume.${extension}`;
    const { error: uploadError } = await supabase.storage.from("teacher-cvs").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { setBusy(false); return setMessage("We couldn’t upload that file. Please try again."); }
    const { error: saveError } = await supabase.from("teacher_resumes").upsert({
      teacher_id: user.id,
      object_path: path,
      original_filename: file.name.slice(0, 255),
      mime_type: file.type,
      file_size: file.size,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (saveError) return setMessage("The file uploaded, but we couldn’t save its details. Try uploading again.");
    setMessage("CV saved. Schools you apply to can view it securely.");
    window.location.reload();
  }

  return <form action={upload} className="feature-form resume-upload-form">
    <label className="form-field" htmlFor="resume-file"><span>CV file</span><input id="resume-file" name="resume" type="file" accept=".pdf,.doc,.docx" required /></label>
    <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Uploading…" : currentFilename ? "Replace CV" : "Upload CV"}</button>
    {currentFilename && <p className="feature-muted">Current file: {currentFilename}</p>}
    {message && <p className="form-message" role="status">{message}</p>}
    <small>PDF or Word document, up to 10 MB. Only you and schools you apply to can access it.</small>
  </form>;
}
