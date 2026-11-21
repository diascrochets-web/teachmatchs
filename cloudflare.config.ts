import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "teachmatchs",
    entrypoint: "./cloudflare-worker.ts",
    domains: ["teachmatchs.com"],
    workersDev: true,
    previewUrls: true,
    compatibilityDate: "2026-11-04",
    compatibilityFlags: ["nodejs_compat"],
    triggers: [triggers.scheduled({ schedule: "0 7 * * *" })],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      RESEND_FROM_EMAIL: bindings.text("TeachMatchs Jobs <jobs@mail.teachmatchs.com>"),
      RESEND_LAUNCH_SEGMENT_ID: bindings.text("8ca8064d-2e51-4998-b8de-0c7c00134f34"),
    },
  }),
});
