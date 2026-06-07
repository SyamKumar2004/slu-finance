import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { LineChart, Shield, Zap, ArrowRight, Layers } from 'lucide-react';

export default function InstitutionalLanding() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-900/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
          <Layers className="h-3.5 w-3.5" /> Next-Generation Ledger Framework
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-none">
          Automated Capital Allocation & <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Risk Operations</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mb-10 font-medium">
          SLU Finance delivers automated ledger infrastructure for credit risk parsing, self-service client interfaces, and real-time capital deployment analytics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-24">
          <Link href="/auth/signup" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20 text-base">
            Initialize Active Profile <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/auth/login" className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold px-8 py-4 rounded-xl transition-all text-base">
            Access Portal Dashboard
          </Link>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4"><Shield /></div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Underwriting</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Enforce strict risk management thresholds with dynamic parameter validation during customer onboarding.</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4"><LineChart /></div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Aggregations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Track metrics across the system instantly, including active outflows, yields, and cash allocations.</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit mb-4"><Zap /></div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Channel Alerts</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Keep users informed with automated payment collection alerts sent through integrated SMS and WhatsApp triggers.</p>
          </div>
        </section>
      </main>
    </div>
  );
}