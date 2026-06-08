'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function RiskTab() {
  const supabase = createClient();
  const [arrears, setArrears] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('live_loans').select('*').filter('missed_days_count', 'gt', 0).then(({ data }) => {
      if (data) setArrears(data);
    });
  }, []);

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-xl font-black text-white">Risk Delinquency Radar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {arrears.length === 0 ? (
          <div className="col-span-full bg-slate-900 p-12 text-center rounded-2xl border border-slate-800 text-slate-500 font-medium">No payment defaults or late cycles flagged on system radar.</div>
        ) : arrears.map(loan => (
          <div key={loan.id} className="bg-slate-900 border border-rose-950 p-5 rounded-2xl flex flex-col justify-between"><h3 className="text-lg font-bold text-white">{loan.client_name}</h3><p className="text-xs text-rose-400 font-semibold mb-3">{loan.missed_days_count} Days Delinquent</p><a href={`tel:${loan.client_phone}`} className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl text-center block transition-colors">Call Borrower</a></div>
        ))}
      </div>
    </div>
  );
}