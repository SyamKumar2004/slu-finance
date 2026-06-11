'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { AlertTriangle, Phone, Clock, CalendarDays } from 'lucide-react';

export default function RiskTab() {
  const supabase = createClient();
  const [arrears, setArrears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIsolatedRiskRadar = useCallback(async () => {
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

    // Fetch all active profiles for evaluation
    const { data, error } = await supabase
      .from('live_loans')
      .select('*')
      .eq('lender_id', activeLenderUuid)
      .neq('status', 'Closed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Risk extraction failure:", error.message);
    } else if (data) {
      const now = new Date();
      
      // Filter loans that are overdue via DB days missed field OR current calendar date breaches
      const delinquentLoans = data.map((loan: any) => {
        const nextPayDate = loan.next_installment_date ? new Date(loan.next_installment_date) : null;
        const isCalendarBreached = nextPayDate && now > nextPayDate;
        
        return {
          ...loan,
          isCalendarBreached
        };
      }).filter((loan: any) => Number(loan.missed_days_count) > 0 || loan.isCalendarBreached);

      setArrears(delinquentLoans);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadIsolatedRiskRadar();
  }, [loadIsolatedRiskRadar]);

  const formatLocalDate = (isoString: string) => {
    if (!isoString) return 'Not Specified';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="p-8 text-sm font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">Synchronizing Risk Parameters...</div>;

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-1">
      
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
          <AlertTriangle className="text-rose-500 h-5 w-5 animate-pulse" /> Risk Delinquency Radar
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-bold mt-1.5">
          Real-time tracking of payment anomalies, calendar timeline breaches, and direct borrower outreach pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {arrears.length === 0 ? (
          <div className="col-span-full bg-[#0b132b] p-14 text-center rounded-2xl border border-slate-800/80 text-slate-400 font-bold text-base flex flex-col items-center justify-center gap-3 shadow-xl">
            <div className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
            No payment defaults or calendar breaches flagged on your ledger accounts index.
          </div>
        ) : (
          arrears.map(loan => {
            const principal = Number(loan.principal_amount || 0);
            const interest = principal * (Number(loan.interest_rate || 0) / 100);
            const totalContractDebt = principal + interest;
            const remainingLiability = Math.max(0, totalContractDebt - Number(loan.total_collected || 0));

            return (
              <div key={loan.id} className="bg-[#0b132b] border border-rose-950/40 hover:border-rose-900/60 p-6 rounded-2xl flex flex-col justify-between shadow-xl transition-all hover:scale-[1.01] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h3 className="text-lg font-black text-white truncate max-w-[170px]">{loan.client_name}</h3>
                      <span className="text-xs font-mono font-bold text-slate-500 block mt-0.5">{loan.client_phone}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider h-max">
                      {loan.isCalendarBreached ? '🚨 Overdue Breach' : '⚠️ Late Record'}
                    </span>
                  </div>

                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 font-bold text-xs text-slate-400 space-y-2 pl-3">
                    <div className="flex justify-between items-center text-rose-400">
                      <span className="flex items-center gap-1 text-slate-400"><Clock className="h-3.5 w-3.5" /> Due Date Status:</span>
                      <span className="font-black font-mono">{formatLocalDate(loan.next_installment_date)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900/60 pt-2"><span>Remaining Bal:</span><span className="text-slate-200">₹{remainingLiability.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Maturity Date:</span><span className="text-slate-400 font-mono text-[11px] font-medium">{formatLocalDate(loan.final_settlement_date)}</span></div>
                    <div className="flex justify-between"><span>Structure:</span><span className="text-slate-400 font-mono text-[11px] font-medium">{loan.tenure_type} ({loan.total_cycles} Cycles)</span></div>
                  </div>
                </div>

                <div className="mt-5 pl-2">
                  <a 
                    href={`tel:${loan.client_phone}`} 
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black py-3 rounded-xl text-center flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all shadow-md shadow-rose-950/20"
                  >
                    <Phone className="h-4 w-4 shrink-0" /> Contact Borrower
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}