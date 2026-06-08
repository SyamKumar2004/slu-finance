'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Wallet, TrendingUp, DollarSign, CheckCircle2, Trash2, Clock, Landmark } from 'lucide-react';

export default function BookRecordsDesk() {
  const supabase = createClient();
  const [loans, setLoans] = useState<any[]>([]);
  const [capitalMetrics, setCapitalMetrics] = useState({ float: 50000, lent: 0, collected: 0 });
  const [reconcileAmounts, setReconcileAmounts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const loadDashboardLedger = useCallback(async () => {
    // 1. Fetch total core capital injections
    const { data: capitalData } = await supabase.from('company_capital').select('amount');
    const totalInjected = capitalData?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

    // 2. Fetch live loans ledger data
    const { data: rawLoans } = await supabase
      .from('live_loans')
      .select('*')
      .order('created_at', { ascending: false });

    let totalLent = 0;
    let totalCollected = 0;

    const processedLoans = (rawLoans || []).map((l: any) => {
      const principal = Number(l.principal_amount || 0);
      const rate = Number(l.interest_rate || 0);
      const collected = Number(l.total_collected || 0);
      const totalDebt = principal + (principal * (rate / 100));

      if (l.status === 'Active') {
        totalLent += principal;
        totalCollected += collected;
      }

      return {
        ...l,
        totalDebt: totalDebt,
        remainingBalance: totalDebt - collected
      };
    });

    // Pure Double-Entry Math: Float = Injected + Collected - Deployed
    const activeCashFloat = totalInjected + totalCollected - totalLent;

    setCapitalMetrics({ float: activeCashFloat, lent: totalLent, collected: totalCollected });
    setLoans(processedLoans);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadDashboardLedger();
  }, [loadDashboardLedger]);

  // Master Final Verification Action Trigger
  const handleFinalAdminApproval = async (id: string) => {
    const { error } = await supabase
      .from('live_loans')
      .update({ status: 'Active' })
      .eq('id', id);

    if (!error) {
      alert("Verification Approved: Capital has been officially deployed to the active asset register.");
      loadDashboardLedger();
    }
  };

  const handleCollectionReconcile = async (id: string, currentCollected: number) => {
    const typedAmt = parseFloat(reconcileAmounts[id] || '0');
    if (typedAmt <= 0) return;

    const newTotal = currentCollected + typedAmt;
    const { error } = await supabase
      .from('live_loans')
      .update({ total_collected: newTotal })
      .eq('id', id);

    if (!error) {
      setReconcileAmounts({ ...reconcileAmounts, [id]: '' });
      loadDashboardLedger();
    }
  };

  if (loading) return <div className="p-8 text-xs font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">Synchronizing Ledger Matrix...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans p-4">
      
      {/* FINANCIAL OVERVIEW METRIC CARD ROWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Active Cash Float</span>
          <h2 className="text-2xl font-black text-emerald-400 mt-1">₹{capitalMetrics.float.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Capital Lent Out</span>
          <h2 className="text-2xl font-black text-white mt-1">₹{capitalMetrics.lent.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Yield Collected</span>
          <h2 className="text-2xl font-black text-blue-400 mt-1">₹{capitalMetrics.collected.toLocaleString()}</h2>
        </div>
      </div>

      {/* CORE UNDERWRITTEN LEDGER MATRIX TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-md font-black text-white mb-4">Underwritten Ledger Profiles</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-400">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] uppercase text-slate-500 tracking-wider">
                <th className="pb-3">Client Details</th>
                <th className="pb-3">Structure</th>
                <th className="pb-3">Timeline Status</th>
                <th className="pb-3">Principal</th>
                <th className="pb-3">Total Debt</th>
                <th className="pb-3">Collected</th>
                <th className="pb-3">Quick Reconcile</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-950/20 transition-all">
                  <td className="py-4">
                    <span className="text-white font-black block">{loan.client_name}</span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{loan.client_phone}</span>
                  </td>
                  <td className="py-4"><span className="px-2 py-0.5 bg-slate-950 rounded-md font-mono text-[10px] text-slate-400 border border-slate-800">{loan.tenure_type}</span></td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold block w-max uppercase border ${
                      loan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      loan.status === 'Customer_Accepted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {loan.status === 'Verification_Pending' ? '⚠️ Hold' : loan.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-slate-300">₹{Number(loan.principal_amount).toLocaleString()}</td>
                  <td className="py-4 font-black text-white">₹{loan.totalDebt.toLocaleString()}</td>
                  <td className="py-4 font-bold text-emerald-400">₹{Number(loan.total_collected || 0).toLocaleString()}</td>
                  
                  {/* QUICK RECONCILE COLUMN */}
                  <td className="py-4">
                    {loan.status === 'Active' ? (
                      <div className="flex items-center gap-1.5">
                        <input type="number" placeholder="₹" value={reconcileAmounts[loan.id] || ''} onChange={e => setReconcileAmounts({ ...reconcileAmounts, [loan.id]: e.target.value })} className="w-16 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none" />
                        <button type="button" onClick={() => handleCollectionReconcile(loan.id, loan.total_collected)} className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all font-bold">✓</button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic font-medium">Awaiting Live Activation</span>
                    )}
                  </td>

                  {/* SMART ACTIONS MATRIX COLUMN */}
                  <td className="py-4 text-center">
                    {loan.status === 'Active' ? (
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">✨ Line Live</span>
                    ) : loan.status === 'Customer_Accepted' ? (
                      // UNLOCK ONLY WHEN CUSTOMER SIGNS
                      <button type="button" onClick={() => handleFinalAdminApproval(loan.id)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-md flex items-center gap-1 mx-auto"><CheckCircle2 className="h-3.5 w-3.5" /> Approve Verification</button>
                    ) : (
                      // SAFETY GATE: LOCK AND WAIT FOR USER SIGNATURE
                      <div className="text-amber-500 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 py-1.5 bg-amber-500/5 rounded-xl border border-amber-500/10 max-w-[180px] mx-auto select-none">
                        <Clock className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} /> Awaiting Client Signature
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}