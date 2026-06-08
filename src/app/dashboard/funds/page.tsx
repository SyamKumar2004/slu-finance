'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Wallet, PlusCircle, ArrowUpRight, Smartphone } from 'lucide-react';

export default function CapitalPoolReserves() {
  const supabase = createClient();
  const [injections, setInjections] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ poolTotal: 0, deployed: 0, available: 0 });
  const [injectAmount, setInjectAmount] = useState('');
  const [sourceNote, setSourceNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadIsolatedReserves = useCallback(async () => {
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

    // 1. Fetch ONLY capital pool injections matching this specific lender account identity
    const { data: capitalLogs } = await supabase
      .from('company_capital')
      .select('*')
      .eq('lender_id', activeLenderUuid)
      .order('created_at', { ascending: false });

    const totalInjected = capitalLogs?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

    // 2. Fetch active principal deployed by this specific lender
    const { data: activeLoans } = await supabase
      .from('live_loans')
      .select('principal_amount, total_collected, status')
      .eq('lender_id', activeLenderUuid);

    let totalLentOut = 0;
    let totalCollectedBack = 0;

    (activeLoans || []).forEach((l: any) => {
      if (l.status === 'Active' || l.status === 'Closed') {
        totalLentOut += Number(l.principal_amount || 0);
        totalCollectedBack += Number(l.total_collected || 0);
      }
    });

    // Available Cash Float = Injected Capital + Interest Earnings Collected - Capital Deployed Out
    const netAvailableFloat = totalInjected + totalCollectedBack - totalLentOut;

    setMetrics({
      poolTotal: totalInjected,
      deployed: totalLentOut,
      available: netAvailableFloat
    });
    setInjections(capitalLogs || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadIsolatedReserves();
  }, [loadIsolatedReserves]);

  const handleInjectCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(injectAmount);
    if (amt <= 0 || !sourceNote.trim()) return;

    setProcessing(true);
    
    const activeLenderUuid = localStorage.getItem('slu_user_id');
    
    if (!activeLenderUuid || activeLenderUuid === '00000000-0000-0000-0000-000000000000') {
      alert("Session Sync Required: Your session token is outdated. Please sign out and sign back in once to sync multi-tenant parameters.");
      setProcessing(false);
      return;
    }

    // FIXED ROW INTERSECTION MAPPING TARGET: notes maps to notes column in DB
    const { error } = await supabase.from('company_capital').insert([{
      lender_id: activeLenderUuid,
      amount: amt,
      notes: sourceNote.trim(), 
      created_at: new Date().toISOString()
    }]);

    if (!error) {
      setInjectAmount('');
      setSourceNote('');
      alert("Capital Reserves Updated successfully!");
      loadIsolatedReserves();
    } else {
      console.error("Supabase Database Reject Error Details:", error);
      alert(`Database Fault: ${error.message}`);
    }
    setProcessing(false);
  };

  if (loading) return <div className="p-8 text-sm font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">Syncing Reserves Matrix...</div>;

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto px-2">
      
      {/* SCALED METRICS PANELS (+2PX/+3PX TYPOGRAPHY TYPOGRAPHY OVERRIDE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Net Available Float</span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 mt-2">₹{metrics.available.toLocaleString()}</h2>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Injected Capital</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">₹{metrics.poolTotal.toLocaleString()}</h2>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Principal Deployed</span>
          <h2 className="text-3xl sm:text-4xl font-black text-blue-400 mt-2">₹{metrics.deployed.toLocaleString()}</h2>
        </div>
      </div>

      {/* TWO COLUMN RESPONSIVE GRID WRAPPER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: CONTROL INPUT ONBOARDING PANEL */}
        <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <PlusCircle className="text-emerald-400 h-5 w-5" /> Expand Pool Reserves
          </h3>
          <form onSubmit={handleInjectCapital} className="space-y-4 text-sm font-bold">
            <div>
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider">Injection Amount (INR)</label>
              <input required type="number" value={injectAmount} onChange={e => setInjectAmount(e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-base focus:outline-none focus:border-slate-500" placeholder="₹ Amount" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider">Source Reference / Allocation Notes</label>
              <input required type="text" value={sourceNote} onChange={e => setSourceNote(e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-slate-500" placeholder="e.g. Personal savings injection..." />
            </div>
            <button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-4 rounded-xl uppercase text-xs tracking-wider transition-all shadow-lg mt-2">
              {processing ? 'Processing Influx...' : 'Authorize Float Injection'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: REGISTRY DATA GRAPH HISTORY LIST */}
        <div className="lg:col-span-2 bg-[#0b132b] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-black text-white tracking-wide uppercase tracking-wider text-slate-300">Allocation Registry History</h3>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 sm:hidden">
              <Smartphone className="h-4 w-4" /> Swipe to view rows
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-sm font-bold text-slate-300 min-w-[550px] table-auto">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider font-black pb-3">
                  <th className="pb-4 pl-2">Date Authenticated</th>
                  <th className="pb-4">Allocation Source Reference</th>
                  <th className="pb-4 pr-2 text-right">Fund Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {injections.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500 font-bold text-sm">No capital injections logged on this account register handle yet.</td>
                  </tr>
                ) : (
                  injections.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-950/20 transition-all">
                      <td className="py-4 pl-2 font-mono text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 font-black text-white text-sm flex items-center gap-1.5">
                        <ArrowUpRight className="h-4 w-4 text-emerald-400 shrink-0" /> {item.notes || 'Asset Injection Row'}
                      </td>
                      <td className="py-4 pr-2 text-right font-black text-emerald-400 text-base">
                        ₹{Number(item.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}