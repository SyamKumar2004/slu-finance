'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, AlertCircle, CheckCircle2, Lock, FileText, User, Mail, MapPin, Landmark, Smartphone, Calendar } from 'lucide-react';

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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`email.eq.${locallySavedEmail},full_name.eq.${locallySavedName}`)
      .maybeSingle();

    if (profile) {
      const { data: dynamicLoans } = await supabase
        .from('live_loans')
        .select('*')
        .eq('client_phone', profile.phone_number);

      const now = new Date();

      const mappedLoans = await Promise.all((dynamicLoans || []).map(async (l: any) => {
        const p = Number(l.principal_amount || 0);
        const r = Number(l.interest_rate || 0);
        const collected = Number(l.total_collected || 0);
        const totalDebt = p + (p * (r / 100));

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

        const nextPayDate = l.next_installment_date ? new Date(l.next_installment_date) : null;
        const isOverdue = l.status === 'Active' && nextPayDate && now > nextPayDate;

        return {
          ...l,
          originLenderName: issuingLenderName,
          totalPayableDebt: totalDebt,
          remainingBalance: Math.max(0, totalDebt - collected),
          isOverdue
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

  const formatLocalDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto text-sm">
          <button type="button" onClick={() => setActiveTab('dossier')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black uppercase tracking-wider border transition-all ${activeTab === 'dossier' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}>My Credit Dossier</button>
          <button type="button" onClick={() => window.location.reload()} className="md:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400"><Smartphone className="h-4 w-4" /></button>
          <button type="button" onClick={() => setActiveTab('security')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black uppercase tracking-wider border transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-slate-200 border-transparent'}`}>Security Settings</button>
          <button type="button" onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="p-2.5 rounded-xl bg-rose-950/20 text-rose-400 border border-rose-900/20 hover:bg-rose-950/60 transition-all"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      {/* CORE WORKSPACE SURFACE HOOK */}
      <main className="max-w-5xl mx-auto space-y-6">
        
        {/* WELCOME CLIENT GREETING BANNER CONTAINER */}
        <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-white">Welcome, {clientProfile.name} 👋</h2>
          <p className="text-sm sm:text-base text-slate-400 font-bold mt-1.5">Access and verify your certified active lines, payment timelines, and underwritten file copies.</p>
        </div>

        {activeTab === 'dossier' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT COLUMN: ACTIVE ACCOUNT CREDITS */}
            <div className="lg:col-span-2 space-y-6">
              {loans.length === 0 ? (
                <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-bold flex flex-col items-center gap-2 text-base">
                  <AlertCircle className="text-amber-500 h-6 w-6" /> No active credit statements associated with this user handle.
                </div>
              ) : (
                loans.map(loan => (
                  <div key={loan.id} className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                    
                    {/* TIMELINE NOTIFICATION BAR UPGRADE */}
                    {loan.isOverdue && (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-sm font-bold text-rose-400 animate-pulse">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div>
                          <span className="block font-black uppercase text-xs tracking-wider">Repayment Deadline Breach Warning</span>
                          Your scheduled installment due date of {formatLocalDate(loan.next_installment_date)} has exceeded. Please clear arrears to prevent record delinquency status.
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-4 gap-4">
                      <div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Account Remaining Balance</span>
                        <h3 className="text-3xl sm:text-4xl font-black text-white mt-1">₹{loan.remainingBalance.toLocaleString()}</h3>
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-500 uppercase block tracking-wider">Creditor Account Partner</span>
                        <span className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1.5 mt-1"><Landmark className="h-5 w-5 shrink-0" /> {loan.originLenderName}</span>
                      </div>
                    </div>

                    {/* DYNAMIC METRIC LABELS FOR TIMELINE INTEGRATIONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-black text-slate-400">
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-xs text-slate-500 block uppercase tracking-wide">Next Installment Due</span><span className={`text-base sm:text-lg block mt-1 font-mono ${loan.isOverdue ? 'text-rose-400' : 'text-slate-100'}`}>{loan.status === 'Closed' ? '-' : formatLocalDate(loan.next_installment_date)}</span></div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-xs text-slate-500 block uppercase tracking-wide">Final Maturity Settlement</span><span className="text-slate-100 text-base sm:text-lg block mt-1 font-mono">{formatLocalDate(loan.final_settlement_date)}</span></div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-xs text-slate-500 block uppercase tracking-wide">Principal Financed</span><span className="text-slate-100 text-base block mt-1">₹{Number(loan.principal_amount).toLocaleString()}</span></div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800"><span className="text-xs text-emerald-500 block uppercase tracking-wide">Repayment Installment</span><span className="text-emerald-400 text-base block mt-1">₹{loan.installment_amount} / {loan.tenure_type}</span></div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/30 p-4 rounded-xl border border-slate-800 text-sm font-bold text-slate-400">
                      <span className="uppercase tracking-wider text-xs text-slate-500">Status Matrix:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border tracking-wider ${
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
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
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
                <h3 className="text-base font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5"><User className="text-emerald-400 h-5 w-5" /> Certified Profile Dossier</h3>
                <p className="text-xs text-slate-500 mt-1">Underwritten fields are locked into read-only system status for ledger security constraints.</p>
              </div>

              <div className="space-y-4 text-sm font-bold text-slate-400">
                <div className="space-y-1.5"><span className="text-xs text-slate-500 uppercase block tracking-wide">Registered Full Name</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white font-black text-base">{clientProfile.name}</div></div>
                <div className="space-y-1.5"><span className="text-xs text-slate-500 uppercase block tracking-wide flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> User Email Endpoint</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white text-sm truncate font-medium">{clientProfile.email}</div></div>
                <div className="space-y-1.5"><span className="text-xs text-slate-500 uppercase block tracking-wide flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Home Residential Location</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-white text-sm font-medium">{clientProfile.address}</div></div>
                <div className="space-y-1.5"><span className="text-xs text-slate-500 uppercase block tracking-wide flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Identity Records Reference</span><div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono select-none">{clientProfile.govId}</div></div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW TWO: SECURITY CREDENTIAL PASSKEY MODIFIER */}
        {activeTab === 'security' && (
          <div className="max-w-md mx-auto bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-800/60">
              <h3 className="text-base font-black text-white flex items-center gap-2"><Lock className="text-emerald-400 h-5 w-5" /> Modify System Passkey</h3>
              <p className="text-xs text-slate-500 mt-0.5">Update your customer credential keys live inside protected database records.</p>
            </div>
            
            <form onSubmit={handleModifyPasswordLive} className="space-y-4 text-sm font-bold">
              <div><label className="text-slate-400 uppercase tracking-wide">New Access Passkey</label><input required type="password" value={securityForm.newPass} onChange={e => setSecurityForm({ ...securityForm, newPass: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none font-mono tracking-widest text-base" placeholder="••••••••" /></div>
              <div><label className="text-slate-400 uppercase tracking-wide">Confirm Password String</label><input required type="password" value={securityForm.confirmPass} onChange={e => setSecurityForm({ ...securityForm, confirmPass: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none font-mono tracking-widest text-base" placeholder="••••••••" /></div>
              <button type="submit" disabled={processingAction} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-4 rounded-xl uppercase tracking-wider transition-all shadow-lg text-xs sm:text-sm">
                {processingAction ? 'Syncing...' : 'Commit Passkey Assignment Update'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}