import './globals.css'; // Make sure this exact path matches where your globals.css is stored
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SLU Finance | Premium Micro-Credit Ledger",
  description: "Secure localized ledger profile and capital vault tracking console.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50 antialiased">{children}</body>
    </html>
  );
}