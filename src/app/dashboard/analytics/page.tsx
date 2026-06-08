'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { BarChart3, TrendingUp, DollarSign, Wallet } from 'lucide-react';

export default function AnalyticsTab() {
  const supabase = createClient();
  const [data, setData] = useState({ lent: 0, collected: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: activeLoans } = await supabase
        .from('live_loans')
        .select('principal_amount, total_collected, interest_rate, status');
      
      let tLent = 0; 
      let tCollected = 0; 
      let tProfit = 0;

      activeLoans?.forEach(l => {
        if (l.status !== 'Deleted' && l.status !== 'Verification_Pending') {
          const principal = Number(l.principal_amount || 0);
          const rate = Number(l.interest_rate || 0);
          const totalCollectedAmt = Number(l.total_collected || 0);
          const totalPayableDebt = principal + (principal * (rate / 100));

          tLent += principal;
          tCollected += totalCollectedAmt;

          // Compute exact realized interest profit margins proportional to collection velocity
          if (totalCollectedAmt > principal) {
            tProfit += (totalCollectedAmt - principal);
          } else if (totalCollectedAmt > 0 && totalPayableDebt > 0) {
            const interestRatio = (principal * (rate / 100)) / totalPayableDebt;
            tProfit += (totalCollectedAmt * interestRatio);
          }
        }
      });
      
      setData({ lent: tLent, collected: tCollected, profit: Math.ceil(tProfit) });
      setLoading(false);
    }
    loadData();
  }, []);

  // MASTER AUTOSCALING PROPORTIONAL CALCULATOR ENGINE
  const maxMetricValue = Math.max(data.lent, data.collected, data.profit, 1000);
  
  const getProportionalHeight = (val: number) => {
    if (val === 0) return '6px'; // Ensures a small base indicator capsule line is always visible
    const calculatedPercentage = (val / maxMetricValue) * 100;
    return `${Math.min(Math.max(calculatedPercentage, 4), 100)}%`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-96 bg-slate-900/10 rounded-2xl">
        <div className="text-emerald-400 font-bold text-xs uppercase tracking-widest animate-pulse">Assembling Dynamic Chart Vectors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* SECTION HEADER TRACK */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Business Analytics System</h2>
            <p className="text-xs text-slate-500">Live proportional return yield charts optimized for real-time vault float tracking.</p>
          </div>
        </div>
      </div>

      {/* GRAPH HOUSING COMPOSITOR PLATFORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART BLOCK 1: UNDERWRITTEN VOLUME ANALYSIS */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-[420px]">
          <div>
            <h3 className="text-md font-black text-white">Underwritten Volume Analysis</h3>
            <p className="text-xs text-slate-500 mt-0.5">Lent out credit balances balanced against incoming client repayments.</p>
          </div>
          
          {/* Y-Axis Indicator Background Grid (Matching Reference image_059606.png Styles) */}
          <div className="relative flex items-end gap-12 h-64 border-b border-l border-slate-800/80 px-8 pb-3 bg-slate-950/40 rounded-xl pt-6 mt-4">
            <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex flex-col justify-between text-[9px] font-mono font-black text-slate-700 select-none pr-2">
              <div className="w-full border-t border-slate-900/60 text-right pr-1">100%</div>
              <div className="w-full border-t border-slate-900/40 text-right pr-1">75%</div>
              <div className="w-full border-t border-slate-900/40 text-right pr-1">50%</div>
              <div className="w-full border-t border-slate-900/40 text-right pr-1">25%</div>
              <div className="w-full text-right pr-1">0%</div>
            </div>

            {/* BAR CARD 1: LENT OUT TOTAL */}
            <div className="flex flex-col items-center gap-3 flex-1 h-full justify-end relative z-10">
              <span className="text-xs font-black text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 shadow-xl select-none animate-scaleIn">
                ₹{data.lent.toLocaleString()}
              </span>
              <div 
                className="w-16 bg-gradient-to-t from-slate-800 to-slate-600 hover:from-slate-700 hover:to-slate-500 rounded-t-2xl transition-all duration-700 shadow-xl cursor-pointer hover:scale-105 transform origin-bottom" 
                style={{ height: getProportionalHeight(data.lent) }}
              ></div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1 flex items-center gap-1">
                <Wallet className="h-3 w-3 text-slate-500" /> Lent Out Volume
              </span>
            </div>

            {/* BAR CARD 2: COLLECTED CASH RETURNS */}
            <div className="flex flex-col items-center gap-3 flex-1 h-full justify-end relative z-10">
              <span className="text-xs font-black text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 shadow-xl select-none animate-scaleIn">
                ₹{data.collected.toLocaleString()}
              </span>
              <div 
                className="w-16 bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-t-2xl transition-all duration-700 shadow-xl shadow-emerald-500/5 cursor-pointer hover:scale-105 transform origin-bottom" 
                style={{ height: getProportionalHeight(data.collected) }}
              ></div>
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> Capital Collected
              </span>
            </div>
          </div>
        </div>

        {/* CHART BLOCK 2: ISOLATED REVENUE RECOVERY CHART */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-[420px]">
          <div>
            <h3 className="text-md font-black text-emerald-400">Earned Revenue Yield</h3>
            <p className="text-xs text-slate-500 mt-0.5">True generated net interest profit velocity.</p>
          </div>

          <div className="relative flex items-end justify-center h-64 border-b border-slate-800/80 pb-3 bg-emerald-950/10 rounded-xl pt-6 mt-4">
            <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex flex-col justify-between text-[9px] font-mono font-black text-emerald-900/30 select-none px-4">
              <div className="w-full border-t border-emerald-950/20"></div>
              <div className="w-full border-t border-emerald-950/20"></div>
              <div className="w-full border-t border-emerald-950/20"></div>
              <div className="w-full border-t border-emerald-950/20"></div>
              <div></div>
            </div>

            {/* BAR CARD 3: NET PROFIT GENERATED REVENUE */}
            <div className="flex flex-col items-center gap-3 w-full px-8 h-full justify-end relative z-10">
              <span className="text-sm font-black text-emerald-400 bg-slate-950 border border-emerald-500/20 px-3 py-1 rounded-xl shadow-inner animate-scaleIn">
                ₹{data.profit.toLocaleString()}
              </span>
              <div 
                className="w-20 bg-gradient-to-t from-teal-600 to-emerald-400 hover:from-teal-500 hover:to-emerald-300 rounded-t-3xl transition-all duration-700 shadow-2xl shadow-emerald-500/10 cursor-pointer hover:scale-105 transform origin-bottom" 
                style={{ height: getProportionalHeight(data.profit) }}
              ></div>
              <span className="text-[10px] text-slate-200 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-500" /> Net Profit Earned
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}