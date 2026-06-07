import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SLU Finance | Premium Micro-Credit Ledger",
  description: "Secure localized ledger profile and capital vault tracking console.",
  icons: {
    icon: "/favicon.ico", // Points directly to your clean new money icon asset folder
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}