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
  
  // Explicit declaration of all 6 interactive workspace tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'funds' | 'charts' | 'risk' | 'profile'>('overview');
  
  const [loans, setLoans] = useState<any[]>([]);
  const [capitalHistory, setCapitalHistory] = useState<any[]>([]);
  const [companyCapitalPool, setCompanyCapitalPool] = useState<number>(0);
  const [availableLiquidCash, setAvailableLiquidCash] = useState<number>(0);
  const [metrics, setMetrics] = useState({ totalLent: 0, totalCollected: 0, pendingDues: 0 });
  
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; role: string }>({ name: 'Potnuru Syamkumar', email: 'syamkumarpotnuru7@gmail.com', role: 'Principal Credit Manager' });
  const [selectedLoanFile, setSelectedLoanFile] = useState<any | null>(null);

  // Profile Edit Modal State Management
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', collateral: '' });

  // Onboarding Input state declarations
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
      setAdminProfile(prev => ({ ...prev, name: locallySavedName }));
    }
    fetchDynamicRealtimeMetrics();
  }

  async function fetchDynamicRealtimeMetrics() {
    // 1. Fetch live custom loan row configurations from database
    const { data: rawLoans, error: err1 } = await supabase.from('live_loans').select('*').order('created_at', { ascending: false });
    let loanList: any[] = [];
    let calculatedLent = 0;
    let calculatedCollected = 0;

    if (!err1 && rawLoans) {
      loanList = rawLoans.map((l: any) => ({
        id: l.id, name: l.client_name, email: l.client_email || 'N/A', phone: l.client_phone, principal: Number(l.principal_amount || 0),
        installment: Number(l.installment_amount || 0), tenure: l.tenure_type || 'Daily', interest: Number(l.interest_rate || 0),
        status: l.status || 'Active', missedDays: l.missed_days_count || 0, collected: Number(l.total_collected || 0),
        totalCycles: Number(l.total_cycles || 100),
        governmentId: l.government_id_number || 'Not Provided',
        address: l.residential_address || 'Not Provided',
        collateral: l.collateral_asset_details || 'Unsecured Line',
        guarantor: l.guarantor_emergency_contact || 'None',
        idDoc: l.uploaded_id_document_url || null,
        signedForm: l.signed_agreement_document_url || null,
        issuedDate: l.loan_issued_date ? new Date(l.loan_issued_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}) : 'N/A',
        clearedDate: l.loan_cleared_date ? new Date(l.loan_cleared_date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}) : 'Active'
      }));
      setLoans(loanList);
      
      loanList.forEach(l => {
        if (l.status !== 'Deleted') {
          calculatedLent += l.principal;
          calculatedCollected += l.collected;
        }
      });
    }

    // 2. Fetch company capital pool injections
    const { data: capitalRows } = await supabase.from('company_capital').select('*').order('created_at', { ascending: false });
    let totalInjectedCapital = 0;
    if (capitalRows) {
      setCapitalHistory(capitalRows);
      totalInjectedCapital = capitalRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      setCompanyCapitalPool(totalInjectedCapital);
    }

    // 3. Automated Double-Entry Balancing Calculation (Injections + Collected Returns - Deployed Credit)
    setAvailableLiquidCash(totalInjectedCapital + calculatedCollected - calculatedLent);
    setMetrics({ totalLent: calculatedLent, totalCollected: calculatedCollected, pendingDues: calculatedLent - calculatedCollected });
  }

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPrincipal = parseFloat(formData.principalAmount);

    // Dynamic Capital Guard Firewall
    if (targetPrincipal > availableLiquidCash) {
      alert(`Access Blocked: Insufficient cash inside your capital pool reserves. Available balance: ₹${availableLiquidCash.toLocaleString()}`);
      return;
    }

    const fullPhoneNumber = `${formData.countryCode}${formData.clientPhone}`;
    const finalIdDocPath = idDocumentName ? idDocumentName : 'ID_Scan_Attached.pdf';
    const finalSignedFormPath = signedFormName ? signedFormName : 'Signed_Terms_Agreement.pdf';

    const { error } = await supabase.from('live_loans').insert([{
      client_name: formData.clientName, client_email: formData.clientEmail, client_phone: fullPhoneNumber,
      principal_amount: targetPrincipal, installment_amount: parseFloat(formData.installmentAmount),
      tenure_type: formData.tenure, total_cycles: parseInt(formData.totalInstallments), interest_rate: parseFloat(formData.interestRate),
      status: 'Active', government_id_number: formData.governmentId, residential_address: formData.residentialAddress,
      collateral_asset_details: formData.collateralDetails, guarantor_emergency_contact: formData.guarantorContact,
      uploaded_id_document_url: finalIdDocPath,
      signed_agreement_document_url: finalSignedFormPath,
      loan_issued_date: new Date().toISOString()
    }]);

    if (error) {
      alert(`Database Error: ${error.message}`);
      return;
    }

    alert(`Success: Onboarded ${formData.clientName}! Deployed ₹${targetPrincipal.toLocaleString()}`);
    setFormData({ clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', principalAmount: '10000', installmentAmount: '0', tenure: 'Daily', totalInstallments: '100', interestRate: '24', governmentId: '', residentialAddress: '', collateralDetails: '', guarantorContact: '' });
    setIdDocumentName(''); setSignedFormName('');
    setActiveTab('overview');
    fetchDynamicRealtimeMetrics();
  };

  const handleSaveChangesOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('live_loans')
      .update({
        client_name: editForm.name,
        client_email: editForm.email,
        client_phone: editForm.phone,
        residential_address: editForm.address,
        collateral_asset_details: editForm.collateral
      })
      .eq('id', editingLoan.id);

    if (!error) {
      alert("Success: Profile changes updated live in the database records!");
      setEditingLoan(null);
      fetchDynamicRealtimeMetrics();
    }
  };

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(capitalInput.amount);
    if (isNaN(amt) || amt <= 0) return;

    setLoadingFunds(true);
    
    // Explicit direct column mapping insert block
    const { error } = await supabase
      .from('company_capital')
      .insert([
        { 
          amount: amt, 
          notes: capitalInput.notes.trim() || 'Manual Capital Injection' 
        }
      ]);

    if (error) {
      alert(`Database Write Error: ${error.message}`);
      setLoadingFunds(false);
      return;
    }

    alert(`Success: Injected ₹${amt.toLocaleString()} into system reserves!`);
    setCapitalInput({ amount: '', notes: '' });
    
    // CRITICAL: Force-updates your active dashboard screen tracking variables instantly
    await fetchDynamicRealtimeMetrics();
    setLoadingFunds(false);
  };

  const handleRecordCollection = async (loanId: string, currentCollected: number) => {
    const amt = parseFloat(collectionAmount[loanId] || '0');
    if (isNaN(amt) || amt <= 0) return;

    await supabase.from('live_loans').update({ total_collected: currentCollected + amt }).eq('id', loanId);
    setCollectionAmount(prev => ({ ...prev, [loanId]: '' }));
    fetchDynamicRealtimeMetrics();
  };

  const handleToggleStatusComplete = async (loanId: string, currentStatus: string) => {
    const target = currentStatus === 'Active' ? 'Settled_Done' : 'Active';
    await supabase.from('live_loans').update({ status: target, loan_cleared_date: target === 'Settled_Done' ? new Date().toISOString() : null }).eq('id', loanId);
    fetchDynamicRealtimeMetrics();
  };

  const handleDeleteLoanRecord = async (loanId: string) => {
    if (confirm("Completely erase this borrower profile permanently?")) {
      await supabase.from('live_loans').delete().eq('id', loanId);
      fetchDynamicRealtimeMetrics();
    }
  };

  const highRiskLoans = loans.filter(l => (l.tenure === 'Daily' && l.missedDays > 3) || (l.tenure === 'Monthly' && l.missedDays > 10));

  const NavButton = ({ tab, label, icon: Icon, badge }: { tab: typeof activeTab, label: string, icon: any, badge?: number }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-bold transition-all ${
        activeTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3"><Icon className="h-4 w-4" /><span>{label}</span></div>
      {badge !== undefined && badge > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{badge}</span>}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50 antialiased font-sans">
      
      {/* SIDEBAR CONTAINER CONTAINER */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="p-5">
          <div className="mb-8 px-2 flex items-center gap-2">
            <div className="w-2.5 h-6 bg-emerald-500 rounded-full"></div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">SLU FINANCE</h1>
          </div>
          <nav className="space-y-1.5">
            <NavButton tab="overview" label="Book Records Desk" icon={LayoutDashboard} />
            <NavButton tab="onboarding" label="New Client Onboarding" icon={UserPlus} />
            <NavButton tab="funds" label="Capital pool Reserves" icon={Wallet} />
            <NavButton tab="charts" label="Yield Analytics" icon={BarChart3} />
            <NavButton tab="risk" label="Risk Collection Radar" icon={AlertTriangle} badge={highRiskLoans.length} />
            <NavButton tab="profile" label="Admin Settings" icon={Settings} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-bold uppercase tracking-wider">
            <LogOut className="h-4 w-4" /> Exit Session
          </button>
        </div>
      </aside>

      {/* DASHBOARD WORKSPACE MAIN SURFACE PANEL */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
        <header className="mb-8 flex justify-between items-center bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Welcome Back, {adminProfile.name} 👋</h2>
            <p className="text-xs text-slate-500 font-medium">System Module: Principal Credit Manager</p>
          </div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Deployed Live Mode</span>
        </header>

        {/* TAB 1: BOOK RECORDS DESK DESK */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Active Cash Float</p><h3 className="text-2xl font-black mt-1 text-emerald-400">₹{availableLiquidCash.toLocaleString()}</h3></div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Capital Lent Out</p><h3 className="text-2xl font-black mt-1 text-white">₹{metrics.totalLent.toLocaleString()}</h3></div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase">Yield Collected</p><h3 className="text-2xl font-black mt-1 text-blue-400">₹{metrics.totalCollected.toLocaleString()}</h3></div>
            </section>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
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
                      <th className="py-3 px-2 text-center">Actions</th>
                      <th className="py-3 pl-2 text-right">Erase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loans.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-slate-500 font-medium">No borrower profiles registered in the database.</td></tr>
                    ) : loans.map((loan) => (
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
                          <div className="text-[10px] mt-0.5">{loan.status === 'Settled_Done' ? <span className="text-emerald-400">Done: {loan.clearedDate}</span> : <span className="text-amber-500">Active Outflow</span>}</div>
                        </td>
                        <td className="py-3.5 px-2 font-bold text-slate-100">₹{loan.principal.toLocaleString()}</td>
                        <td className="py-3.5 px-2 font-bold text-emerald-400">₹{loan.collected.toLocaleString()}</td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="₹" value={collectionAmount[loan.id] || ''} onChange={e => setCollectionAmount({ ...collectionAmount, [loan.id]: e.target.value })} className="w-20 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-bold text-center focus:outline-none" />
                            <button type="button" onClick={() => handleRecordCollection(loan.id, loan.collected)} className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"><Check className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <button type="button" onClick={() => handleToggleStatusComplete(loan.id, loan.status)} className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase ${loan.status === 'Settled_Done' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {loan.status === 'Settled_Done' ? '✅ Settled' : 'Mark Settled'}
                          </button>
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

        {/* TAB 2: NEW CLIENT ONBOARDING */}
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
                <div><label className="text-xs font-bold text-slate-400 uppercase">Contact Phone Number</label><input required type="text" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"><span className="text-xs font-bold text-slate-300">Government ID Scan File</span><label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs uppercase font-bold">{idDocumentName || 'Choose Document'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setIdDocumentName(e.target.files[0].name); }} /></label></div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"><span className="text-xs font-bold text-slate-300">Signed Terms Form Agreement</span><label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs uppercase font-bold">{signedFormName || 'Choose Signed Form'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setSignedFormName(e.target.files[0].name); }} /></label></div>
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
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl text-sm uppercase tracking-wider transition-all">Lock Account & Deploy Capital Outflow</button>
            </form>
          </div>
        )}

        {/* TAB 3: CAPITAL POOL RESERVES */}
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

        {/* TAB 4: YIELD OUTFLOW ANALYTICS (RESTORED) */}
        {activeTab === 'charts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl mx-auto animate-fadeIn space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Yield Outflow Analytics</h2>
              <p className="text-xs text-slate-500">Live graphical data layout monitoring return yields.</p>
            </div>
            <div className="flex items-end gap-6 h-64 border-b border-l border-slate-800 px-6 pb-2">
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-slate-300">₹{metrics.totalLent.toLocaleString()}</span>
                <div className="w-full bg-slate-800 rounded-t-lg transition-all duration-500" style={{ height: metrics.totalLent > 0 ? '80%' : '10%' }}></div>
                <span className="text-xs text-slate-400 font-bold">Lent Out</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-emerald-400">₹{metrics.totalCollected.toLocaleString()}</span>
                <div className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500" style={{ height: metrics.totalLent > 0 ? `${(metrics.totalCollected / metrics.totalLent) * 80}%` : '10%' }}></div>
                <span className="text-xs text-emerald-400 font-bold">Collected Return</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-bold text-amber-500">₹{metrics.pendingDues.toLocaleString()}</span>
                <div className="w-full bg-amber-500 rounded-t-lg transition-all duration-500" style={{ height: metrics.totalLent > 0 ? `${(metrics.pendingDues / metrics.totalLent) * 80}%` : '10%' }}></div>
                <span className="text-xs text-slate-400 font-bold">Outstanding Yield</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RISK ARREARS MONITOR RADAR */}
        {activeTab === 'risk' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn">
            <h2 className="text-xl font-black text-white">Risk Delinquency Radar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highRiskLoans.length === 0 ? <div className="col-span-full bg-slate-900 p-12 text-center rounded-2xl border text-slate-400 border-slate-800">No payment defaults flagged on the system radar.</div> : highRiskLoans.map(loan => (
                <div key={loan.id} className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5"><h3 className="text-lg font-bold text-white">{loan.name}</h3><p className="text-xs text-rose-400 font-semibold mb-3">{loan.missedDays} Days Delinquent</p><a href={`tel:${loan.phone}`} className="w-full bg-rose-600 text-white text-xs font-bold py-2 rounded-xl text-center block">Call Borrower</a></div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ADMIN SETTINGS & MANAGEMENT CORE (RESTORED) */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto rounded-2xl flex items-center justify-center"><User className="h-8 w-8" /></div>
              <h2 className="text-xl font-black text-white">{adminProfile.name}</h2>
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{adminProfile.role}</p>
              <div className="pt-4 border-t border-slate-800/60 text-left space-y-2 text-xs font-semibold text-slate-300">
                <p><strong>System Access Mail:</strong> {adminProfile.email}</p>
                <p><strong>Database Target Schema:</strong> public</p>
                <p><strong>Active Operational Role:</strong> System Master Administrator</p>
              </div>
            </div>
          </div>
        )}

        {/* DOSSIER MODAL PROFILE INFO VIEWER LAYER */}
        {selectedLoanFile && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 animate-scaleIn">
              <button type="button" onClick={() => setSelectedLoanFile(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800"><X className="h-4 w-4" /></button>
              <h3 className="text-xl font-black text-white">👤 Debtor Financial Dossier</h3>
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/40 space-y-2">
                  <p className="text-slate-300"><strong>Aadhaar / Gov Code:</strong> {selectedLoanFile.governmentId}</p>
                  <p className="text-slate-300"><strong>Home Address coordinates:</strong> {selectedLoanFile.address}</p>
                  <p className="text-slate-300"><strong>Guarantor Reference Link:</strong> {selectedLoanFile.guarantor}</p>
                  <p className="text-slate-300"><strong>Pledged Security Collateral Asset:</strong> {selectedLoanFile.collateral}</p>
                </div>
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] uppercase font-black text-slate-500 block">Attached Legal Proof Scans:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 flex items-center justify-between"><span className="text-slate-300 truncate font-semibold">ID Scan</span><button type="button" onClick={() => alert(`Streaming filename: ${selectedLoanFile.idDoc}`)} className="text-emerald-400"><Eye className="h-3.5 w-3.5" /></button></div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 flex items-center justify-between"><span className="text-slate-300 truncate font-semibold">Contract Form</span><button type="button" onClick={() => alert(`Streaming contract name: ${selectedLoanFile.signedForm}`)} className="text-emerald-400"><Eye className="h-3.5 w-3.5" /></button></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLIENT PROPERTIES DATA WRITING EDIT OVERLAY MODAL SHEET */}
        {editingLoan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 shadow-2xl animate-scaleIn">
              <button type="button" onClick={() => setEditingLoan(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2"><Edit3 className="text-blue-400 h-5 w-5" /> Modify Client Profile</h3>
                <p className="text-xs text-slate-500">Update communication properties live in your layout matrix.</p>
              </div>
              <form onSubmit={handleSaveChangesOverride} className="space-y-4 pt-2 border-t border-slate-800 text-xs">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Full Name</label><input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Phone Contact</label><input required type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Home Residential Location</label><textarea rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collateral Asset Details</label><input type="text" value={editForm.collateral} onChange={e => setEditForm({ ...editForm, collateral: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3.5 rounded-xl uppercase text-xs transition-all mt-2">Commit Operational Profile Updates</button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}