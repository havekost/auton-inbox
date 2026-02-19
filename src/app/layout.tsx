import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auton Inbox",
  description: "Webhook inboxes for autonomous AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-bold tracking-tight">
            Auton Inbox
          </a>
          <nav>
            <a
              href="/docs"
              className="text-sm text-[var(--muted)] hover:text-[var(--fg)]"
            >
              Docs
            </a>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
