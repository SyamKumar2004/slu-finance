'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { PlusCircle, Calendar } from 'lucide-react';

export default function CapitalTab() {
  const supabase = createClient();
  const [history, setHistory] = useState<any[]>([]);
  const [floatBalance, setFloatBalance] = useState(0);
  const [amt, setAmt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadFundsMetrics(); }, []);

  async function loadFundsMetrics() {
    const { data: rows } = await supabase.from('company_capital').select('*').order('created_at', { ascending: false });
    if (rows) {
      setHistory(rows);
      const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      
      const { data: activeLoans } = await supabase.from('live_loans').select('principal_amount, total_collected');
      let lentOut = 0; let collected = 0;
      activeLoans?.forEach(l => { lentOut += Number(l.principal_amount || 0); collected += Number(l.total_collected || 0); });
      setFloatBalance(total + collected - lentOut);
    }
  }

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amt);
    if (isNaN(val) || val <= 0) return;
    await supabase.from('company_capital').insert([{ amount: val, notes: notes.trim() || 'Manual Capital Injection' }]);
    setAmt(''); setNotes(''); loadFundsMetrics();
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit shadow-lg">
        <h3 className="text-md font-black text-white flex items-center gap-1.5 mb-4"><PlusCircle className="text-emerald-400 h-4 w-4" /> Inject Capital</h3>
        <form onSubmit={handleAddCapital} className="space-y-4 text-xs">
          <div><label className="font-bold text-slate-400 uppercase">Amount (₹)</label><input required type="number" value={amt} onChange={e => setAmt(e.target.value)} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-md focus:outline-none" placeholder="e.g. 50000" /></div>
          <div><label className="font-bold text-slate-400 uppercase">Audit Note</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" placeholder="SBI cash ledger transfer..." /></div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl uppercase transition-all">Confirm Influx</button>
        </form>
      </div>
      <div className="md:col-span-2 space-y-4">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-lg"><span className="text-xs text-emerald-400 font-black uppercase tracking-wider block">Active Liquid Cash Float</span><span className="text-4xl font-black text-emerald-400 block mt-2">₹{floatBalance.toLocaleString()}</span></div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md"><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Audit Influx Logs History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">{history.map(log => (<div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-900 text-xs"><div><p className="font-bold text-slate-200">₹{Number(log.amount || 0).toLocaleString()}</p><p className="text-[10px] text-slate-500 mt-0.5">{log.notes}</p></div><span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded-md">{new Date(log.created_at).toLocaleDateString('en-IN')}</span></div>))}</div>
        </div>
      </div>
    </div>
  );
}