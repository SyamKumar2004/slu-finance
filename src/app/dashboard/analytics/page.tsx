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
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

    const { data: lenderLoans } = await supabase
      .from('live_loans')
      .select('principal_amount, interest_rate, total_collected, status')
      .eq('lender_id', activeLenderUuid);

    let principalSum = 0;
    let expectedInterestSum = 0;
    let collectionsSum = 0;

    (lenderLoans || []).forEach((l: any) => {
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

  if (loading) return <div className="p-8 text-sm font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">Compiling Analytics Data...</div>;

  // Mock array to render the high-fidelity chart interface elements
  const graphicalBars = [
    { label: 'Q1 Launch', height: 'h-24', val: '₹12,400' },
    { label: 'Underwriting', height: 'h-36', val: '₹18,900' },
    { label: 'Active Cycle', height: 'h-48', val: '₹24,100' },
    { label: 'Current Yield', height: 'h-56', val: `₹${analytics.totalYieldCollected.toLocaleString()}` },
  ];

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      
      {/* BALANCED REDUCED PAGE HEADER */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <BarChart3 className="text-emerald-400 h-5 w-5" /> Yield Analytics Workspace
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-bold mt-1">
          Real-time performance metrics tracking, interest profit optimization, and isolated asset utilization matrices.
        </p>
      </div>

      {/* NUMERIC CARDS MATRIX GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#0b132b] border border-slate-800/80 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Deployed Assets</span><h2 className="text-2xl sm:text-3xl font-black text-white mt-1">₹{analytics.totalPrincipalLent.toLocaleString()}</h2></div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500"><DollarSign className="h-5 w-5" /></div>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Interest Yield</span><h2 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">₹{analytics.expectedInterestRevenue.toLocaleString()}</h2></div>
          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400"><TrendingUp className="h-5 w-5" /></div>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div><span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Portfolio Return</span><h2 className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">{analytics.netYieldPercentage}%</h2></div>
          <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/20 text-blue-400"><Percent className="h-5 w-5" /></div>
        </div>
      </div>

      {/* DYNAMIC PROGRESSION GRAPH OVERVIEW */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-xl p-6 shadow-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 text-slate-300">Capital Flow Recovery Progression</h3>
        <div className="grid grid-cols-4 gap-2 items-end border-b border-slate-800 h-64 pt-4 max-w-2xl mx-auto">
          {graphicalBars.map((bar, i) => (
            <div key={i} className="flex flex-col items-center space-y-2 group">
              <span className="text-[10px] font-mono text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{bar.val}</span>
              <div className={`w-full max-w-[48px] ${bar.height} bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg shadow-md transition-all group-hover:brightness-110`} />
              <span className="text-[10px] font-bold text-slate-500 pt-2 block text-center truncate w-full">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}