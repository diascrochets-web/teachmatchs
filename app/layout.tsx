import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeachMatch — Find your place to teach",
  description:
    "Find teaching jobs across Nigeria or meet the teachers your school needs with TeachMatch.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
