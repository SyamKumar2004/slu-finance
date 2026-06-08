'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function AnalyticsTab() {
  const supabase = createClient();
  const [data, setData] = useState({ lent: 0, collected: 0, profit: 0 });

  useEffect(() => {
    async function loadData() {
      const { data: activeLoans } = await supabase.from('live_loans').select('principal_amount, total_collected, interest_rate');
      let tLent = 0; let tCollected = 0; let tProfit = 0;

      activeLoans?.forEach(l => {
        const principal = Number(l.principal_amount || 0);
        const rate = Number(l.interest_rate || 0);
        const totalCollectedAmt = Number(l.total_collected || 0);
        const totalPayableDebt = principal + (principal * (rate / 100));

        tLent += principal;
        tCollected += totalCollectedAmt;

        // True dynamic tracking calculation matrix for earned interest yield return values
        if (totalCollectedAmt > principal) {
          tProfit += (totalCollectedAmt - principal);
        } else if (totalCollectedAmt > 0 && totalPayableDebt > 0) {
          const interestRatio = (principal * (rate / 100)) / totalPayableDebt;
          tProfit += (totalCollectedAmt * interestRatio);
        }
      });
      setData({ lent: tLent, collected: tCollected, profit: Math.ceil(tProfit) });
    }
    loadData();
  }, []);

  const maxVal = Math.max(data.lent, data.collected, data.profit, 100);
  const barHeight = (val: number) => `${Math.max((val / maxVal) * 100, 8)}%`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Credit Book Bars Container Chart */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-96">
          <div><h3 className="text-md font-black text-white">Underwritten Volume Analysis</h3><p className="text-xs text-slate-500 mt-0.5">Lent out volume contrasted with incoming client capital returns.</p></div>
          <div className="flex items-end gap-8 h-56 border-b border-l border-slate-800/80 px-6 pb-2 bg-slate-950/20 rounded-xl pt-4">
            <div className="flex flex-col items-center gap-1.5 flex-1"><span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">₹{data.lent.toLocaleString()}</span><div className="w-16 bg-slate-800 rounded-t-xl transition-all duration-700 shadow-md" style={{ height: barHeight(data.lent) }}></div><span className="text-xs text-slate-400 font-bold mt-1 uppercase text-[10px]">Lent Out</span></div>
            <div className="flex flex-col items-center gap-1.5 flex-1"><span className="text-xs font-bold text-emerald-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">₹{data.collected.toLocaleString()}</span><div className="w-16 bg-emerald-500 rounded-t-xl transition-all duration-700 shadow-lg" style={{ height: barHeight(data.collected) }}></div><span className="text-xs text-emerald-400 font-bold mt-1 uppercase text-[10px]">Collected</span></div>
          </div>
        </div>

        {/* Dynamic Earned Net Profit Graph Card Layout */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-96">
          <div><h3 className="text-md font-black text-emerald-400">Earned Revenue Yield</h3><p className="text-xs text-slate-500 mt-0.5">True net profit from installment interest collections.</p></div>
          <div className="flex items-end justify-center h-56 border-b border-slate-800/80 pb-2 bg-emerald-950/10 rounded-xl pt-4">
            <div className="flex flex-col items-center gap-2 w-full px-8"><span className="text-sm font-black text-emerald-400 bg-slate-950 border border-emerald-500/20 px-3 py-1 rounded-xl shadow-inner">₹{data.profit.toLocaleString()}</span><div className="w-20 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-2xl transition-all duration-700 shadow-xl shadow-emerald-500/10" style={{ height: barHeight(data.profit) }}></div><span className="text-xs text-slate-200 font-black mt-1 uppercase text-[10px] tracking-wider">Net Profit</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}