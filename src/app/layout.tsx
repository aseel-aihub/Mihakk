import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Mihakk: test and protect AI agents that read files",
  description: "Mihakk tests an AI file-reading agent, limits it with a task contract, then re-evaluates to show the difference.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <a href="#main" className="skip-link">Skip to main content</a>
        <SiteHeader />
        <main id="main" className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-sm text-steel">
          Mihakk is a working-name MVP. All documents, people and companies in the demo are fictional.
        </footer>
      </body>
    </html>
  );
}
