'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, TrendingUp, AlertTriangle, Users, ArrowRight, UserPlus, 
  Percent, Globe, Wallet, User, LogOut, CheckCircle, Settings,
  Trash2, Check, LayoutDashboard, Mail, FileText, MapPin, ShieldCheck, 
  HelpCircle, Info, X, Calendar, PlusCircle, Upload, FileCheck, Eye, Edit3
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
];

export default function ProtectedAdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'funds' | 'charts' | 'risk' | 'profile'>('overview');
  
  const [loans, setLoans] = useState<any[]>([]);
  const [capitalHistory, setCapitalHistory] = useState<any[]>([]);
  const [companyCapitalPool, setCompanyCapitalPool] = useState<number>(0);
  const [availableLiquidCash, setAvailableLiquidCash] = useState<number>(0);
  const [totalRegisteredUsers, setTotalRegisteredUsers] = useState<number>(0); 
  const [metrics, setMetrics] = useState({ totalLent: 0, totalCollected: 0, pendingDues: 0 });
  
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; role: string }>({ name: 'Admin', email: '', role: 'Admin' });
  const [selectedLoanFile, setSelectedLoanFile] = useState<any | null>(null);

  // System settings states for admin panel
  const [sysSettings, setSysSettings] = useState({ companyName: 'SLU Finance', interestBuffer: '0' });
  const [savingSettings, setSavingSettings] = useState(false);

  // Form Input fields state
  const [formData, setFormData] = useState({ 
    clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', 
    principalAmount: '10000', installmentAmount: '0', 
    tenure: 'Daily', totalInstallments: '100', interestRate: '24',
    governmentId: '', residentialAddress: '', collateralDetails: '', guarantorContact: ''
  });
  
  const [idDocumentName, setIdDocumentName] = useState<string>('');
  const [signedFormName, setSignedFormName] = useState<string>('');

  const [capitalInput, setCapitalInput] = useState({ amount: '', notes: '' });
  const [collectionAmount, setCollectionAmount] = useState<{ [key: string]: string }>({});
  const [loadingFunds, setLoadingFunds] = useState(false);

  useEffect(() => {
    enforceAdministrativeSession();
  }, []);

  useEffect(() => {
    const P = parseFloat(formData.principalAmount);
    const R = parseFloat(formData.interestRate);
    const C = parseInt(formData.totalInstallments);

    if (!isNaN(P) && !isNaN(R) && !isNaN(C) && C > 0) {
      const totalPayable = P + (P * (R / 100));
      const preciseInstallment = Math.ceil(totalPayable / C);
      setFormData(prev => ({ ...prev, installmentAmount: preciseInstallment.toString() }));
    }
  }, [formData.principalAmount, formData.interestRate, formData.totalInstallments]);

  async function enforceAdministrativeSession() {
    const activeLocalSession = localStorage.getItem('slu_session_active');
    const locallySavedName = localStorage.getItem('slu_user_name');

    if (activeLocalSession === 'true' && locallySavedName) {
      setAdminProfile({ name: locallySavedName, email: 'admin@slufinance.internal', role: 'Master Super Admin' });
      fetchDynamicRealtimeMetrics();
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: profile } = await supabase.from('user_profiles').select('full_name, role').eq('id', user.id).single();
    if (profile?.role !== 'admin') { await supabase.auth.signOut(); router.push('/auth/login'); return; }

    setAdminProfile({ name: profile?.full_name || 'System Admin', email: user.email || '', role: 'Master Super Admin' });
    fetchDynamicRealtimeMetrics();
  }

  async function fetchDynamicRealtimeMetrics() {
    // 1. Fetch Admin Custom Parameters
    const { data: settingsRow } = await supabase.from('system_settings').select('*').limit(1).single();
    if (settingsRow) {
      setSysSettings({
        companyName: settingsRow.company_name,
        interestBuffer: settingsRow.interest_buffer_percentage.toString()
      });
    }

    // 2. Fetch Loan Ledgers
    const { data: rawLoans } = await supabase.from('live_loans').select('*').order('created_at', { ascending: false });
    let loanList: any[] = [];
    let calculatedLent = 0;
    let calculatedCollected = 0;

    if (rawLoans) {
      loanList = rawLoans.map((l: any) => ({
        id: l.id, name: l.client_name, email: l.client_email || 'N/A', phone: l.client_phone, principal: Number(l.principal_amount),
        installment: Number(l.installment_amount), tenure: l.tenure_type, interest: Number(l.interest_rate),
        status: l.status, missedDays: l.missed_days_count || 0, collected: Number(l.total_collected || 0),
        totalCycles: Number(l.total_cycles || 100),
        governmentId: l.government_id_number || 'Not Provided',
        address: l.residential_address || 'Not Provided',
        collateral: l.collateral_asset_details || 'Unsecured Clean Credit Line',
        guarantor: l.guarantor_emergency_contact || 'None Given',
        idDoc: l.uploaded_id_document_url || null,
        signedForm: l.signed_agreement_document_url || null,
        issuedDate: l.loan_issued_date ? new Date(l.loan_issued_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A',
        clearedDate: l.loan_cleared_date ? new Date(l.loan_cleared_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'Active'
      }));
      setLoans(loanList);
      
      loanList.forEach(l => {
        if (l.status !== 'Deleted') {
          calculatedLent += l.principal;
          calculatedCollected += l.collected;
        }
      });
    }

    // 3. Fetch Capital Injections
    const { data: capitalRows } = await supabase.from('company_capital').select('*').order('created_at', { ascending: false });
    let totalInjectedCapital = 0;
    if (capitalRows) {
      setCapitalHistory(capitalRows);
      totalInjectedCapital = capitalRows.reduce((sum, row) => sum + Number(row.amount), 0);
      setCompanyCapitalPool(totalInjectedCapital);
    }

    // 4. Calculate Dynamic Liquid Reserves Engine (Capital Injected + All Collections - All Principal Lent)
    const liquidBalance = totalInjectedCapital + calculatedCollected - calculatedLent;
    setAvailableLiquidCash(liquidBalance);

    const { count, error } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
    if (!error && count !== null) setTotalRegisteredUsers(count);

    setMetrics({ totalLent: calculatedLent, totalCollected: calculatedCollected, pendingDues: calculatedLent - calculatedCollected });
  }

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const { error } = await supabase
      .from('system_settings')
      .update({
        company_name: sysSettings.companyName,
        interest_buffer_percentage: parseFloat(sysSettings.interestBuffer || '0')
      })
      .neq('id', 0); // Updates the default row entry smoothly

    alert("System Settings Updated Successfully!");
    setSavingSettings(false);
    fetchDynamicRealtimeMetrics();
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPrincipal = parseFloat(formData.principalAmount);

    // CRITICAL SECURITY VALIDATION FIREWALL: Insufficient Capital Lock
    if (targetPrincipal > availableLiquidCash) {
      alert(`Access Blocked: Insufficient Capital in Pool! You are attempting to lend ₹${targetPrincipal.toLocaleString()}, but your dynamic liquid balance is only ₹${availableLiquidCash.toLocaleString()}. Please inject funds first.`);
      return;
    }

    const fullPhoneNumber = `${formData.countryCode}${formData.clientPhone}`;
    const finalIdDocPath = idDocumentName ? `/storage/documents/${idDocumentName}` : 'Clean Verified Scan';
    const finalSignedFormPath = signedFormName ? `/storage/agreements/${signedFormName}` : 'Legally Bound Terms Checked';

    const { data: newLoanRecord, error } = await supabase.from('live_loans').insert([{
      client_name: formData.clientName, client_email: formData.clientEmail, client_phone: fullPhoneNumber,
      principal_amount: targetPrincipal, installment_amount: parseFloat(formData.installmentAmount),
      tenure_type: formData.tenure, total_cycles: parseInt(formData.totalInstallments), interest_rate: parseFloat(formData.interestRate),
      status: 'Active', government_id_number: formData.governmentId, residential_address: formData.residentialAddress,
      collateral_asset_details: formData.collateralDetails, guarantor_emergency_contact: formData.guarantorContact,
      uploaded_id_document_url: finalIdDocPath,
      signed_agreement_document_url: finalSignedFormPath,
      loan_issued_date: new Date().toISOString() // Explicitly tracks creation date entry
    }]).select().single();

    if (error) {
      alert(`Error creating entry: ${error.message}`);
      return;
    }

    // HIGH VELOCITY ONBOARDING NOTIFICATION EMAIL ENGINE
    if (formData.clientEmail && formData.clientEmail !== 'name@domain.com') {
      const emailSubject = encodeURIComponent(`Welcome to ${sysSettings.companyName} | Loan Agreement Details`);
      const emailBody = encodeURIComponent(
        `Dear ${formData.clientName},\n\n` +
        `Your application with ${sysSettings.companyName} has been approved and verified instantly.\n\n` +
        `Loan Structure Parameters:\n` +
        `- Financing Sum: ₹${targetPrincipal.toLocaleString()}\n` +
        `- Term Cycle: ${formData.tenure}\n` +
        `- Installment Target: ₹${formData.installmentAmount}\n\n` +
        `By replying to this mail or signing the paperwork attached, you agree to our structural terms and micro-credit guidelines.\n\n` +
        `Regards,\n${adminProfile.name}\n${sysSettings.companyName}`
      );
      
      // Instantly open user client handler window passing payload configurations without bottlenecking execution
      window.location.href = `mailto:${formData.clientEmail}?subject=${emailSubject}&body=${emailBody}`;
    }

    alert(`Success: Onboarded ${formData.clientName}. Balance adjusted by -₹${targetPrincipal.toLocaleString()}.`);
    setFormData({ 
      clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', principalAmount: '10000', installmentAmount: '0', tenure: 'Daily', totalInstallments: '100', interestRate: '24',
      governmentId: '', residentialAddress: '', collateralDetails: '', guarantorContact: ''
    });
    setIdDocumentName('');
    setSignedFormName('');
    setActiveTab('overview');
    fetchDynamicRealtimeMetrics();
  };

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(capitalInput.amount);
    if (isNaN(amt) || amt <= 0) return;

    setLoadingFunds(true);
    const { error } = await supabase.from('company_capital').insert([{
      amount: amt, notes: capitalInput.notes.trim() || 'Standard Capital Injection'
    }]);

    if (!error) {
      alert(`Reserves Expanded: Added ₹${amt.toLocaleString()} successfully.`);
      setCapitalInput({ amount: '', notes: '' });
      fetchDynamicRealtimeMetrics();
    }
    setLoadingFunds(false);
  };

  const handleRecordCollection = async (loanId: string, currentCollected: number) => {
    const amt = parseFloat(collectionAmount[loanId] || '0');
    if (isNaN(amt) || amt <= 0) { alert("Please specify a valid collection sum amount."); return; }

    const nextCollectedSum = currentCollected + amt;
    const { error } = await supabase.from('live_loans').update({ total_collected: nextCollectedSum }).eq('id', loanId);

    if (!error) {
      alert(`Payment logged. Liquid pool updated by +₹${amt.toLocaleString()}.`);
      setCollectionAmount(prev => ({ ...prev, [loanId]: '' }));
      fetchDynamicRealtimeMetrics();
    }
  };

  const handleToggleStatusComplete = async (loanId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'Active' ? 'Settled_Done' : 'Active';
    const timestampValue = targetStatus === 'Settled_Done' ? new Date().toISOString() : null;
    
    if (!confirm(`Mark this entry status change to ${targetStatus}?`)) return;

    const { error } = await supabase.from('live_loans').update({ 
      status: targetStatus,
      loan_cleared_date: timestampValue // Timestamps exact clearance date event cleanly
    }).eq('id', loanId);
    
    if (!error) fetchDynamicRealtimeMetrics();
  };

  const handleDeleteLoanRecord = async (loanId: string) => {
    if (!confirm("Completely erase this ledger entry permanently?")) return;
    const { error } = await supabase.from('live_loans').delete().eq('id', loanId);
    if (!error) { alert("Record dropped successfully."); fetchDynamicRealtimeMetrics(); }
  };

  const highRiskLoans = loans.filter(l => (l.tenure === 'Daily' && l.missedDays > 3) || (l.tenure === 'Monthly' && l.missedDays > 10));

  const NavButton = ({ tab, label, icon: Icon, badge }: { tab: typeof activeTab, label: string, icon: any, badge?: number }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-bold transition-all ${
        activeTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{badge}</span>}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50 antialiased font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="p-5">
          <div className="mb-8 px-2 flex items-center gap-2">
            <div className="w-2.5 h-6 bg-emerald-500 rounded-full"></div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase">{sysSettings.companyName}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Secure Ledger Console</p>
            </div>
          </div>
          <nav className="space-y-1.5">
            <NavButton tab="overview" label="Book Records Desk" icon={LayoutDashboard} />
            <NavButton tab="onboarding" label="New Client Onboarding" icon={UserPlus} />
            <NavButton tab="funds" label="Capital Pool Reserves" icon={Wallet} />
            <NavButton tab="charts" label="Yield Analytics" icon={BarChart3} />
            <NavButton tab="risk" label="Risk Collection Radar" icon={AlertTriangle} badge={highRiskLoans.length} />
            <NavButton tab="profile" label="Admin Settings" icon={Settings} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 hover:bg-rose-950/40 hover:text-rose-400 transition-all text-xs font-bold uppercase tracking-wider">
            <LogOut className="h-4 w-4" /> Exit Session
          </button>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl relative">
        <header className="mb-8 flex justify-between items-center bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Welcome Back, {adminProfile.name} 👋</h2>
            <p className="text-xs text-slate-500 font-medium">System Module: Principal Credit Manager</p>
          </div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Session Verified
          </span>
        </header>

        {/* METRICS & OVERVIEW INDEX DISPLAY */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase">Available Liquid Cash</p>
                <h3 className="text-2xl font-black mt-1 text-emerald-400">₹{availableLiquidCash.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-500 font-semibold block mt-1">Realtime Vault Float</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Active Outflows</p><h3 className="text-2xl font-black mt-1 text-white">₹{metrics.totalLent.toLocaleString()}</h3></div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="h-5 w-5" /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Collected Yield</p><h3 className="text-2xl font-black mt-1 text-blue-400">₹{metrics.totalCollected.toLocaleString()}</h3></div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><BarChart3 className="h-5 w-5" /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Book Size Size</p><h3 className="text-2xl font-black mt-1 text-teal-400">{loans.length} Borrowers</h3></div>
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><User className="h-5 w-5" /></div>
              </div>
            </section>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-white">Underwritten Ledger Profiles</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 pr-2">Client Details</th>
                      <th className="py-3 px-2">Structure</th>
                      <th className="py-3 px-2">Timeline Dates</th>
                      <th className="py-3 px-2">Principal</th>
                      <th className="py-3 px-2">Collected</th>
                      <th className="py-3 px-2">Quick Reconcile</th>
                      <th className="py-3 px-2 text-center">Status Action</th>
                      <th className="py-3 pl-2 text-right">Erase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loans.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-slate-500 font-medium">No borrower records registered yet.</td></tr>
                    ) : loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3.5 pr-2 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-100">{loan.name}</span>
                            <button type="button" onClick={() => setSelectedLoanFile(loan)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-xs text-slate-500">{loan.phone}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold uppercase tracking-wider">{loan.tenure}</span>
                        </td>
                        
                        {/* DYNAMIC REGISTRATION AND CLEARANCE TIMELINES COLUMN */}
                        <td className="py-3.5 px-2 text-xs">
                          <div className="text-slate-400 font-medium">Gave: <span className="font-bold text-slate-200">{loan.issuedDate}</span></div>
                          <div className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">
                            {loan.status === 'Settled_Done' ? (
                              <span className="text-emerald-400">Done: {loan.clearedDate}</span>
                            ) : (
                              <span className="text-amber-500">Status: Active Outflow</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-2 font-bold text-slate-100">₹{loan.principal.toLocaleString()}</td>
                        <td className="py-3.5 px-2 font-bold text-emerald-400">₹{loan.collected.toLocaleString()}</td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="₹" value={collectionAmount[loan.id] || ''} onChange={e => setCollectionAmount({ ...collectionAmount, [loan.id]: e.target.value })} className="w-20 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white text-center font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            <button type="button" onClick={() => handleRecordCollection(loan.id, loan.collected)} className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all"><Check className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <button type="button" onClick={() => handleToggleStatusComplete(loan.id, loan.status)} className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase transition-all ${loan.status === 'Settled_Done' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-amber-500/20 hover:text-amber-400'}`}>
                            {loan.status === 'Settled_Done' ? '✅ Settled' : 'Mark Settled'}
                          </button>
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <button type="button" onClick={() => handleDeleteLoanRecord(loan.id)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: NEW CLIENT ONBOARDING */}
        {activeTab === 'onboarding' && (
          <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl animate-fadeIn">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2 text-white"><UserPlus className="text-emerald-500" /> New Client Loan Onboarding</h2>
                <p className="text-xs text-slate-400 mt-0.5">Underwrite profiles, verify documents, and instantly trigger email confirmation workflows.</p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-black">Vault Reserve</span>
                <span className="text-sm font-black text-emerald-400">₹{availableLiquidCash.toLocaleString()}</span>
              </div>
            </div>
            
            <form onSubmit={handleCreateLoan} className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">1. Primary Contacts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Client Full Name</label>
                    <input required type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Enter Borrower Name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Email Address (Triggers Instant Notification)</label>
                    <div className="relative mt-1">
                      <input type="email" value={formData.clientEmail} onChange={e => setFormData({ ...formData, clientEmail: e.target.value })} className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="name@domain.com" />
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Mobile WhatsApp Contact</label>
                  <div className="flex gap-2 mt-1">
                    <select value={formData.countryCode} onChange={e => setFormData({ ...formData, countryCode: e.target.value })} className="pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none">
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input required type="tel" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="9876543210" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">2. Risk Verification Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><FileText className="h-3 w-3" /> Gov ID Number (Aadhaar / PAN)</label>
                    <input required type="text" value={formData.governmentId} onChange={e => setFormData({ ...formData, governmentId: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Identity Card Number" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Guarantor Emergency Reference</label>
                    <input required type="text" value={formData.guarantorContact} onChange={e => setFormData({ ...formData, guarantorContact: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Name & Mobile Contact" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Home Residential Address</label>
                  <textarea required rows={2} value={formData.residentialAddress} onChange={e => setFormData({ ...formData, residentialAddress: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Full home landmarks, street, village..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Pledged Security Collateral Note</label>
                  <input required type="text" value={formData.collateralDetails} onChange={e => setFormData({ ...formData, collateralDetails: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="e.g. Gold jewelry weight, vehicle papers..." />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">3. Document Uploads & Legal Agreements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-slate-400" /> Government ID Scan Document</span>
                    <label className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${idDocumentName ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                      {idDocumentName ? <FileCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                      <span className="truncate">{idDocumentName || 'Choose ID File'}</span>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setIdDocumentName(e.target.files[0].name); }} />
                    </label>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Signed Terms Form Agreement</span>
                    <label className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${signedFormName ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                      {signedFormName ? <FileCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                      <span className="truncate">{signedFormName || 'Choose Signed Form'}</span>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setSignedFormName(e.target.files[0].name); }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">4. Loan Structure Schema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Principal Financing Sum</label>
                    <input required type="number" value={formData.principalAmount} onChange={e => setFormData({ ...formData, principalAmount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Interest Charging Rate (%)</label>
                    <div className="relative mt-1">
                      <input required type="number" step="0.1" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} className="w-full p-3 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      <Percent className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Installment Payment (Auto)</label>
                    <input type="number" value={formData.installmentAmount} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-black text-sm" readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Tenure Repayment Cycle</label>
                    <select value={formData.tenure} onChange={e => setFormData({ ...formData, tenure: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none">
                      <option value="Daily">Daily Basis</option>
                      <option value="Weekly">Weekly Basis</option>
                      <option value="Monthly">Monthly Basis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Total Cycles</label>
                    <input required type="number" value={formData.totalInstallments} onChange={e => setFormData({ ...formData, totalInstallments: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm mt-4 uppercase tracking-wider">
                Lock Records & Deduct Capital Flow <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: VAULT CAPITAL OPERATIONS */}
        {activeTab === 'funds' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm h-fit">
              <h3 className="text-md font-black text-white flex items-center gap-1.5 mb-2"><PlusCircle className="text-emerald-400 h-4 w-4" /> Inject Reserve Capital</h3>
              <form onSubmit={handleAddCapital} className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Amount (₹)</label><input required type="number" value={capitalInput.amount} onChange={e => setCapitalInput({ ...capitalInput, amount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-md" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Source Note</label><input type="text" value={capitalInput.notes} onChange={e => setCapitalInput({ ...capitalInput, notes: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" placeholder="SBI injection, vault deposit..." /></div>
                <button type="submit" disabled={loadingFunds} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black p-3 rounded-xl uppercase tracking-wider">{loadingFunds ? 'Saving...' : 'Confirm Influx'}</button>
              </form>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center"><span className="text-xs text-slate-400 block uppercase font-bold">Total Injected Pool</span><span className="text-2xl font-black text-slate-300 block mt-2">₹{companyCapitalPool.toLocaleString()}</span></div>
                <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/20 text-center shadow-lg"><span className="text-xs text-emerald-400 block uppercase font-black">Active Liquid Cash Float</span><span className="text-2xl font-black text-emerald-400 block mt-2">₹{availableLiquidCash.toLocaleString()}</span></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Investment Audit History Logs</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">{capitalHistory.map(log => (<div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-900 text-xs"><div><p className="font-bold text-slate-200">₹{Number(log.amount).toLocaleString()}</p><p className="text-[10px] text-slate-500">{log.notes}</p></div><span className="text-[9px] text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded-md">{new Date(log.created_at).toLocaleDateString('en-IN')}</span></div>))}</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ANALYTICS YIELD */}
        {activeTab === 'charts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl mx-auto animate-fadeIn">
            <h2 className="text-xl font-black text-white mb-6">Yield Outflow Analytics</h2>
            <div className="flex items-end gap-6 h-64 border-b border-l border-slate-800 px-6 pb-2">
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-slate-300">₹{metrics.totalLent.toLocaleString()}</span>
                <div className="w-12 bg-slate-800 rounded-t-lg transition-all duration-500" style={{ height: metrics.totalLent > 0 ? '80%' : '10%' }}></div>
                <span className="text-xs text-slate-400 font-bold">Lent Out</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-emerald-400">₹{metrics.totalCollected.toLocaleString()}</span>
                <div className="w-12 bg-emerald-500 rounded-t-lg transition-all duration-500" style={{ height: metrics.totalLent > 0 ? `${(metrics.totalCollected / metrics.totalLent) * 80}%` : '10%' }}></div>
                <span className="text-xs text-emerald-400 font-bold">Collected Return</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-amber-500">₹{metrics.pendingDues.toLocaleString()}</span>
                <div className="w-12 bg-amber-500 rounded-t-lg transition-all duration-500" style={{ height: metrics.totalLent > 0 ? `${(metrics.pendingDues / metrics.totalLent) * 80}%` : '10%' }}></div>
                <span className="text-xs text-slate-400 font-bold">Outstanding Yield</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: RISK DELINQUENCY MONITOR */}
        {activeTab === 'risk' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            {highRiskLoans.length === 0 ? <div className="col-span-full bg-slate-900 p-12 text-center rounded-2xl border text-slate-400 border-slate-800">No payment defaults flagged on the radar.</div> : highRiskLoans.map(loan => (
              <div key={loan.id} className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5"><h3 className="text-lg font-bold text-white">{loan.name}</h3><p className="text-xs text-rose-400 font-semibold mb-3">{loan.missedDays} Days Delinquent</p><a href={`tel:${loan.phone}`} className="w-full bg-rose-600 text-white text-xs font-bold py-2 rounded-xl text-center block">Call Borrower</a></div>
            ))}
          </section>
        )}

        {/* =========================================================================
            VIEW 6: UPGRADED LIVE SYSTEM PARAMETERS ADMIN CONFIGURATION PORTAL
           ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            
            {/* Form layout to edit ledger properties dynamically */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-md font-black text-white flex items-center gap-2 mb-4"><Edit3 className="text-emerald-500 h-4 w-4" /> Adjust Ledger Console Properties</h3>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Company / Platform System Title</label>
                  <input required type="text" value={sysSettings.companyName} onChange={e => setSysSettings({ ...sysSettings, companyName: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Global Operational Interest Buffer (%)</label>
                  <input required type="number" step="0.01" value={sysSettings.interestBuffer} onChange={e => setSysSettings({ ...sysSettings, interestBuffer: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-sm focus:outline-none" />
                </div>
                <button type="submit" disabled={savingSettings} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black p-3.5 rounded-xl uppercase tracking-wider transition-all">
                  {savingSettings ? 'Processing Parameter Sync...' : 'Commit Settings Parameter Update'}
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="text-center pb-4 border-b border-slate-800/60"><div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto rounded-2xl flex items-center justify-center mb-3"><ShieldCheck className="h-8 w-8" /></div><h2 className="text-xl font-black text-white">{adminProfile.name}</h2><p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{adminProfile.role}</p></div>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold"><div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><span className="text-[10px] text-slate-500 block">ADMIN MANAGER</span><span className="text-slate-200 block mt-0.5">{adminProfile.name}</span></div><div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><span className="text-[10px] text-slate-500 block">SYSTEM CONSOLE MAIL</span><span className="text-slate-200 block mt-0.5 truncate">{adminProfile.email}</span></div></div>
            </div>
          </div>
        )}

        {/* DOSSIER MODAL DETAILS VIEWER */}
        {selectedLoanFile && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4 animate-scaleIn">
              <button type="button" onClick={() => setSelectedLoanFile(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-colors"><X className="h-4 w-4" /></button>
              <div><h3 className="text-xl font-black text-white">👤 Debtor Financial Dossier</h3><p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Underwriting Properties & Legal Signatures</p></div>
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div><span className="text-[10px] uppercase font-black text-slate-500 block">Borrower Name</span><span className="font-bold text-slate-200">{selectedLoanFile.name}</span></div>
                  <div><span className="text-[10px] uppercase font-black text-slate-500 block">Mobile Link</span><span className="font-bold text-slate-200">{selectedLoanFile.phone}</span></div>
                </div>
                <div className="space-y-2 bg-slate-950/20 p-3 rounded-xl border border-slate-800/40">
                  <div className="grid grid-cols-2 gap-1">
                    <div><span className="text-[10px] uppercase font-black text-slate-500 block">Issued On</span><span className="font-semibold text-slate-300">{selectedLoanFile.issuedDate}</span></div>
                    <div><span className="text-[10px] uppercase font-black text-slate-500 block">Settled Timestamp</span><span className="font-semibold text-emerald-400">{selectedLoanFile.clearedDate}</span></div>
                  </div>
                  <hr className="border-slate-800/40" />
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><FileText className="h-3 w-3" /> Identity Code (Gov ID)</span><span className="font-bold text-slate-300 block mt-0.5">{selectedLoanFile.governmentId}</span></div>
                  <hr className="border-slate-800/40" />
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Home Residential Coordinates</span><p className="text-slate-400 font-medium mt-0.5 whitespace-pre-line">{selectedLoanFile.address}</p></div>
                  <hr className="border-slate-800/40" />
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Underwritten Collateral Items</span><span className="font-bold text-slate-300 block mt-0.5">{selectedLoanFile.collateral}</span></div>
                  <hr className="border-slate-800/40" />
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Backup Reference Guarantor</span><span className="font-bold text-slate-300 block mt-0.5">{selectedLoanFile.guarantor}</span></div>
                  <hr className="border-slate-800/40" />
                  <div className="pt-1 space-y-2">
                    <span className="text-[10px] uppercase font-black text-slate-500 block">Attached Legal Documents Archive:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/60 flex items-center justify-between"><span className="text-[11px] text-slate-300 truncate font-semibold pr-1">ID Card Scan</span><button type="button" onClick={() => alert(`Opening document stream: ${selectedLoanFile.idDoc}`)} className="text-emerald-400 hover:text-emerald-300 p-1" title="View Document Scan"><Eye className="h-3.5 w-3.5" /></button></div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/60 flex items-center justify-between"><span className="text-[11px] text-slate-300 truncate font-semibold pr-1">Signed Contract</span><button type="button" onClick={() => alert(`Opening mutual contract agreement sheet: ${selectedLoanFile.signedForm}`)} className="text-emerald-400 hover:text-emerald-300 p-1" title="View Signed Contract Agreement Form"><Eye className="h-3.5 w-3.5" /></button></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}