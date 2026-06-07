import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
      <Link href="/" className="flex items-center gap-2 text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
        <ShieldCheck className="text-emerald-400 h-6 w-6" /> SLU FINANCE
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/auth/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Sign In</Link>
        <Link href="/auth/signup" className="text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/10">Get Started</Link>
      </div>
    </nav>
  );
}