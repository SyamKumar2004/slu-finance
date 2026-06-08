'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart3, TrendingUp, DollarSign, Percent, Smartphone } from 'lucide-react';

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

  const [chartData, setChartData] = useState([
    { label: 'Principal Deployed', value: 0 },
    { label: 'Expected Revenue', value: 0 },
    { label: 'Yield Collected', value: 0 },
    { label: 'Outstanding Receivables', value: 0 }
  ]);

  const generateIsolatedAnalytics = useCallback(async () => {
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

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

    // SET DYNAMIC DATA VALUES FOR THE GRAPH INTERFACE ELEMENTS
    setChartData([
      { label: 'Principal Deployed', value: principalSum },
      { label: 'Expected Revenue', value: grossDebt },
      { label: 'Yield Collected', value: collectionsSum },
      { label: 'Outstanding Debt', value: remainingReceivables }
    ]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    generateIsolatedAnalytics();
  }, [generateIsolatedAnalytics]);

  if (loading) {
    return (
      <div className="p-8 text-sm font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">
        Compiling Live Analytics Matrix...
      </div>
    );
  }

  // Calculate the highest value in our dynamic array to serve as the 100% chart ceiling height multiplier
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-1">
      
      {/* BALANCED HEADER PANEL */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
          <BarChart3 className="text-emerald-400 h-5 w-5" /> Yield Analytics Workspace
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-bold mt-1">
          Real-time performance metrics tracking, interest profit optimization, and isolated asset utilization matrices.
        </p>
      </div>

      {/* NUMERIC SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#0b132b] border border-slate-800/80 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Deployed Assets</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">₹{analytics.totalPrincipalLent.toLocaleString()}</h2>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500"><DollarSign className="h-5 w-5" /></div>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Interest Yield</span>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">₹{analytics.expectedInterestRevenue.toLocaleString()}</h2>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400"><TrendingUp className="h-5 w-5" /></div>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Portfolio Return</span>
            <h2 className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">{analytics.netYieldPercentage}%</h2>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/20 text-blue-400"><Percent className="h-5 w-5" /></div>
        </div>
      </div>

      {/* TRUE FULL-WIDTH BALANCED DYNAMIC CHART CARD */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider text-slate-300">
            Real-Time Portfolio Allocation Metrics
          </h3>
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5 md:hidden">
            <Smartphone className="h-3.5 w-3.5" /> Responsive Layout
          </span>
        </div>

        {/* ALIGNMENT RESOLVED: Full width container with space-between positioning */}
        <div className="w-full bg-slate-950/30 border border-slate-900 rounded-xl p-4 sm:p-8">
          <div className="flex justify-between items-end gap-3 sm:gap-6 h-64 border-b border-slate-800/80 pb-2 w-full mx-auto">
            {chartData.map((bar, i) => {
              // Mathematical calculation engine evaluating dynamic percentage runtime heights
              const computedPercentageHeight = Math.max(8, Math.round((bar.value / maxChartValue) * 100));
              
              return (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  {/* Dynamic hovering metric indicators */}
                  <span className="text-[10px] sm:text-xs font-mono text-emerald-400 font-black mb-2 transition-all duration-200">
                    ₹{bar.value.toLocaleString()}
                  </span>
                  
                  {/* Fluid dynamic bar item styling */}
                  <div 
                    style={{ height: `${computedPercentageHeight}%` }}
                    className="w-full max-w-[70px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg shadow-md transition-all duration-300 group-hover:brightness-110 group-hover:shadow-emerald-500/10"
                  />
                  
                  {/* Bottom tracking structural labels */}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-3 text-center truncate w-full block">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}