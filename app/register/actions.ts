"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type RegistrationState = {
  error?: string;
  success?: string;
};

export async function registerAccount(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  if (!isSupabaseConfigured()) {
    return { error: "Connect a Supabase project to enable account registration." };
  }

  const accountType = String(formData.get("account_type") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!(["teacher", "school"] as const).includes(accountType as "teacher" | "school")) {
    return { error: "Choose whether you are joining as a teacher or a school." };
  }
  if (!fullName || !email || !state || !city) {
    return { error: "Please complete all required fields." };
  }
  if (password.length < 10) {
    return { error: "Use a password with at least 10 characters." };
  }

  const metadata: Record<string, string | string[]> = {
    account_type: accountType,
    full_name: fullName,
    phone,
    state,
    city,
  };

  if (accountType === "teacher") {
    metadata.qualification = String(formData.get("qualification") ?? "").trim();
    const yearsExperience = Number(formData.get("years_experience") ?? "0");
    if (!Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > 60) {
      return { error: "Choose a valid number of years of teaching experience." };
    }
    metadata.years_experience = String(yearsExperience);
    metadata.subjects = String(formData.get("subjects") ?? "")
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);
  } else {
    metadata.school_name = String(formData.get("school_name") ?? "").trim();
    metadata.school_type = String(formData.get("school_type") ?? "");
    if (
      !metadata.school_name ||
      !["primary", "secondary", "both", "other"].includes(metadata.school_type as string)
    ) {
      return { error: "Add your school name and school type to continue." };
    }
  }

  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: new URL("/auth/callback", origin).toString(),
      },
    });

    if (error) return { error: error.message };
    return { success: "Check your email for a confirmation link to finish creating your account." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "We could not create your account. Please try again.",
    };
  }
}
