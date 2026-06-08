'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Info, Edit3, Check, Trash2, ShieldAlert, CheckCircle2, Eye, X } from 'lucide-react';

export default function BookRecordsDesk() {
  const supabase = createClient();
  const [loans, setLoans] = useState<any[]>([]);
  const [availableLiquidCash, setAvailableLiquidCash] = useState(0);
  const [metrics, setMetrics] = useState({ totalLent: 0, totalCollected: 0 });
  const [selectedLoanFile, setSelectedLoanFile] = useState<any | null>(null);
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', collateral: '' });
  const [collectionAmount, setCollectionAmount] = useState<{ [key: string]: string }>({});

  useEffect(() => { loadDashboardLedger(); }, []);

  async function loadDashboardLedger() {
    const { data: rawLoans } = await supabase.from('live_loans').select('*').order('created_at', { ascending: false });
    let loanList: any[] = [];
    let calculatedLent = 0;
    let calculatedCollected = 0;

    if (rawLoans) {
      loanList = rawLoans.map((l: any) => {
        const p = Number(l.principal_amount || 0);
        const r = Number(l.interest_rate || 0);
        return {
          id: l.id, name: l.client_name, email: l.client_email || 'N/A', phone: l.client_phone, principal: p,
          totalDebt: p + (p * (r / 100)), installment: Number(l.installment_amount || 0), tenure: l.tenure_type || 'Daily', interest: r,
          status: l.status || 'Verification_Pending', collected: Number(l.total_collected || 0),
          governmentId: l.government_id_number || 'Not Provided', address: l.residential_address || 'Not Provided', collateral: l.collateral_asset_details || 'Unsecured Line', guarantor: l.guarantor_emergency_contact || 'None',
          idDoc: l.uploaded_id_document_url, signedForm: l.signed_agreement_document_url,
          issuedDate: l.loan_issued_date ? new Date(l.loan_issued_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}) : 'N/A',
          clearedDate: l.loan_cleared_date ? new Date(l.loan_cleared_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}) : 'Active'
        };
      });
      setLoans(loanList);
      loanList.forEach(l => { if (l.status === 'Active' || l.status === 'Settled_Done') { calculatedLent += l.principal; calculatedCollected += l.collected; } });
    }

    const { data: cap } = await supabase.from('company_capital').select('amount');
    const totalCap = cap?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;
    setAvailableLiquidCash(totalCap + calculatedCollected - calculatedLent);
    setMetrics({ totalLent: calculatedLent, totalCollected: calculatedCollected });
  }

  const handleSaveChangesOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('live_loans').update({ client_name: editForm.name, client_email: editForm.email, client_phone: editForm.phone, residential_address: editForm.address, collateral_asset_details: editForm.collateral }).eq('id', editingLoan.id);
    setEditingLoan(null); loadDashboardLedger();
  };

  const handleRecordCollection = async (loanId: string, currentCollected: number) => {
    const amt = parseFloat(collectionAmount[loanId] || '0');
    if (isNaN(amt) || amt <= 0) return;
    await supabase.from('live_loans').update({ total_collected: currentCollected + amt }).eq('id', loanId);
    setCollectionAmount(prev => ({ ...prev, [loanId]: '' })); loadDashboardLedger();
  };

  const handleToggleStatusComplete = async (loanId: string, currentStatus: string) => {
    const target = currentStatus === 'Active' ? 'Settled_Done' : 'Active';
    await supabase.from('live_loans').update({ status: target, loan_cleared_date: target === 'Settled_Done' ? new Date().toISOString() : null }).eq('id', loanId);
    loadDashboardLedger();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Active Cash Float</p><h3 className="text-2xl font-black text-emerald-400">₹{availableLiquidCash.toLocaleString()}</h3></div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Capital Lent Out</p><h3 className="text-2xl font-black text-white">₹{metrics.totalLent.toLocaleString()}</h3></div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Yield Collected</p><h3 className="text-2xl font-black text-blue-400">₹{metrics.totalCollected.toLocaleString()}</h3></div>
      </section>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-white">Underwritten Ledger Profiles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 pr-2">Client Details</th><th className="py-3 px-2">Structure</th><th className="py-3 px-2">Timeline Dates</th><th className="py-3 px-2">Principal</th><th className="py-3 px-2">₹ Total Debt</th><th className="py-3 px-2">Collected</th><th className="py-3 px-2">Quick Reconcile</th><th className="py-3 px-2 text-center">Actions</th><th className="py-3 pl-2 text-right">Erase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3.5 pr-2 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-100">{loan.name}</span>
                      <button onClick={() => setSelectedLoanFile(loan)} className="text-slate-500 hover:text-emerald-400"><Info className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setEditingLoan(loan); setEditForm({ name: loan.name, email: loan.email, phone: loan.phone, address: loan.address, collateral: loan.collateral }); }} className="text-slate-500 hover:text-blue-400"><Edit3 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="text-xs text-slate-500">{loan.phone}</div>
                  </td>
                  <td className="py-3.5 px-2"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold uppercase">{loan.tenure}</span></td>
                  <td className="py-3.5 px-2 text-xs">
                    <div>Gave: <span className="font-bold text-slate-200">{loan.issuedDate}</span></div>
                    <div className="text-[10px] mt-0.5">{loan.status === 'Settled_Done' ? <span className="text-emerald-400">Done: {loan.clearedDate}</span> : loan.status === 'Verification_Pending' ? <span className="text-rose-400 font-bold flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Verification Pending</span> : <span className="text-amber-500">Active Outflow</span>}</div>
                  </td>
                  <td className="py-3.5 px-2 font-bold text-slate-400">₹{loan.principal.toLocaleString()}</td>
                  <td className="py-3.5 px-2 font-black text-slate-100">₹{loan.totalDebt.toLocaleString()}</td>
                  <td className="py-3.5 px-2 font-bold text-emerald-400">₹{loan.collected.toLocaleString()}</td>
                  <td className="py-3.5 px-2">
                    {loan.status === 'Verification_Pending' ? (
                      <span className="text-xs text-slate-600 font-medium italic">Awaiting Acceptance Signature</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input type="number" placeholder="₹" value={collectionAmount[loan.id] || ''} onChange={e => setCollectionAmount({ ...collectionAmount, [loan.id]: e.target.value })} className="w-20 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white text-center font-bold" />
                        <button onClick={() => handleRecordCollection(loan.id, loan.collected)} className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"><Check className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    {loan.status === 'Verification_Pending' ? (
                      <button onClick={async () => { await supabase.from('live_loans').update({ status: 'Active' }).eq('id', loan.id); loadDashboardLedger(); }} className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 uppercase transition-all shadow-md mx-auto"><CheckCircle2 className="h-3.5 w-3.5" /> Approve Verification</button>
                    ) : (
                      <button onClick={() => handleToggleStatusComplete(loan.id, loan.status)} className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase ${loan.status === 'Settled_Done' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{loan.status === 'Settled_Done' ? '✅ Settled' : 'Mark Settled'}</button>
                    )}
                  </td>
                  <td className="py-3.5 pl-2 text-right"><button onClick={async () => { if (confirm("Erase entry permanently?")) { await supabase.from('live_loans').delete().eq('id', loan.id); loadDashboardLedger(); } }} className="p-2 text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC MODALS (SELECTED DOSSIER / CLIENT EDITING OVERLAYS) */}
      {selectedLoanFile && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4">
            <button onClick={() => setSelectedLoanFile(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800"><X className="h-4 w-4" /></button>
            <h3 className="text-xl font-black text-white">👤 Debtor Financial Dossier</h3>
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/40 space-y-2 text-slate-300">
                <p><strong>Identity Card Reference:</strong> {selectedLoanFile.governmentId}</p>
                <p><strong>Home Location Address:</strong> {selectedLoanFile.address}</p>
                <p><strong>Guarantor Mobile Contact:</strong> {selectedLoanFile.guarantor}</p>
                <p><strong>Pledged Security Collateral Asset:</strong> {selectedLoanFile.collateral}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLoan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 shadow-2xl">
            <button onClick={() => setEditingLoan(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
            <h3 className="text-lg font-black text-white">Modify Client Profile</h3>
            <form onSubmit={handleSaveChangesOverride} className="space-y-4 pt-2 border-t border-slate-800 text-xs">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client Full Name</label><input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none" /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase">Mobile Phone</label><input required type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none" /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase">Home Address</label><textarea rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase">Collateral Notes</label><input type="text" value={editForm.collateral} onChange={e => setEditForm({ ...editForm, collateral: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3.5 rounded-xl uppercase text-xs mt-2">Commit Updates</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}