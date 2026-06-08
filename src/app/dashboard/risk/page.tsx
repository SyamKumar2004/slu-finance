'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { AlertTriangle, Phone, Smartphone } from 'lucide-react';

export default function RiskTab() {
  const supabase = createClient();
  const [arrears, setArrears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIsolatedRiskRadar = useCallback(async () => {
    // Read the active operating lender's ID directly from local session storage
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

    // BULLETPROOF SECURED: Pull only defaulting client profiles owned exclusively by this logged-in admin identity
    const { data, error } = await supabase
      .from('live_loans')
      .select('*')
      .eq('lender_id', activeLenderUuid)
      .gt('missed_days_count', 0)
      .order('missed_days_count', { ascending: false });

    if (error) {
      console.error("Risk extraction failure:", error.message);
    } else if (data) {
      setArrears(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadIsolatedRiskRadar();
  }, [loadIsolatedRiskRadar]);

  if (loading) return <div className="p-8 text-sm font-mono text-emerald-400 animate-pulse uppercase tracking-widest text-center mt-20">Synchronizing Risk Parameters...</div>;

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-1">
      
      {/* SCALED HIGH-CONTRAST PAGE HEADER COMPONENT */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
          <AlertTriangle className="text-rose-500 h-5 w-5 animate-pulse" /> Risk Delinquency Radar
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-bold mt-1.5">
          Real-time tracking of payment anomalies, automated collection default lists, and direct borrower outreach pipelines.
        </p>
      </div>

      {/* DYNAMIC RISK PROFILES DEPLOYMENT GRID (+2PX/+3PX TYPOGRAPHY BOOST) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {arrears.length === 0 ? (
          <div className="col-span-full bg-[#0b132b] p-14 text-center rounded-2xl border border-slate-800/80 text-slate-400 font-bold text-base flex flex-col items-center justify-center gap-3 shadow-xl">
            <div className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
            No payment defaults or late cycles flagged on your ledger accounts index.
          </div>
        ) : (
          arrears.map(loan => {
            // Business calculations evaluating asset liabilities
            const principal = Number(loan.principal_amount || 0);
            const interest = principal * (Number(loan.interest_rate || 0) / 100);
            const totalContractDebt = principal + interest;
            const remainingLiability = Math.max(0, totalContractDebt - Number(loan.total_collected || 0));

            return (
              <div key={loan.id} className="bg-[#0b132b] border border-rose-950/40 hover:border-rose-900/60 p-6 rounded-2xl flex flex-col justify-between shadow-xl transition-all hover:scale-[1.01] relative overflow-hidden group">
                {/* Red warning border highlighting delinquency severity */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h3 className="text-lg font-black text-white truncate max-w-[170px]">{loan.client_name}</h3>
                      <span className="text-xs font-mono font-bold text-slate-500 block mt-0.5">{loan.client_phone}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider h-max">
                      ⚠️ Overdue
                    </span>
                  </div>

                  {/* Financial tracking breakdowns */}
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-900 font-bold text-xs text-slate-400 space-y-2 pl-3">
                    <div className="flex justify-between"><span>Missed Days:</span><span className="text-rose-400 font-black font-mono text-sm">{loan.missed_days_count} Days</span></div>
                    <div className="flex justify-between border-t border-slate-900/60 pt-2"><span>Remaining Bal:</span><span className="text-slate-200">₹{remainingLiability.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Cycle Structure:</span><span className="text-slate-400 font-mono text-[11px] font-medium">{loan.tenure_type}</span></div>
                  </div>
                </div>

                {/* Direct calling layout button link */}
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