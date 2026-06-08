'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, AlertCircle, CheckCircle2, Lock, FileText, Eye, User, Mail, MapPin, Landmark, Smartphone } from 'lucide-react';

export default function ClientDashboardPortal() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dossier' | 'security'>('dossier');
  
  const [clientProfile, setClientProfile] = useState({ name: 'Valued Client', email: '', phone: '', address: 'N/A', govId: 'N/A' });
  const [loans, setLoans] = useState<any[]>([]);

  const [securityForm, setSecurityForm] = useState({ newPass: '', confirmPass: '' });
  const [processingAction, setProcessingAction] = useState(false);

  const verifyClientSession = useCallback(async () => {
    const locallySavedName = localStorage.getItem('slu_user_name');
    const locallySavedEmail = localStorage.getItem('slu_user_email');

    // Fetch the primary client profile record details
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`email.eq.${locallySavedEmail},full_name.eq.${locallySavedName}`)
      .maybeSingle();

    if (profile) {
      // Pull loan ledger details associated with this account
      const { data: dynamicLoans } = await supabase
        .from('live_loans')
        .select('*')
        .eq('client_phone', profile.phone_number);

      const mappedLoans = await Promise.all((dynamicLoans || []).map(async (l: any) => {
        const p = Number(l.principal_amount || 0);
        const r = Number(l.interest_rate || 0);
        const collected = Number(l.total_collected || 0);
        const totalDebt = p + (p * (r / 100));

        // Dynamic Lookup: Fetch the specific full name of the lender who issued this loan row
        let issuingLenderName = 'SLU Credit Executive';
        if (l.lender_id) {
          const { data: lenderProfile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', l.lender_id)
            .maybeSingle();
          if (lenderProfile?.full_name) {
            issuingLenderName = lenderProfile.full_name;
          }
        }

        return {
          ...l,
          originLenderName: issuingLenderName,
          totalPayableDebt: totalDebt,
          remainingBalance: Math.max(0, totalDebt - collected)
        };
      }));

      const referenceLoan = dynamicLoans?.[0] || {};
      
      setClientProfile({
        name: profile.full_name,
        email: profile.email || 'N/A',
        phone: profile.phone_number,
        address: referenceLoan.residential_address || 'Not Specified',
        govId: referenceLoan.government_id_number ? '[Identity Verification Active]' : 'Not Provided'
      });
      setLoans(mappedLoans);
    } else {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { 
    verifyClientSession(); 
  }, [verifyClientSession]);

  const handleModifyPasswordLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPass.length < 6) { alert("Security Notice: Minimum key length required is 6 characters."); return; }
    if (securityForm.newPass !== securityForm.confirmPass) { alert("Validation Error: Passwords do not match."); return; }

    setProcessingAction(true);
    const { error } = await supabase.from('user_profiles').update({ password_hash: securityForm.newPass }).eq('phone_number', clientProfile.phone);
    
    if (!error) {
      alert("Success: Your account password credentials have been securely updated!");
      setSecurityForm({ newPass: '', confirmPass: '' });
    } else {
      alert(`Update Error: ${error.message}`);
    }
    setProcessingAction(false);
  };

  if (loading) return <div className="min-h-screen bg-[#070b19] flex items-center justify-center font-mono text-emerald-400 animate-pulse text-sm uppercase tracking-widest">Decrypting Profile Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 antialiased p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* BRANDING TOP BAR HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-slate-800 max-w-5xl mx-auto gap-4">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-1.5">
            <ShieldCheck className="text-emerald-400 h-5 w-5" /> SLU FINANCE
          </h1>
          <p className="text-xs text-slate-500 font-black tracking-widest uppercase mt-0.5">Client Verification Desk</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button type="button" onClick={() => setActiveTab('dossier')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${activeTab === 'dossier' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}>My Credit Dossier</button>
          <button type="button" onClick={() => setActiveTab('security')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}>Security Settings</button>
          <button type="button" onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="p-2.5 rounded-xl bg-rose-950/20 text-rose-400 border border-rose-900/20 hover:bg-rose-950/60 transition-all"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      {/* CORE WORKSPACE SURFACE HOOK */}
      <main className="max-w-5xl mx-auto space-y-6">
        
        {/* WELCOME CLIENT GREETING BANNER CONTAINER */}
        <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl sm:text-2xl font-black text-white">Welcome, {clientProfile.name} 👋</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-bold mt-1.5">Access and verify your certified active lines, payment timelines, and underwritten file copies.</p>
        </div>

        {activeTab === 'dossier' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT COLUMN: ACTIVE ACCOUNT CREDITS */}
            <div className="lg:col-span-2 space-y-6">
              {loans.length === 0 ? (
                <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-bold flex flex-col items-center gap-2">
                  <AlertCircle className="text-amber-500 h-6 w-6" /> No active credit statements associated with this user handle.
                </div>
              ) : (
                loans.map(loan => (
                  <div key={loan.id} className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-4 gap-4">
                      <div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Account Remaining Balance</span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">₹{loan.remainingBalance.toLocaleString()}</h3>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Creditor Account Partner</span>
                        <span className="text-sm sm:text-base font-black text-emerald-400 flex items-center gap-1.5 mt-1"><Landmark className="h-4 w-4 shrink-0" /> {loan.originLenderName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-black text-slate-400">
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-[10px] text-slate-500 block uppercase tracking-wide">Principal Financed</span><span className="text-slate-100 text-sm sm:text-base block mt-1">₹{Number(loan.principal_amount).toLocaleString()}</span></div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-[10px] text-slate-500 block uppercase tracking-wide">Interest Rate</span><span className="text-slate-100 text-sm block mt-1">{loan.interest_rate}%</span></div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-[10px] text-slate-500 block uppercase tracking-wide">Gross Contract Debt</span><span className="text-white text-sm sm:text-base block mt-1">₹{loan.totalPayableDebt.toLocaleString()}</span></div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-[10px] text-emerald-500 block uppercase tracking-wide">Repayment Installment</span><span className="text-emerald-400 text-sm sm:text-base block mt-1">₹{loan.installment_amount} / {loan.tenure_type}</span></div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/30 p-4 rounded-xl border border-slate-800 text-xs font-bold text-slate-400">
                      <span className="uppercase tracking-wider text-[10px] text-slate-500">Status Matrix:</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${
                        loan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        loan.status === 'Closed' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                      }`}>
                        {loan.status === 'Verification_Pending' ? '⚠️ Awaiting Signature' : loan.status}
                      </span>
                    </div>

                    {loan.status === 'Verification_Pending' && (
                      <button 
                        type="button" 
                        onClick={async () => { 
                          await supabase.from('live_loans').update({ status: 'Customer_Accepted' }).eq('id', loan.id); 
                          alert('Terms Authorized! Awaiting corporate capital disbursement.'); 
                          verifyClientSession(); 
                        }} 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Sign & Authorize Contract Sheet
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* RIGHT COLUMN: READ-ONLY CLIENT ACCOUNTS DOSSIER */}
            <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5"><User className="text-emerald-400 h-4 w-4" /> Certified Profile Dossier</h3>
                <p className="text-[11px] text-slate-500 mt-1">Underwritten fields are locked into read-only system status for ledger security constraints.</p>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-400">
                <div className="space-y-1.5"><span className="text-[10px] text-slate-500 uppercase block tracking-wide">Registered Full Name</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white font-black text-sm">{clientProfile.name}</div></div>
                <div className="space-y-1.5"><span className="text-[10px] text-slate-500 uppercase block tracking-wide flex items-center gap-1"><Mail className="h-3 w-3" /> User Email Endpoint</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white text-sm truncate font-medium">{clientProfile.email}</div></div>
                <div className="space-y-1.5"><span className="text-[10px] text-slate-500 uppercase block tracking-wide flex items-center gap-1"><MapPin className="h-3 w-3" /> Home Residential Location</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white text-sm font-medium">{clientProfile.address}</div></div>
                <div className="space-y-1.5"><span className="text-[10px] text-slate-500 uppercase block tracking-wide flex items-center gap-1"><FileText className="h-3 w-3" /> Identity Records Reference</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono select-none">{clientProfile.govId}</div></div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW TWO: SECURITY CREDENTIAL PASSKEY MODIFIER */}
        {activeTab === 'security' && (
          <div className="max-w-md mx-auto bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-800/60">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><Lock className="text-emerald-400 h-4 w-4" /> Modify System Passkey</h3>
              <p className="text-xs text-slate-500 mt-0.5">Update your customer credential keys live inside protected database records.</p>
            </div>
            
            <form onSubmit={handleModifyPasswordLive} className="space-y-4 text-xs font-bold">
              <div><label className="text-slate-400 uppercase tracking-wide">New Access Passkey</label><input required type="password" value={securityForm.newPass} onChange={e => setSecurityForm({ ...securityForm, newPass: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none font-mono tracking-widest text-sm" placeholder="••••••••" /></div>
              <div><label className="text-slate-400 uppercase tracking-wide">Confirm Password String</label><input required type="password" value={securityForm.confirmPass} onChange={e => setSecurityForm({ ...securityForm, confirmPass: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none font-mono tracking-widest text-sm" placeholder="••••••••" /></div>
              <button type="submit" disabled={processingAction} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-3.5 rounded-xl uppercase tracking-wider transition-all shadow-lg text-xs">
                {processingAction ? 'Syncing...' : 'Commit Passkey Assignment Update'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}