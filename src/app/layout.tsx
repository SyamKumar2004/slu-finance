import './globals.css';
import React from 'react';

export const metadata = {
  title: 'SLU Finance | Premium Micro-Credit Ledger Group',
  description: 'Enterprise Automated Ledger Networks and Smart Underwriting.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}