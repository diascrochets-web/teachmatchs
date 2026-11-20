import appWorker from "vinext/server/fetch-handler";

interface AlertEnvironment {
  JOB_ALERTS_CRON_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

const appFetch = (appWorker as unknown as {
  fetch(request: Request, env: AlertEnvironment, context: WorkerExecutionContext): Response | Promise<Response>;
}).fetch;

export default {
  fetch(request: Request, env: AlertEnvironment, context: WorkerExecutionContext) {
    return appFetch(request, env, context);
  },

  async scheduled(controller: ScheduledController, env: AlertEnvironment) {
    const secret = env.JOB_ALERTS_CRON_SECRET;
    if (!secret) throw new Error("JOB_ALERTS_CRON_SECRET is missing from the Worker environment.");

    const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "https://teachmatchs.com").replace(/\/$/, "");
    const response = await fetch(`${siteUrl}/api/cron/job-alerts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const result = await response.text();

    if (!response.ok) {
      console.error("Scheduled job alert run failed.", { cron: controller.cron, status: response.status, result: result.slice(0, 300) });
      throw new Error(`Scheduled job alert run returned HTTP ${response.status}.`);
    }

    console.log("Scheduled job alert run completed.", { cron: controller.cron, result: result.slice(0, 300) });
  },
};
