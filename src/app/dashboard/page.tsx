'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, TrendingUp, AlertTriangle, Users, ArrowRight, UserPlus, 
  Percent, Wallet, User, LogOut, Trash2, Check, LayoutDashboard, 
  Mail, FileText, MapPin, ShieldCheck, HelpCircle, Info, X, Calendar, 
  PlusCircle, Upload, FileCheck, Eye, Edit3, Settings, ShieldAlert, CheckCircle2
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
  const [metrics, setMetrics] = useState({ totalLent: 0, totalCollected: 0, pendingDues: 0 });
  
  // Hardened initial profile parameters matching your corporate authentication identity
  const [adminProfile, setAdminProfile] = useState({ id: '', name: 'Potnuru Syamkumar', email: 'syamkumarpotnuru7@gmail.com', phone: '+917075516605', role: 'Master Administrator' });
  const [selectedLoanFile, setSelectedLoanFile] = useState<any | null>(null);

  // Client information editing modal states
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', collateral: '' });

  // EDITABLE ADMIN DETAILS STATE ENGINES
  const [adminEditForm, setAdminEditForm] = useState({ name: '', email: '', phone: '' });
  const [updatingAdmin, setUpdatingAdmin] = useState(false);

  const [sysSettings, setSysSettings] = useState({ companyName: 'SLU Finance', interestBuffer: '0' });
  const [savingSettings, setSavingSettings] = useState(false);

  const [formData, setFormData] = useState({ 
    clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', 
    principalAmount: '10000', installmentAmount: '0', tenure: 'Daily', totalInstallments: '100', interestRate: '24',
    governmentId: '', residentialAddress: '', collateralDetails: '', guarantorContact: ''
  });
  
  const [idDocumentName, setIdDocumentName] = useState<string>('');
  const [signedFormName, setSignedFormName] = useState<string>('');
  const [capitalInput, setCapitalInput] = useState({ amount: '', notes: '' });
  const [collectionAmount, setCollectionAmount] = useState<{ [key: string]: string }>({});
  const [loadingFunds, setLoadingFunds] = useState(false);

  useEffect(() => { enforceAdministrativeSession(); }, []);

  useEffect(() => {
    const P = parseFloat(formData.principalAmount);
    const R = parseFloat(formData.interestRate);
    const C = parseInt(formData.totalInstallments);
    if (!isNaN(P) && !isNaN(R) && !isNaN(C) && C > 0) {
      const totalPayable = P + (P * (R / 100));
      setFormData(prev => ({ ...prev, installmentAmount: Math.ceil(totalPayable / C).toString() }));
    }
  }, [formData.principalAmount, formData.interestRate, formData.totalInstallments]);

  async function enforceAdministrativeSession() {
    const activeLocalSession = localStorage.getItem('slu_session_active');
    const locallySavedName = localStorage.getItem('slu_user_name');
    const locallySavedEmail = localStorage.getItem('slu_user_email');

    // Attempt to pull direct properties from database to populate editable settings values
    const { data: profileRow } = await supabase
      .from('user_profiles')
      .select('*')
      .filter('full_name', 'ilike', `%Syamkumar%`)
      .limit(1)
      .maybeSingle();

    if (profileRow) {
      const parsedAdmin = {
        id: profileRow.id,
        name: profileRow.full_name || 'Potnuru Syamkumar',
        email: profileRow.email || 'syamkumarpotnuru7@gmail.com',
        phone: profileRow.phone_number || '+917075516605',
        role: 'Master Super Admin'
      };
      setAdminProfile(parsedAdmin);
      setAdminEditForm({ name: parsedAdmin.name, email: parsedAdmin.email, phone: parsedAdmin.phone });
    } else if (activeLocalSession === 'true' && locallySavedName) {
      setAdminProfile(prev => ({ ...prev, name: locallySavedName, email: locallySavedEmail || prev.email }));
      setAdminEditForm({ name: locallySavedName, email: locallySavedEmail || 'syamkumarpotnuru7@gmail.com', phone: '+917075516605' });
    }
    fetchDynamicRealtimeMetrics();
  }

  async function fetchDynamicRealtimeMetrics() {
    const { data: settingsRow } = await supabase.from('system_settings').select('*').limit(1).single();
    if (settingsRow) {
      setSysSettings({ companyName: settingsRow.company_name, interestBuffer: settingsRow.interest_buffer_percentage.toString() });
    }

    const { data: rawLoans } = await supabase.from('live_loans').select('*').order('created_at', { ascending: false });
    let loanList: any[] = [];
    let calculatedLent = 0;
    let calculatedCollected = 0;

    if (rawLoans) {
      loanList = rawLoans.map((l: any) => {
        const principalVal = Number(l.principal_amount || 0);
        const rateVal = Number(l.interest_rate || 0);
        const totalPayableDebt = principalVal + (principalVal * (rateVal / 100)); // Precise total debt layout logic

        return {
          id: l.id, name: l.client_name, email: l.client_email || 'N/A', phone: l.client_phone, principal: principalVal,
          totalDebt: totalPayableDebt, installment: Number(l.installment_amount || 0), tenure: l.tenure_type || 'Daily', interest: rateVal,
          status: l.status || 'Verification_Pending', missedDays: l.missed_days_count || 0, collected: Number(l.total_collected || 0), totalCycles: Number(l.total_cycles || 100),
          governmentId: l.government_id_number || 'Not Provided', address: l.residential_address || 'Not Provided', collateral: l.collateral_asset_details || 'Unsecured Line', guarantor: l.guarantor_emergency_contact || 'None',
          idDoc: l.uploaded_id_document_url || null, signedForm: l.signed_agreement_document_url || null,
          issuedDate: l.loan_issued_date ? new Date(l.loan_issued_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}) : 'N/A',
          clearedDate: l.loan_cleared_date ? new Date(l.loan_cleared_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}) : 'Active'
        };
      });
      setLoans(loanList);
      loanList.forEach(l => { if (l.status !== 'Deleted' && l.status !== 'Verification_Pending') { calculatedLent += l.principal; calculatedCollected += l.collected; } });
    }

    const { data: capitalRows } = await supabase.from('company_capital').select('*').order('created_at', { ascending: false });
    let totalInjectedCapital = 0;
    if (capitalRows) {
      setCapitalHistory(capitalRows);
      totalInjectedCapital = capitalRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      setCompanyCapitalPool(totalInjectedCapital);
    }

    setAvailableLiquidCash(totalInjectedCapital + calculatedCollected - calculatedLent);
    setMetrics({ totalLent: calculatedLent, totalCollected: calculatedCollected, pendingDues: calculatedLent - calculatedCollected });
  }

  // UPDATE ADMIN CONSOLE PERSONNEL DATA PROPERTIES
  const handleUpdateAdminProfileProperties = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingAdmin(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: adminEditForm.name,
        email: adminEditForm.email,
        phone_number: adminEditForm.phone
      })
      .filter('full_name', 'ilike', `%Syamkumar%`); // Targets your administrative user row precisely

    if (error) {
      alert(`Update Error: ${error.message}`);
    } else {
      localStorage.setItem('slu_user_name', adminEditForm.name);
      localStorage.setItem('slu_user_email', adminEditForm.email);
      setAdminProfile(prev => ({ ...prev, name: adminEditForm.name, email: adminEditForm.email, phone: adminEditForm.phone }));
      alert("Success: Your administrative user profile coordinates have been locked live!");
    }
    setUpdatingAdmin(false);
    fetchDynamicRealtimeMetrics();
  };

  // TRIGGER MANUAL BORROWER VERIFICATION OVERRIDE
  const handleApproveClientRepaymentVerification = async (loanId: string, clientName: string) => {
    const { error } = await supabase
      .from('live_loans')
      .update({ status: 'Active' })
      .eq('id', loanId);

    if (!error) {
      alert(`Verification Approved: ${clientName} shifted to Active Ledger profiles.`);
      fetchDynamicRealtimeMetrics();
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    await supabase.from('system_settings').update({ company_name: sysSettings.companyName, interest_buffer_percentage: parseFloat(sysSettings.interestBuffer || '0') }).neq('id', 0);
    alert("System Properties Synchronized!");
    setSavingSettings(false);
    fetchDynamicRealtimeMetrics();
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPrincipal = parseFloat(formData.principalAmount);
    if (targetPrincipal > availableLiquidCash) { alert(`Access Blocked: Insufficient reserves! Available cash float is ₹${availableLiquidCash.toLocaleString()}`); return; }

    const { data: newLoan, error } = await supabase.from('live_loans').insert([{
      client_name: formData.clientName, client_email: formData.clientEmail, client_phone: `${formData.countryCode}${formData.clientPhone}`,
      principal_amount: targetPrincipal, installment_amount: parseFloat(formData.installmentAmount), tenure_type: formData.tenure, total_cycles: parseInt(formData.totalInstallments), interest_rate: parseFloat(formData.interestRate),
      status: 'Verification_Pending', // Explicitly enforces verification phase checks on initialization
      government_id_number: formData.governmentId, residential_address: formData.residentialAddress, collateral_asset_details: formData.collateralDetails, guarantor_emergency_contact: formData.guarantorContact,
      uploaded_id_document_url: idDocumentName || 'ID_Card_Scan.pdf', signed_agreement_document_url: signedFormName || 'Signed_Terms_Sheet.pdf', loan_issued_date: new Date().toISOString()
    }]);

    if (error) { alert(`Database Error: ${error.message}`); return; }

    if (formData.clientEmail) {
      const emailSubject = encodeURIComponent(`Action Required: Verification Signature for ${sysSettings.companyName}`);
      const emailBody = encodeURIComponent(`Dear ${formData.clientName},\n\nYour pending credit application of ₹${targetPrincipal.toLocaleString()} has been initialized.\n\nRepayment Terms:\n- Complete Debt Liability: ₹${(targetPrincipal + (targetPrincipal * (parseFloat(formData.interestRate) / 100))).toLocaleString()}\n- Target Cycle Repayment: ₹${formData.installmentAmount} (${formData.tenure})\n\nPlease accept these terms to approve authorization.\n\nRegards,\n${sysSettings.companyName}`);
      window.location.href = `mailto:${formData.clientEmail}?subject=${emailSubject}&body=${emailBody}`;
    }

    alert(`Success: Onboarded ${formData.clientName} under holding status Verification_Pending!`);
    setFormData({ clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', principalAmount: '10000', installmentAmount: '0', tenure: 'Daily', totalInstallments: '100', interestRate: '24', governmentId: '', residentialAddress: '', collateralDetails: '', guarantorContact: '' });
    setIdDocumentName(''); setSignedFormName(''); setActiveTab('overview'); fetchDynamicRealtimeMetrics();
  };

  const handleSaveChangesOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('live_loans').update({ client_name: editForm.name, client_email: editForm.email, client_phone: editForm.phone, residential_address: editForm.address, collateral_asset_details: editForm.collateral }).eq('id', editingLoan.id);
    if (!error) { alert("Success: Changes saved!"); setEditingLoan(null); fetchDynamicRealtimeMetrics(); }
  };

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(capitalInput.amount);
    if (isNaN(amt) || amt <= 0) return;
    setLoadingFunds(true);
    const { error } = await supabase.from('company_capital').insert([{ amount: amt, notes: capitalInput.notes.trim() || 'Manual Capital Injection' }]);
    if (!error) { setCapitalInput({ amount: '', notes: '' }); fetchDynamicRealtimeMetrics(); }
    setLoadingFunds(false);
  };

  const handleRecordCollection = async (loanId: string, currentCollected: number) => {
    const amt = parseFloat(collectionAmount[loanId] || '0');
    if (isNaN(amt) || amt <= 0) return;
    await supabase.from('live_loans').update({ total_collected: currentCollected + amt }).eq('id', loanId);
    setCollectionAmount(prev => ({ ...prev, [loanId]: '' })); fetchDynamicRealtimeMetrics();
  };

  const handleToggleStatusComplete = async (loanId: string, currentStatus: string) => {
    const target = currentStatus === 'Active' ? 'Settled_Done' : 'Active';
    await supabase.from('live_loans').update({ status: target, loan_cleared_date: target === 'Settled_Done' ? new Date().toISOString() : null }).eq('id', loanId);
    fetchDynamicRealtimeMetrics();
  };

  const handleDeleteLoanRecord = async (loanId: string) => {
    if (confirm("Completely erase this borrower profile permanently?")) { await supabase.from('live_loans').delete().eq('id', loanId); fetchDynamicRealtimeMetrics(); }
  };

  const highRiskLoans = loans.filter(l => (l.tenure === 'Daily' && l.missedDays > 3) || (l.tenure === 'Monthly' && l.missedDays > 10));

  // GRAPH ALIGNMENT SCALING ENGINE MATH: Compiles dynamically to support any scale value neatly
  const maximumMetricValue = Math.max(metrics.totalLent, metrics.totalCollected, metrics.pendingDues, 1000);
  const computeProportionalHeightString = (value: number) => {
    const calculatedRawPercent = (value / maximumMetricValue) * 100;
    return `${Math.max(calculatedRawPercent, 6)}%`; // Assures visible structural grid definitions even at low sums
  };

  const NavButton = ({ tab, label, icon: Icon, badge }: { tab: typeof activeTab, label: string, icon: any, badge?: number }) => (
    <button onClick={() => setActiveTab(tab)} className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
      <div className="flex items-center gap-3"><Icon className="h-4 w-4" /><span>{label}</span></div>
      {badge !== undefined && badge > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{badge}</span>}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50 antialiased font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="p-5">
          <div className="mb-8 px-2 flex items-center gap-2"><div className="w-2.5 h-6 bg-emerald-500 rounded-full"></div><h1 className="text-xl font-black text-white uppercase">{sysSettings.companyName}</h1></div>
          <nav className="space-y-1.5">
            <NavButton tab="overview" label="Book Records Desk" icon={LayoutDashboard} />
            <NavButton tab="onboarding" label="New Client Onboarding" icon={UserPlus} />
            <NavButton tab="funds" label="Capital pool Reserves" icon={Wallet} />
            <NavButton tab="charts" label="Yield Analytics" icon={BarChart3} />
            <NavButton tab="risk" label="Risk Collection Radar" icon={AlertTriangle} badge={highRiskLoans.length} />
            <NavButton tab="profile" label="Admin Settings" icon={Settings} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800"><button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-xs font-bold uppercase tracking-wider"><LogOut className="h-4 w-4" /> Exit Session</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
        <header className="mb-8 flex justify-between items-center bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <div><h2 className="text-lg font-bold text-white">Welcome Back, {adminProfile.name} 👋</h2><p className="text-xs text-slate-500 font-medium">System Role: {adminProfile.role}</p></div>
          <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Core Ledger Console Active</span>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Active Cash Float</p><h3 className="text-2xl font-black text-emerald-400">₹{availableLiquidCash.toLocaleString()}</h3></div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Capital Lent Out</p><h3 className="text-2xl font-black text-white">₹{metrics.totalLent.toLocaleString()}</h3></div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Yield Collected</p><h3 className="text-2xl font-black text-blue-400">₹{metrics.totalCollected.toLocaleString()}</h3></div>
            </section>
            
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold mb-4 text-white">Underwritten Ledger Profiles</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 pr-2">Client Details</th><th className="py-3 px-2">Structure</th><th className="py-3 px-2">Timeline Dates</th><th className="py-3 px-2">Principal Amount</th><th className="py-3 px-2">₹ Total Debt</th><th className="py-3 px-2">Collected</th><th className="py-3 px-2">Quick Reconcile</th><th className="py-3 px-2 text-center">Actions</th><th className="py-3 pl-2 text-right">Erase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3.5 pr-2 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-100">{loan.name}</span>
                            <button type="button" onClick={() => setSelectedLoanFile(loan)} className="text-slate-500 hover:text-emerald-400"><Info className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => { setEditingLoan(loan); setEditForm({ name: loan.name, email: loan.email, phone: loan.phone, address: loan.address, collateral: loan.collateral }); }} className="text-slate-500 hover:text-blue-400"><Edit3 className="h-3.5 w-3.5" /></button>
                          </div>
                          <div className="text-xs text-slate-500">{loan.phone}</div>
                        </td>
                        <td className="py-3.5 px-2"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold uppercase">{loan.tenure}</span></td>
                        <td className="py-3.5 px-2 text-xs">
                          <div>Gave: <span className="font-bold text-slate-200">{loan.issuedDate}</span></div>
                          <div className="text-[10px] mt-0.5">{loan.status === 'Settled_Done' ? <span className="text-emerald-400">Done: {loan.clearedDate}</span> : loan.status === 'Verification_Pending' ? <span className="text-rose-400 font-bold flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Pending Accept</span> : <span className="text-amber-500">Active Outflow</span>}</div>
                        </td>
                        <td className="py-3.5 px-2 font-bold text-slate-400">₹{loan.principal.toLocaleString()}</td>
                        
                        {/* TOTAL DEBT (PRINCIPAL + INTEREST TOTAL FIELDS RENDERING) */}
                        <td className="py-3.5 px-2 font-black text-slate-100">₹{loan.totalDebt.toLocaleString()}</td>
                        
                        <td className="py-3.5 px-2 font-bold text-emerald-400">₹{loan.collected.toLocaleString()}</td>
                        <td className="py-3.5 px-2">
                          {loan.status === 'Verification_Pending' ? (
                            <span className="text-xs text-slate-600 font-medium italic">Awaiting Signature Verification</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input type="number" placeholder="₹" value={collectionAmount[loan.id] || ''} onChange={e => setCollectionAmount({ ...collectionAmount, [loan.id]: e.target.value })} className="w-20 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white text-center font-bold" />
                              <button type="button" onClick={() => handleRecordCollection(loan.id, loan.collected)} className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"><Check className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          {loan.status === 'Verification_Pending' ? (
                            <button type="button" onClick={() => handleApproveClientRepaymentVerification(loan.id, loan.name)} className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 uppercase transition-all shadow-md mx-auto"><CheckCircle2 className="h-3.5 w-3.5" /> Approve Verification</button>
                          ) : (
                            <button type="button" onClick={() => handleToggleStatusComplete(loan.id, loan.status)} className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase ${loan.status === 'Settled_Done' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{loan.status === 'Settled_Done' ? '✅ Settled' : 'Mark Settled'}</button>
                          )}
                        </td>
                        <td className="py-3.5 pl-2 text-right"><button type="button" onClick={() => handleDeleteLoanRecord(loan.id)} className="p-2 text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'onboarding' && (
          <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl animate-fadeIn">
            <h2 className="text-xl font-black flex items-center gap-2 text-white mb-4"><UserPlus className="text-emerald-500" /> New Client Loan Onboarding</h2>
            <form onSubmit={handleCreateLoan} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Client Full Name</label><input required type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Email Address</label><input type="email" value={formData.clientEmail} onChange={e => setFormData({ ...formData, clientEmail: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Gov ID Number</label><input required type="text" value={formData.governmentId} onChange={e => setFormData({ ...formData, governmentId: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Contact Phone Number</label><input required type="text" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value.replace(/\D/g, '') })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="7075516605" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"><span className="text-xs font-bold text-slate-300">Government ID Scan File</span><label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs font-bold uppercase">{idDocumentName || 'Choose ID File'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setIdDocumentName(e.target.files[0].name); }} /></label></div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"><span className="text-xs font-bold text-slate-300">Signed Terms Form Agreement</span><label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs font-bold uppercase">{signedFormName || 'Choose Signed Form'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setSignedFormName(e.target.files[0].name); }} /></label></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Principal Financed (₹)</label><input type="number" value={formData.principalAmount} onChange={e => setFormData({ ...formData, principalAmount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Interest Rate (%)</label><input type="number" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Installment Target (Auto)</label><input type="number" value={formData.installmentAmount} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold focus:outline-none" readOnly /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Repayment Cycle</label><select value={formData.tenure} onChange={e => setFormData({ ...formData, tenure: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"><option value="Daily">Daily Basis</option><option value="Weekly">Weekly Basis</option><option value="Monthly">Monthly Basis</option></select></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Total Cycles</label><input type="number" value={formData.totalInstallments} onChange={e => setFormData({ ...formData, totalInstallments: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none" /></div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl text-sm uppercase tracking-wider transition-all">Lock Account & Fire Verification Link</button>
            </form>
          </div>
        )}

        {activeTab === 'funds' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit">
              <h3 className="text-md font-black text-white flex items-center gap-1.5 mb-4"><PlusCircle className="text-emerald-400 h-4 w-4" /> Inject Reserve Capital</h3>
              <form onSubmit={handleAddCapital} className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Amount (₹)</label><input required type="number" value={capitalInput.amount} onChange={e => setCapitalInput({ ...capitalInput, amount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Source Note</label><input type="text" value={capitalInput.notes} onChange={e => setCapitalInput({ ...capitalInput, notes: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none" placeholder="Bank cash drop..." /></div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold p-3 rounded-xl uppercase transition-all">Confirm Influx</button>
              </form>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center"><span className="text-xs text-slate-400 block uppercase font-bold">Active Liquid Cash Float</span><span className="text-4xl font-black text-emerald-400 block mt-2">₹{availableLiquidCash.toLocaleString()}</span></div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5"><h4 className="text-xs font-black text-slate-400 uppercase mb-3">Audit Influx Logs History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">{capitalHistory.map(log => (<div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 text-xs"><div className="font-bold text-slate-200">₹{Number(log.amount || 0).toLocaleString()} - <span className="text-slate-500 font-normal">{log.notes}</span></div><span className="text-[10px] text-slate-500 font-bold">{new Date(log.created_at).toLocaleDateString('en-IN')}</span></div>))}</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            💥 RESTORED & DYNAMICALLY NORMALIZED YIELD ANALYTICS VISUALIZER
           ========================================================================= */}
        {activeTab === 'charts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto animate-fadeIn space-y-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-black text-white">Dynamic Yield Analytics</h2>
              <p className="text-xs text-slate-500">Auto-scalable metrics engine balancing chart grids proportionally relative to capital parameters.</p>
            </div>
            
            {/* Proportional Grid Wrapper */}
            <div className="flex items-end gap-8 h-72 border-b border-l border-slate-800/80 px-8 pb-3 pt-6 bg-slate-950/40 rounded-xl">
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">₹{metrics.totalLent.toLocaleString()}</span>
                <div className="w-16 bg-slate-800 hover:bg-slate-700 rounded-t-xl transition-all duration-700 shadow-md cursor-pointer" style={{ height: computeProportionalHeightString(metrics.totalLent) }}></div>
                <span className="text-xs text-slate-400 font-black uppercase tracking-wider mt-1">Lent Out</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">₹{metrics.totalCollected.toLocaleString()}</span>
                <div className="w-16 bg-emerald-500 hover:bg-emerald-400 rounded-t-xl transition-all duration-700 shadow-emerald-500/10 shadow-lg cursor-pointer" style={{ height: computeProportionalHeightString(metrics.totalCollected) }}></div>
                <span className="text-xs text-emerald-400 font-black uppercase tracking-wider mt-1">Collected</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-amber-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">₹{metrics.pendingDues.toLocaleString()}</span>
                <div className="w-16 bg-amber-500 hover:bg-amber-400 rounded-t-xl transition-all duration-700 shadow-md cursor-pointer" style={{ height: computeProportionalHeightString(metrics.pendingDues) }}></div>
                <span className="text-xs text-slate-400 font-black uppercase tracking-wider mt-1">Outstanding</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn"><h2 className="text-xl font-black text-white">Risk Delinquency Radar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highRiskLoans.length === 0 ? <div className="col-span-full bg-slate-900 p-12 text-center rounded-2xl border text-slate-400 border-slate-800">No payment defaults flagged on the system radar.</div> : highRiskLoans.map(loan => (
                <div key={loan.id} className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5"><h3 className="text-lg font-bold text-white">{loan.name}</h3><p className="text-xs text-rose-400 font-semibold mb-3">{loan.missedDays} Days Delinquent</p><a href={`tel:${loan.phone}`} className="w-full bg-rose-600 text-white text-xs font-bold py-2 rounded-xl text-center block">Call Borrower</a></div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            💎 ADVANCED TWO-COLUMN EDITABLE SYSTEM & PERSONNEL ADMIN PANEL 
           ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            
            {/* Column Card 1: Edit Platform Configurations */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-md font-black text-white flex items-center gap-2 mb-2"><Settings className="text-emerald-500 h-4 w-4" /> Platform Configurations</h3>
                <p className="text-xs text-slate-500 mb-6">Modify system branding titles and operating buffer interest markers.</p>
              </div>
              <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-400 uppercase text-[10px]">Platform System Title</label>
                  <input required type="text" value={sysSettings.companyName} onChange={e => setSysSettings({ ...sysSettings, companyName: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold" />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px]">Operational Interest Buffer (%)</label>
                  <input required type="number" step="0.01" value={sysSettings.interestBuffer} onChange={e => setSysSettings({ ...sysSettings, interestBuffer: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white" />
                </div>
                <button type="submit" disabled={savingSettings} className="w-full bg-slate-800 hover:bg-slate-750 text-white text-xs font-black p-3.5 rounded-xl uppercase tracking-wider transition-all border border-slate-700 mt-2">Commit Platform Sync</button>
              </form>
            </div>

            {/* Column Card 2: EDITABLE PERSONNEL ADMIN SPECIFICATIONS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-md font-black text-white flex items-center gap-2 mb-1"><User className="text-blue-400 h-4 w-4" /> Personal Admin Settings</h3>
                <p className="text-xs text-slate-500">Edit your official administrator parameters saved during registration.</p>
              </div>
              
              <form onSubmit={handleUpdateAdminProfileProperties} className="space-y-4 text-xs font-semibold border-t border-slate-800/60 pt-4">
                <div>
                  <label className="text-slate-400 uppercase text-[10px]">Master Full Name</label>
                  <input required type="text" value={adminEditForm.name} onChange={e => setAdminEditForm({ ...adminEditForm, name: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px]">Corporate System Email</label>
                  <input required type="email" value={adminEditForm.email} onChange={e => setAdminEditForm({ ...adminEditForm, email: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 uppercase text-[10px]">Secure Phone Mobile Contact</label>
                  <input required type="text" value={adminEditForm.phone} onChange={e => setAdminEditForm({ ...adminEditForm, phone: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none" />
                </div>
                
                <button type="submit" disabled={updatingAdmin} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black p-3.5 rounded-xl uppercase tracking-wider transition-all shadow-lg">
                  {updatingAdmin ? 'Updating Database Rows...' : 'Update Admin Credentials'}
                </button>
              </form>
            </div>
          </div>
        )}

        {selectedLoanFile && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 animate-scaleIn">
              <button type="button" onClick={() => setSelectedLoanFile(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800"><X className="h-4 w-4" /></button>
              <h3 className="text-xl font-black text-white">👤 Debtor Financial Dossier</h3>
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/40 space-y-2">
                  <p className="text-slate-300"><strong>Identity Card Reference:</strong> {selectedLoanFile.governmentId}</p><p className="text-slate-300"><strong>Home Address:</strong> {selectedLoanFile.address}</p><p className="text-slate-300"><strong>Guarantor Node:</strong> {selectedLoanFile.guarantor}</p><p className="text-slate-300"><strong>Pledged Security Collateral Asset:</strong> {selectedLoanFile.collateral}</p>
                </div>
                <div className="pt-2 space-y-2"><span className="text-[10px] uppercase font-black text-slate-500 block">Attached Legal Proof Scans:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 flex items-center justify-between"><span className="text-slate-300 truncate font-semibold">ID Scan</span><button type="button" onClick={() => alert(`Filename: ${selectedLoanFile.idDoc}`)} className="text-emerald-400"><Eye className="h-3.5 w-3.5" /></button></div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 flex items-center justify-between"><span className="text-slate-300 truncate font-semibold">Contract Form</span><button type="button" onClick={() => alert(`Contract name: ${selectedLoanFile.signedForm}`)} className="text-emerald-400"><Eye className="h-3.5 w-3.5" /></button></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingLoan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 shadow-2xl animate-scaleIn">
              <button type="button" onClick={() => setEditingLoan(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
              <div><h3 className="text-lg font-black text-white flex items-center gap-2"><Edit3 className="text-blue-400 h-5 w-5" /> Modify Client Profile</h3></div>
              <form onSubmit={handleSaveChangesOverride} className="space-y-4 pt-2 border-t border-slate-800 text-xs">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client Full Name</label><input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Mobile Phone Contact</label><input required type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Home Residential Location</label><textarea rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Collateral Asset Details</label><input type="text" value={editForm.collateral} onChange={e => setEditForm({ ...editForm, collateral: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3.5 rounded-xl uppercase text-xs mt-2 tracking-wider">Commit Operational Profile Updates</button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}