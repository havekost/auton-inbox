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
        <header className="border-b border-[var(--border)] px-6 py-4">
          <a href="/" className="text-lg font-bold tracking-tight">
            Auton Inbox
          </a>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
