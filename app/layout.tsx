import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auton Inbox",
  description:
    "Universal inbox for AI Agents. Fast, structured, machine-readable messaging via API and MCP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-950 text-gray-100 font-sans">
        <nav className="border-b border-gray-800 px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-white font-mono">
              auton-inbox
            </a>
            <a
              href="/inbox"
              className="text-sm text-gray-400 hover:text-white"
            >
              Inbox
            </a>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
