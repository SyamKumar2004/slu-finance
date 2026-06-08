'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart3, TrendingUp, DollarSign, Activity, Percent, Clock, Check, Smartphone } from 'lucide-react';

export default function YieldAnalyticsDesk() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalPrincipalLent: 0,
    expectedInterestRevenue: 0,
    grossContractDebt: 0,
    totalYieldCollected: 0,
    outstandingReceivables: 0,
    netYieldPercentage: 0
  });

  const generateIsolatedAnalytics = useCallback(async () => {
    // Read the active operating lender's ID directly from local session storage
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

    // Fetch ONLY loan lines belonging to this explicitly logged-in lender account identity
    const { data: lenderLoans, error } = await supabase
      .from('live_loans')
      .select('principal_amount, interest_rate, total_collected, status')
      .eq('lender_id', activeLenderUuid);

    if (error) {
      console.error("Analytics extraction error:", error.message);
      setLoading(false);
      return;
    }

    let principalSum = 0;
    let expectedInterestSum = 0;
    let collectionsSum = 0;

    (lenderLoans || []).forEach((l: any) => {
      // Perform corporate business math tracking against Active and Closed account states
      if (l.status === 'Active' || l.status === 'Closed') {
        const p = Number(l.principal_amount || 0);
        const r = Number(l.interest_rate || 0);
        const c = Number(l.total_collected || 0);
        const computedInterest = p * (r / 100);

        principalSum += p;
        expectedInterestSum += computedInterest;
        collectionsSum += c;
      }
    });

    const grossDebt = principalSum + expectedInterestSum;
    const remainingReceivables = Math.max(0, grossDebt - collectionsSum);
    const profitPercentage = principalSum > 0 ? (expectedInterestSum / principalSum) * 100 : 0;

    setAnalytics({
      totalPrincipalLent: principalSum,
      expectedInterestRevenue: expectedInterestSum,
      grossContractDebt: grossDebt,
      totalYieldCollected: collectionsSum,
      outstandingReceivables: remainingReceivables,
      netYieldPercentage: parseFloat(profitPercentage.toFixed(1))
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    generateIsolatedAnalytics();
  }, [generateIsolatedAnalytics]);

  if (loading) {
    return (
      <div className="p-8 text-sm font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">
        Compiling Isolated Analytics Matrix...
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto px-2">
      
      {/* HEADER COMPONENT COMPARTMENT BLOCK */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-7 shadow-xl">
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          <BarChart3 className="text-emerald-400 h-6 w-6" /> Yield Analytics Workspace
        </h2>
        <p className="text-sm text-slate-400 font-bold mt-1.5">
          Real-time performance metrics tracking, interest profit optimization, and isolated asset utilization matrices.
        </p>
      </div>

      {/* ENLARGED TYPOGRAPHY STATS PANELS GRID (+2PX/+3PX SCALE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* TOTAL PRINCIPAL CARD */}
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Deployed Assets</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">₹{analytics.totalPrincipalLent.toLocaleString()}</h2>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-500 shrink-0">
            <DollarSign className="h-7 w-7" />
          </div>
        </div>

        {/* INTEREST REVENUE YIELD CARD */}
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Contractual Interest Yield</span>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">₹{analytics.expectedInterestRevenue.toLocaleString()}</h2>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 shrink-0">
            <TrendingUp className="h-7 w-7" />
          </div>
        </div>

        {/* NET REVENUE RATIO RETURN CARD */}
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Average Portfolio Return</span>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-400 mt-1">{analytics.netYieldPercentage}%</h2>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400 shrink-0">
            <Percent className="h-7 w-7" />
          </div>
        </div>

        {/* GROSS UNDERWRITTEN BOOK CARD */}
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Gross Underwritten Debt</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white text-opacity-90 mt-1">₹{analytics.grossContractDebt.toLocaleString()}</h2>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 p-3 border border-slate-800/60 text-slate-500 shrink-0">
            <Activity className="h-7 w-7" />
          </div>
        </div>

        {/* CASH RECEIPTS RECOVERED CARD */}
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Yield Capital Collected</span>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">₹{analytics.totalYieldCollected.toLocaleString()}</h2>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 shrink-0">
            <Check className="h-7 w-7 stroke-[3]" />
          </div>
        </div>

        {/* OUTSTANDING EXPOSURE RECEIVABLES CARD */}
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Outstanding Receivables</span>
            <h2 className="text-3xl sm:text-4xl font-black text-rose-400 mt-1">₹{analytics.outstandingReceivables.toLocaleString()}</h2>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 shrink-0">
            <Clock className="h-7 w-7" />
          </div>
        </div>

      </div>

    </div>
  );
}