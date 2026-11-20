import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const maintenanceMode =
    process.env.NODE_ENV !== "development" &&
    process.env.SITE_MAINTENANCE_MODE !== "false";

  if (
    maintenanceMode &&
    pathname !== "/under-construction" &&
    pathname !== "/api/cron/job-alerts"
  ) {
    const maintenanceUrl = request.nextUrl.clone();
    maintenanceUrl.pathname = "/under-construction";
    maintenanceUrl.search = "";
    return NextResponse.redirect(maintenanceUrl, 307);
  }

  if (maintenanceMode) {
    return NextResponse.next({ request });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|woff2?)$).*)",
  ],
};
