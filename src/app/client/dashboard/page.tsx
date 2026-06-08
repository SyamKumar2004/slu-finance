'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, Wallet, Percent, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ClientDashboardPortal() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('Valued Client');
  const [personalLoans, setPersonalLoans] = useState<any[]>([]);

  useEffect(() => {
    verifyClientSession();
  }, []);

  async function verifyClientSession() {
    // Read local storage session values first for high-velocity lookups
    const activeLocalSession = localStorage.getItem('slu_session_active');
    const locallySavedName = localStorage.getItem('slu_user_name');
    const locallySavedEmail = localStorage.getItem('slu_user_email');

    // Query your custom user profiles directory directly to resolve session data strings
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`email.eq.${locallySavedEmail},full_name.eq.${locallySavedName}`)
      .maybeSingle();

    if (profile) {
      setClientName(profile.full_name);
      
      // Fetch only the specific loans underwritten to this user's phone number contact
      const { data: dynamicLoans } = await supabase
        .from('live_loans')
        .select('*')
        .eq('client_phone', profile.phone_number);

      if (dynamicLoans) {
        const structuralMappedLoans = dynamicLoans.map((l: any) => {
          const principalVal = Number(l.principal_amount || 0);
          const rateVal = Number(l.interest_rate || 0);
          const totalDebtLiability = principalVal + (principalVal * (rateVal / 100)); // Total contract math

          return {
            ...l,
            totalPayableDebt: totalDebtLiability,
            remainingBalance: totalDebtLiability - Number(l.total_collected || 0) // True dynamic outstanding debt
          };
        });
        setPersonalLoans(structuralMappedLoans);
      }
    } else {
      // If no local metadata is active, redirect to authorization terminal
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }

  const handleSignOut = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans">
        <div className="text-emerald-400 font-bold tracking-widest text-xs uppercase animate-pulse">Decrypting Security Session Node...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 antialiased p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Top Client Navbar */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-900 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" /> SLU FINANCE
          </h1>
          <p className="text-xs text-slate-500 font-medium">Secure Client Credit Desk</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            👤 {clientName}
          </span>
          <button type="button" onClick={handleSignOut} className="p-2.5 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/30 hover:bg-rose-950/80 transition-all">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Client Content Area */}
      <main className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-white">Your Underwritten Accounts</h2>

        {personalLoans.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
            <AlertCircle className="text-amber-500 h-6 w-6" />
            No active or pending credit lines found associated with your verified phone record string.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personalLoans.map((loan) => (
              <div key={loan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Remaining Outstanding Debt</span>
                      <h3 className="text-3xl font-black text-white mt-1">₹{loan.remainingBalance.toLocaleString()}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      loan.status === 'Active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {loan.status === 'Verification_Pending' ? '⚠️ Pending Accept' : loan.status}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-800/60 pt-4 text-xs font-semibold text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-slate-500" /> Initial Principal Sum</span>
                      <span className="text-slate-300">₹{Number(loan.principal_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-slate-500" /> Interest Contract Rate</span>
                      <span className="text-slate-300">{loan.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-slate-500" /> Total Contract Debt Payback</span>
                      <span className="text-white font-bold">₹{loan.totalPayableDebt.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-500" /> Installment Structure</span>
                      <span className="text-emerald-400 font-black">₹{loan.installment_amount} / {loan.tenure_type}</span>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC ACCEPT AGREEMENT TERMS HANDSHAKE BUTTON */}
                {loan.status === 'Verification_Pending' && (
                  <button 
                    type="button" 
                    onClick={async () => {
                      const { error } = await supabase.from('live_loans').update({ status: 'Active' }).eq('id', loan.id);
                      if (!error) {
                        alert('Signature Authenticated! You have officially accepted the interest terms and repayment schedule guidelines.');
                        verifyClientSession();
                      }
                    }} 
                    className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black p-3 rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Sign & Authorize Terms Agreement
                  </button>
                )}
                
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}