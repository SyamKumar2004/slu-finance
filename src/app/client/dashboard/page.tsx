'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, AlertCircle, CheckCircle2, Lock, FileText, Send, Eye, Edit3, Smartphone } from 'lucide-react';

export default function ClientDashboardPortal() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dossier' | 'security'>('dossier');
  
  const [clientProfile, setClientProfile] = useState({ name: 'Valued Client', email: '', phone: '' });
  const [loans, setLoans] = useState<any[]>([]);

  const [securityForm, setSecurityForm] = useState({ newPass: '', confirmPass: '' });
  const [changeRequestText, setChangeRequestText] = useState('');
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
      setClientProfile({ name: profile.full_name, email: profile.email || 'N/A', phone: profile.phone_number });
      
      const { data: dynamicLoans } = await supabase
        .from('live_loans')
        .select('*')
        .eq('client_phone', profile.phone_number);

      if (dynamicLoans) {
        const mapped = dynamicLoans.map((l: any) => {
          const p = Number(l.principal_amount || 0);
          const r = Number(l.interest_rate || 0);
          const collected = Number(l.total_collected || 0);
          const totalDebt = p + (p * (r / 100));
          return {
            ...l,
            totalPayableDebt: totalDebt,
            remainingBalance: totalDebt - collected
          };
        });
        setLoans(mapped);
      }
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
    if (securityForm.newPass.length < 6) { alert("Security Notice: Minimum required key length is 6 parameters."); return; }
    if (securityForm.newPass !== securityForm.confirmPass) { alert("Validation Error: Input key arrays do not match."); return; }

    setProcessingAction(true);
    const { error } = await supabase.from('user_profiles').update({ password_hash: securityForm.newPass }).eq('phone_number', clientProfile.phone);
    
    if (!error) {
      alert("Success: Your security passkey credentials have been updated live inside system rows!");
      setSecurityForm({ newPass: '', confirmPass: '' });
    } else {
      alert(`Update Error: ${error.message}`);
    }
    setProcessingAction(false);
  };

  const handleDispatchAdministrativeEditRequest = async (e: React.FormEvent, loanId: string) => {
    e.preventDefault();
    if (!changeRequestText.trim()) return;

    setProcessingAction(true);
    const { error } = await supabase.from('live_loans').update({ edit_change_request_text: changeRequestText.trim() }).eq('id', loanId);
    
    if (!error) {
      alert("Request Transmitted: Your credit manager has been alerted to review your profile attributes.");
      setChangeRequestText('');
      verifyClientSession();
    } else {
      alert(`Submission Error: ${error.message}`);
    }
    setProcessingAction(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-emerald-400 font-bold text-xs uppercase animate-pulse tracking-widest">Decrypting Session Matrix...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 antialiased p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* HEADER NAVBAR CONTAINER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-slate-900 max-w-5xl mx-auto gap-4">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-1.5">
            <ShieldCheck className="text-emerald-400" /> SLU FINANCE
          </h1>
          <p className="text-xs text-slate-500 font-medium">Customer Credit Verification Workspace</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => setActiveTab('dossier')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'dossier' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}>My Credit Dossier</button>
          <button type="button" onClick={() => setActiveTab('security')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}>Security Options</button>
          <button type="button" onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="p-2.5 rounded-xl bg-rose-950/20 text-rose-400 border border-rose-900/20 hover:bg-rose-950/60 transition-all"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      {/* CORE WORKSPACE SURFACE HOOK */}
      <main className="max-w-5xl mx-auto">
        
        {activeTab === 'dossier' && (
          <div className="space-y-6">
            <h2 className="text-md font-bold text-white flex items-center gap-1.5"><FileText className="text-emerald-500 h-4 w-4" /> Your Certified Active Credit Lines</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {loans.length === 0 ? (
                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
                  <AlertCircle className="text-amber-500 h-6 w-6" />
                  No active credit records associated with your verified phone number.
                </div>
              ) : (
                loans.map(loan => (
                  <React.Fragment key={loan.id}>
                    {/* Left Side: Loan Summary Card */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl relative">
                      <div>
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Remaining Liability Balance</span>
                            <h3 className="text-2xl sm:text-3xl font-black text-white mt-0.5">₹{loan.remainingBalance.toLocaleString()}</h3>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            loan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            loan.status === 'Closed' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                          }`}>
                            {loan.status === 'Verification_Pending' ? '⚠️ Awaiting Signature' : loan.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold pt-4 border-t border-slate-800/60 text-slate-400">
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800"><span className="text-[9px] text-slate-500 block">PRINCIPAL FINANCED</span><span className="text-slate-100 block mt-0.5">₹{Number(loan.principal_amount).toLocaleString()}</span></div>
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800"><span className="text-[9px] text-slate-500 block">INTEREST RATE</span><span className="text-slate-100 block mt-0.5">{loan.interest_rate}%</span></div>
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800"><span className="text-[9px] text-slate-500 block">TOTAL CONTRACT DEBT</span><span className="text-white block mt-0.5">₹{loan.totalPayableDebt.toLocaleString()}</span></div>
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800"><span className="text-[9px] text-emerald-500 block">REPAYMENT SCHEDULE</span><span className="text-emerald-400 block mt-0.5">₹{loan.installment_amount} / {loan.tenure_type}</span></div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Verification Scans Archive:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between"><span className="text-slate-400 font-bold truncate">Government ID Card</span><button type="button" onClick={() => alert(`Streaming verification scan metadata...`)} className="text-emerald-400 p-1"><Eye className="h-3.5 w-3.5" /></button></div>
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between"><span className="text-slate-400 font-bold truncate">Signed Contract Sheet</span><button type="button" onClick={() => alert(`Streaming signature asset...`)} className="text-emerald-400 p-1"><Eye className="h-3.5 w-3.5" /></button></div>
                          </div>
                        </div>
                      </div>

                      {loan.status === 'Verification_Pending' && (
                        <button 
                          type="button" 
                          onClick={async () => { 
                            await supabase.from('live_loans').update({ status: 'Customer_Accepted' }).eq('id', loan.id); 
                            alert('Terms Accepted. Awaiting final corporate funding release...'); 
                            verifyClientSession(); 
                          }} 
                          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black p-3.5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Sign & Authorize Terms Agreement
                        </button>
                      )}

                      {loan.status === 'Customer_Accepted' && (
                        <div className="w-full mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" /> Signed & Awaiting Corporate Release
                        </div>
                      )}
                    </div>

                    {/* Right Side: Admin Profile Edit Request Input Module */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5 mb-1"><Edit3 className="text-blue-400 h-4 w-4" /> Request Profile Updates</h3>
                        <p className="text-[11px] text-slate-500">Need to modify your home address or profile coordinates? Transmit a request log to your assigned administrator.</p>
                      </div>
                      <form onSubmit={(e) => handleDispatchAdministrativeEditRequest(e, loan.id)} className="space-y-3 pt-4 text-xs font-semibold">
                        <div>
                          <textarea required rows={3} value={changeRequestText} onChange={e => setChangeRequestText(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none placeholder-slate-600 text-xs shadow-inner" placeholder="Specify requested profile edits..." />
                        </div>
                        <button type="submit" disabled={processingAction} className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold p-3 rounded-xl uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md">{processingAction ? 'Transmitting...' : 'Transmit Modification Notes'} <Send className="h-3 w-3" /></button>
                      </form>
                    </div>
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW TWO: PASSKEY SECURITY CONTROL */}
        {activeTab === 'security' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="pb-3 border-b border-slate-800/60">
              <h3 className="text-md font-black text-white flex items-center gap-2"><Lock className="text-emerald-400 h-4 w-4" /> Update Passkey Credentials</h3>
            </div>
            
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-bold space-y-1.5 text-slate-400">
              <p className="flex justify-between gap-2 truncate"><span>Phone:</span> <span className="text-slate-100 font-mono">{clientProfile.phone}</span></p>
            </div>

            <form onSubmit={handleModifyPasswordLive} className="space-y-4 text-xs font-bold">
              <div><label className="text-slate-400 uppercase">New Passkey String</label><input required type="password" value={securityForm.newPass} onChange={e => setSecurityForm({ ...securityForm, newPass: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" placeholder="••••••••" /></div>
              <div><label className="text-slate-400 uppercase">Confirm Password</label><input required type="password" value={securityForm.confirmPass} onChange={e => setSecurityForm({ ...securityForm, confirmPass: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" placeholder="••••••••" /></div>
              <button type="submit" disabled={processingAction} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-3.5 rounded-xl uppercase tracking-wider transition-all shadow-lg">{processingAction ? 'Syncing...' : 'Commit Passkey Assignment Update'}</button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}