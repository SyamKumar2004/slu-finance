'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { CheckCircle2, Clock, Check, Archive, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

export default function BookRecordsDesk() {
  const supabase = createClient();
  const [loans, setLoans] = useState<any[]>([]);
  const [adminName, setAdminName] = useState('Master Administrator');
  const [capitalMetrics, setCapitalMetrics] = useState({ float: 0, lent: 0, collected: 0 });
  const [reconcileAmounts, setReconcileAmounts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const loadDashboardLedger = useCallback(async () => {
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';
    const savedName = localStorage.getItem('slu_user_name');
    if (savedName) setAdminName(savedName);

    const { data: capitalData } = await supabase
      .from('company_capital')
      .select('amount')
      .eq('lender_id', activeLenderUuid);
      
    const totalInjected = capitalData?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

    const { data: rawLoans } = await supabase
      .from('live_loans')
      .select('*')
      .eq('lender_id', activeLenderUuid)
      .order('created_at', { ascending: false });

    let totalLent = 0;
    let totalCollected = 0;
    const now = new Date();

    const processedLoans = (rawLoans || []).map((l: any) => {
      const principal = Number(l.principal_amount || 0);
      const rate = Number(l.interest_rate || 0);
      const collected = Number(l.total_collected || 0);
      const totalDebt = principal + (principal * (rate / 100));

      if (l.status === 'Active' || l.status === 'Closed') {
        totalLent += principal;
        totalCollected += collected;
      }

      // Check if timeline is exceeded for notification alerts
      const nextDate = l.next_installment_date ? new Date(l.next_installment_date) : null;
      const isTimelineExceeded = l.status === 'Active' && nextDate && now > nextDate;

      return {
        ...l,
        totalDebt: totalDebt,
        remainingBalance: Math.max(0, totalDebt - collected),
        isTimelineExceeded
      };
    });

    const sortedLoans = processedLoans.sort((a, b) => {
      if (a.status === 'Closed' && b.status !== 'Closed') return 1;
      if (a.status !== 'Closed' && b.status === 'Closed') return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const activeCashFloat = totalInjected + totalCollected - totalLent;

    setCapitalMetrics({ float: activeCashFloat, lent: totalLent, collected: totalCollected });
    setLoans(sortedLoans);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadDashboardLedger();
  }, [loadDashboardLedger]);

  const handleFinalAdminApproval = async (id: string, totalCycles: number, tenureType: string) => {
    const loanIssuedDate = new Date();
    let nextInstallment = new Date();
    let finalSettlement = new Date();

    // Dynamically calculate timeline values from calendar configurations
    if (tenureType === 'Weekly') {
      nextInstallment.setDate(loanIssuedDate.getDate() + 7);
      finalSettlement.setDate(loanIssuedDate.getDate() + (totalCycles * 7));
    } else if (tenureType === 'Monthly') {
      nextInstallment.setMonth(loanIssuedDate.getMonth() + 1);
      finalSettlement.setMonth(loanIssuedDate.getMonth() + totalCycles);
    } else {
      nextInstallment.setDate(loanIssuedDate.getDate() + 1);
      finalSettlement.setDate(loanIssuedDate.getDate() + totalCycles);
    }

    const { error } = await supabase
      .from('live_loans')
      .update({ 
        status: 'Active',
        loan_issued_date: loanIssuedDate.toISOString(),
        next_installment_date: nextInstallment.toISOString(),
        final_settlement_date: finalSettlement.toISOString()
      })
      .eq('id', id);

    if (!error) {
      alert("Verification Approved: Timelines calculated and capital deployed to active register.");
      loadDashboardLedger();
    }
  };

  const handleCollectionReconcile = async (id: string, currentCollected: number, totalDebt: number, tenureType: string, currentNextDate: string) => {
    const typedAmt = parseFloat(reconcileAmounts[id] || '0');
    if (typedAmt <= 0) return;

    const newTotal = currentCollected + typedAmt;
    const targetStatus = newTotal >= totalDebt ? 'Closed' : 'Active';
    
    // Auto-advance next cycle tracking target based on current data state parameters
    let nextDateObj = currentNextDate ? new Date(currentNextDate) : new Date();
    if (targetStatus === 'Active') {
      if (tenureType === 'Weekly') nextDateObj.setDate(nextDateObj.getDate() + 7);
      else if (tenureType === 'Monthly') nextDateObj.setMonth(nextDateObj.getMonth() + 1);
      else nextDateObj.setDate(nextDateObj.getDate() + 1);
    }

    const updatePayload: any = { 
      total_collected: newTotal, 
      status: targetStatus,
      next_installment_date: targetStatus === 'Closed' ? null : nextDateObj.toISOString()
    };
    
    if (targetStatus === 'Closed') {
      updatePayload.loan_cleared_date = new Date().toISOString();
    }

    const { error } = await supabase.from('live_loans').update(updatePayload).eq('id', id);

    if (!error) {
      setReconcileAmounts({ ...reconcileAmounts, [id]: '' });
      if (targetStatus === 'Closed') {
        alert("Success: Account settled in full! Profile moved to Closed logs.");
      }
      loadDashboardLedger();
    }
  };

  const formatLocalDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  if (loading) return <div className="p-8 text-sm font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">Synchronizing Ledger Matrix...</div>;

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto px-2">
      
      {/* HEADER BLOCK */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            Welcome Back, {adminName} 👋
          </h2>
          <p className="text-sm text-slate-400 font-bold mt-1">Platform Role: Master Ledger Administrator</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-black uppercase tracking-wider">
          <ShieldCheck className="h-5 w-5" /> Live Operational Mode
        </div>
      </div>

      {/* STAT CARDS MATRIX GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Active Cash Float</span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 mt-2">₹{capitalMetrics.float.toLocaleString()}</h2>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Capital Lent Out</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">₹{capitalMetrics.lent.toLocaleString()}</h2>
        </div>
        <div className="bg-[#0b132b] border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Yield Collected</span>
          <h2 className="text-3xl sm:text-4xl font-black text-blue-400 mt-2">₹{capitalMetrics.collected.toLocaleString()}</h2>
        </div>
      </div>

      {/* DATA CARD LAYOUT CONTAINER */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white tracking-wide">Underwritten Ledger Profiles</h3>
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 sm:hidden">
            <Smartphone className="h-4 w-4" /> Swipe left/right to scroll data rows
          </span>
        </div>

        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-sm font-bold text-slate-300 min-w-[1050px] table-auto">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider font-black">
                <th className="pb-4 pl-2">Client Details</th>
                <th className="pb-4">Structure</th>
                <th className="pb-4">Timeline Status</th>
                <th className="pb-4">Next Pay Due</th>
                <th className="pb-4">Maturity Date</th>
                <th className="pb-4">Total Debt</th>
                <th className="pb-4">Collected</th>
                <th className="pb-4">Quick Reconcile</th>
                <th className="pb-4 text-center pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loans.map((loan) => (
                <tr key={loan.id} className={`transition-all ${loan.status === 'Closed' ? 'bg-slate-950/30 opacity-50' : 'hover:bg-slate-950/20'}`}>
                  <td className="py-5 pl-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-white font-black text-base block ${loan.status === 'Closed' ? 'line-through text-slate-500' : ''}`}>{loan.client_name}</span>
                      {loan.isTimelineExceeded && (
                        <span className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-black flex items-center gap-0.5 animate-pulse"><AlertCircle className="h-3 w-3" /> Overdue</span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 block mt-1">{loan.client_phone}</span>
                  </td>
                  <td className="py-5">
                    <span className="px-2.5 py-1 bg-slate-950 rounded-md font-mono text-xs text-slate-400 border border-slate-800 font-bold">{loan.tenure_type}</span>
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider block w-max uppercase border ${
                      loan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      loan.status === 'Closed' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                      loan.status === 'Customer_Accepted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {loan.status === 'Verification_Pending' ? '⚠️ Hold' : loan.status}
                    </span>
                  </td>
                  <td className={`py-5 font-mono text-sm font-bold ${loan.isTimelineExceeded ? 'text-rose-400' : 'text-slate-300'}`}>
                    {loan.status === 'Closed' ? '-' : formatLocalDate(loan.next_installment_date)}
                  </td>
                  <td className="py-5 font-mono text-sm text-slate-400 font-bold">
                    {formatLocalDate(loan.final_settlement_date)}
                  </td>
                  <td className="py-5 font-black text-white text-base">₹{loan.totalDebt.toLocaleString()}</td>
                  <td className="py-5 font-extrabold text-emerald-400 text-sm">₹{Number(loan.total_collected || 0).toLocaleString()}</td>
                  
                  <td className="py-5">
                    {loan.status === 'Active' ? (
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder="₹" value={reconcileAmounts[loan.id] || ''} onChange={e => setReconcileAmounts({ ...reconcileAmounts, [loan.id]: e.target.value })} className="w-20 p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none font-bold" />
                        <button type="button" onClick={() => handleCollectionReconcile(loan.id, loan.total_collected, loan.totalDebt, loan.tenure_type, loan.next_installment_date)} className="p-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all"><Check className="h-4 w-4 stroke-[3]" /></button>
                      </div>
                    ) : loan.status === 'Closed' ? (
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1 w-max">🎉 Cleared</span>
                    ) : (
                      <span className="text-xs text-slate-500 italic font-bold">Awaiting Activation</span>
                    )}
                  </td>

                  <td className="py-5 text-center pr-2">
                    {loan.status === 'Active' ? (
                      <span className="text-xs text-emerald-400 font-black uppercase tracking-wider">🚀 Active</span>
                    ) : loan.status === 'Closed' ? (
                      <span className="text-xs text-slate-500 font-black uppercase tracking-wider flex items-center justify-center gap-1"><Archive className="h-4 w-4" /> Archive Log</span>
                    ) : loan.status === 'Customer_Accepted' ? (
                      <button type="button" onClick={() => handleFinalAdminApproval(loan.id, loan.total_cycles, loan.tenure_type)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1 mx-auto"><CheckCircle2 className="h-4 w-4" /> Approve Verification</button>
                    ) : (
                      <div className="text-amber-500 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10 max-w-[200px] mx-auto select-none">
                        <Clock className="h-4 w-4 text-amber-500" /> Awaiting Sign
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