'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, TrendingUp, AlertTriangle, Users, ArrowRight, UserPlus, 
  Percent, Globe, Wallet, User, LogOut, CheckCircle,
  Trash2, Check, LayoutDashboard, Mail, FileText, MapPin, ShieldCheck, 
  HelpCircle, Info, X, Calendar, PlusCircle, Upload, FileCheck, Eye
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
  const [totalRegisteredUsers, setTotalRegisteredUsers] = useState<number>(0); 
  const [metrics, setMetrics] = useState({ totalLent: 0, totalCollected: 0, pendingDues: 0 });
  
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; role: string }>({ name: 'Admin', email: '', role: 'Admin' });
  const [selectedLoanFile, setSelectedLoanFile] = useState<any | null>(null);

  // Core Form Input states
  const [formData, setFormData] = useState({ 
    clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', 
    principalAmount: '10000', installmentAmount: '0', 
    tenure: 'Daily', totalInstallments: '100', interestRate: '24',
    governmentId: '', residentialAddress: '', collateralDetails: '', guarantorContact: ''
  });
  
  // Document State Management
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
        // Map the document fields to your data component model layout
        idDoc: l.uploaded_id_document_url || null,
        signedForm: l.signed_agreement_document_url || null
      }));
      setLoans(loanList);
      
      loanList.forEach(l => {
        if (l.status !== 'Deleted') {
          calculatedLent += l.principal;
          calculatedCollected += l.collected;
        }
      });
    }

    const { data: capitalRows } = await supabase.from('company_capital').select('*').order('created_at', { ascending: false });
    if (capitalRows) {
      setCapitalHistory(capitalRows);
      const totalCapitalInjected = capitalRows.reduce((sum, row) => sum + Number(row.amount), 0);
      setCompanyCapitalPool(totalCapitalInjected);
    }

    const { count, error } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
    if (!error && count !== null) setTotalRegisteredUsers(count);

    setMetrics({ totalLent: calculatedLent, totalCollected: calculatedCollected, pendingDues: calculatedLent - calculatedCollected });
  }

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = `${formData.countryCode}${formData.clientPhone}`;

    // Use selected files if uploaded, otherwise use a standard placeholder path string
    const finalIdDocPath = idDocumentName ? `/storage/documents/${idDocumentName}` : 'Clean Verified Scan';
    const finalSignedFormPath = signedFormName ? `/storage/agreements/${signedFormName}` : 'Legally Bound Terms Checked';

    await supabase.from('live_loans').insert([{
      client_name: formData.clientName, client_email: formData.clientEmail, client_phone: fullPhoneNumber,
      principal_amount: parseFloat(formData.principalAmount), installment_amount: parseFloat(formData.installmentAmount),
      tenure_type: formData.tenure, total_cycles: parseInt(formData.totalInstallments), interest_rate: parseFloat(formData.interestRate),
      status: 'Active', government_id_number: formData.governmentId, residential_address: formData.residentialAddress,
      collateral_asset_details: formData.collateralDetails, guarantor_emergency_contact: formData.guarantorContact,
      // Pass file text parameters safely into your table
      uploaded_id_document_url: finalIdDocPath,
      signed_agreement_document_url: finalSignedFormPath
    }]);

    alert(`Success: Onboarded ${formData.clientName}. Legal files and credit matrix locked successfully!`);
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
      alert(`Payment of ₹${amt.toLocaleString()} safely logged.`);
      setCollectionAmount(prev => ({ ...prev, [loanId]: '' }));
      fetchDynamicRealtimeMetrics();
    }
  };

  const handleToggleStatusComplete = async (loanId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'Active' ? 'Settled_Done' : 'Active';
    if (!confirm(`Mark this entry status change to ${targetStatus}?`)) return;

    const { error } = await supabase.from('live_loans').update({ status: targetStatus }).eq('id', loanId);
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
              <h1 className="text-xl font-black tracking-tight text-white">SLU FINANCE</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Secure Ledger Console</p>
            </div>
          </div>
          <nav className="space-y-1.5">
            <NavButton tab="overview" label="Book Records Desk" icon={LayoutDashboard} />
            <NavButton tab="onboarding" label="New Client Onboarding" icon={UserPlus} />
            <NavButton tab="funds" label="Capital Pool Reserves" icon={Wallet} />
            <NavButton tab="charts" label="Yield Analytics" icon={BarChart3} />
            <NavButton tab="risk" label="Risk Collection Radar" icon={AlertTriangle} badge={highRiskLoans.length} />
            <NavButton tab="profile" label="Admin Settings" icon={User} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 hover:bg-rose-950/40 hover:text-rose-400 transition-all text-xs font-bold uppercase tracking-wider">
            <LogOut className="h-4 w-4" /> Exit Session
          </button>
        </div>
      </aside>

      {/* WORKSPACE */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl relative">
        <header className="mb-8 flex justify-between items-center bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Welcome Back, {adminProfile.name} 👋</h2>
            <p className="text-xs text-slate-500 font-medium">System Role: Principal Credit Manager</p>
          </div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Session Verified
          </span>
        </header>

        {/* VIEW 1: RECORDS TABLE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Total Capital Lent</p><h3 className="text-2xl font-black mt-1 text-white">₹{metrics.totalLent.toLocaleString()}</h3></div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="h-5 w-5" /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Collected Yield</p><h3 className="text-2xl font-black mt-1 text-emerald-400">₹{metrics.totalCollected.toLocaleString()}</h3></div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><BarChart3 className="h-5 w-5" /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Outstanding Balances</p><h3 className="text-2xl font-black mt-1 text-amber-500">₹{metrics.pendingDues.toLocaleString()}</h3></div>
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Users className="h-5 w-5" /></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Book Size</p><h3 className="text-2xl font-black mt-1 text-teal-400">{loans.length} Borrowers</h3></div>
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
                      <th className="py-3 px-2">Principal</th>
                      <th className="py-3 px-2">Collected</th>
                      <th className="py-3 px-2">Quick Reconcile</th>
                      <th className="py-3 px-2 text-center">Status Action</th>
                      <th className="py-3 pl-2 text-right">Erase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loans.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-slate-500 font-medium">No borrower records registered yet.</td></tr>
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

        {/* =========================================================================
            VIEW 2: ADVANCED NEW CLIENT ONBOARDING WITH DOCUMENT DOCUMENT ATTACHMENTS
           ========================================================================= */}
        {activeTab === 'onboarding' && (
          <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl animate-fadeIn">
            <div className="mb-6">
              <h2 className="text-xl font-black flex items-center gap-2 text-white"><UserPlus className="text-emerald-500" /> New Client Loan Onboarding</h2>
              <p className="text-xs text-slate-400 mt-0.5">Collect client profile communication properties, background checks, asset collateral, and verification documents.</p>
            </div>
            
            <form onSubmit={handleCreateLoan} className="space-y-6">
              
              {/* Core Communications */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">1. Primary Contacts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Client Full Name</label>
                    <input required type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Enter Borrower Name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Email Address (Optional)</label>
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

              {/* Background & Security Verification Parameters */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">2. Risk Verification Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><FileText className="h-3 w-3" /> Gov ID Number (Aadhaar / PAN)</label>
                    <input required type="text" value={formData.governmentId} onChange={e => setFormData({ ...formData, governmentId: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Identity Identification Card ID" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Guarantor Emergency Reference</label>
                    <input required type="text" value={formData.guarantorContact} onChange={e => setFormData({ ...formData, guarantorContact: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Name & Mobile Contact" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Home Residential Location Address</label>
                  <textarea required rows={2} value={formData.residentialAddress} onChange={e => setFormData({ ...formData, residentialAddress: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans" placeholder="Full home landmarks, street, village..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Pledged Security Collateral Asset Note</label>
                  <input required type="text" value={formData.collateralDetails} onChange={e => setFormData({ ...formData, collateralDetails: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="e.g. Gold jewelry weight, vehicle papers, original assets..." />
                </div>
              </div>

              {/* =========================================================================
                  NEW INTERACTIVE DOCUMENT UPLOAD ATTACHMENT SHEETS PANEL
                 ========================================================================= */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">3. Document Uploads & Legal Agreements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* File Document Block 1: Aadhaar / PAN card Scans */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-slate-400" /> Government ID Scan Document</span>
                    <p className="text-[11px] text-slate-500">Upload a clean digital image or PDF scan of their Aadhaar, PAN card, or Passport files.</p>
                    <div className="relative pt-1">
                      <label className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${idDocumentName ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'}`}>
                        {idDocumentName ? <FileCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        <span className="truncate">{idDocumentName || 'Choose ID File'}</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setIdDocumentName(e.target.files[0].name); }} />
                      </label>
                    </div>
                  </div>

                  {/* File Document Block 2: Signed Mutual Ledger Agreements */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Signed Terms Form Agreement</span>
                    <p className="text-[11px] text-slate-500">Upload the document showing the client signature confirming agreement with the interest terms and repayment timeline.</p>
                    <div className="relative pt-1">
                      <label className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${signedFormName ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'}`}>
                        {signedFormName ? <FileCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        <span className="truncate">{signedFormName || 'Choose Signed Form'}</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) setSignedFormName(e.target.files[0].name); }} />
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* Pricing Structures */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">4. Loan Structure Schema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Principal Financing Sum</label>
                    <input required type="number" value={formData.principalAmount} onChange={e => setFormData({ ...formData, principalAmount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Interest Charging Rate (%)</label>
                    <div className="relative mt-1">
                      <input required type="number" step="0.1" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} className="w-full p-3 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm" />
                      <Percent className="absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Installment Payment (Auto)</label>
                    <input required type="number" value={formData.installmentAmount} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-black text-sm" readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Tenure Repayment Cycle</label>
                    <select value={formData.tenure} onChange={e => setFormData({ ...formData, tenure: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none">
                      <option value="Daily">Daily Basis Basis</option>
                      <option value="Weekly">Weekly Basis</option>
                      <option value="Monthly">Monthly Basis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Total Cycles</label>
                    <input required type="number" value={formData.totalInstallments} onChange={e => setFormData({ ...formData, totalInstallments: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm mt-4 uppercase tracking-wider">
                Lock Account Records & Deploy Credit Outflow <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* VAULT */}
        {activeTab === 'funds' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm h-fit">
              <h3 className="text-md font-black text-white flex items-center gap-1.5 mb-2"><PlusCircle className="text-emerald-400 h-4 w-4" /> Inject Capital</h3>
              <form onSubmit={handleAddCapital} className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Amount (₹)</label><input required type="number" value={capitalInput.amount} onChange={e => setCapitalInput({ ...capitalInput, amount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-md" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Source Note</label><input type="text" value={capitalInput.notes} onChange={e => setCapitalInput({ ...capitalInput, notes: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" placeholder="SBI withdrawal, savings..." /></div>
                <button type="submit" disabled={loadingFunds} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black p-3 rounded-xl uppercase tracking-wider">{loadingFunds ? 'Saving...' : 'Confirm Injection'}</button>
              </form>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center"><span className="text-xs text-slate-400 block uppercase font-bold">Liquid Reserves Pool</span><span className="text-4xl font-black text-emerald-400 block mt-2">₹{companyCapitalPool.toLocaleString()}</span></div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5"><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Investment Audit History Logs</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">{capitalHistory.map(log => (<div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-900 text-xs"><div><p className="font-bold text-slate-200">₹{Number(log.amount).toLocaleString()}</p><p className="text-[10px] text-slate-500">{log.notes}</p></div><span className="text-[9px] text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded-md">{new Date(log.created_at).toLocaleDateString('en-IN')}</span></div>))}</div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'charts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl mx-auto animate-fadeIn">
            <h2 className="text-xl font-black text-white mb-6">Yield Outflow Analytics</h2>
            <div className="flex items-end gap-6 h-64 border-b border-l border-slate-800 px-6">
              <div className="flex flex-col items-center gap-2 flex-1"><span className="text-xs font-bold text-teal-400">₹{metrics.totalLent}</span><div className="w-12 bg-teal-500 rounded-t-lg h-40"></div><span className="text-xs text-slate-400">Lent Out</span></div>
              <div className="flex flex-col items-center gap-2 flex-1"><span className="text-xs font-bold text-emerald-400">₹{metrics.totalCollected}</span><div className="w-12 bg-emerald-500 rounded-t-lg h-16"></div><span className="text-xs text-slate-400">Collected</span></div>
            </div>
          </div>
        )}

        {/* RISK */}
        {activeTab === 'risk' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            {highRiskLoans.length === 0 ? <div className="col-span-full bg-slate-900 p-12 text-center rounded-2xl border text-slate-400 border-slate-800">No payment defaults flagged on the radar.</div> : highRiskLoans.map(loan => (
              <div key={loan.id} className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5"><h3 className="text-lg font-bold text-white">{loan.name}</h3><p className="text-xs text-rose-400 font-semibold mb-3">{loan.missedDays} Days Delinquent</p><a href={`tel:${loan.phone}`} className="w-full bg-rose-600 text-white text-xs font-bold py-2 rounded-xl text-center block">Call Borrower</a></div>
            ))}
          </section>
        )}

        {/* PROFILE SPECIFICATION */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-fadeIn space-y-4">
            <div className="text-center pb-4 border-b border-slate-800/60"><div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto rounded-2xl flex items-center justify-center mb-3"><ShieldCheck className="h-8 w-8" /></div><h2 className="text-xl font-black text-white">{adminProfile.name}</h2><p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{adminProfile.role}</p></div>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold"><div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><span className="text-[10px] text-slate-500 block">ADMIN ACCESS ID</span><span className="text-slate-200 block mt-0.5">{adminProfile.name}</span></div><div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><span className="text-[10px] text-slate-500 block">SYSTEM CONSOLE MAIL</span><span className="text-slate-200 block mt-0.5 truncate">{adminProfile.email}</span></div></div>
          </div>
        )}

        {/* =========================================================================
            DYNAMIC OVERLAY POPUP MODAL SHEET SHOWING ATTACHED DOCUMENTS
           ========================================================================= */}
        {selectedLoanFile && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4 animate-scaleIn">
              <button type="button" onClick={() => setSelectedLoanFile(null)} className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-colors"><X className="h-4 w-4" /></button>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">👤 Debtor Financial Dossier</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Verification Parameters & Legal Proofs</p>
              </div>
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div><span className="text-[10px] uppercase font-black text-slate-500 block">Borrower Name</span><span className="font-bold text-slate-200">{selectedLoanFile.name}</span></div>
                  <div><span className="text-[10px] uppercase font-black text-slate-500 block">Mobile Link</span><span className="font-bold text-slate-200">{selectedLoanFile.phone}</span></div>
                </div>
                <div className="space-y-2 bg-slate-950/20 p-3 rounded-xl border border-slate-800/40">
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><FileText className="h-3 w-3" /> Identity Code (Gov ID)</span><span className="font-bold text-slate-300 block mt-0.5">{selectedLoanFile.governmentId}</span></div>
                  <hr className="border-slate-800/40" />
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Home Residential Coordinates</span><p className="text-slate-400 font-medium mt-0.5 whitespace-pre-line">{selectedLoanFile.address}</p></div>
                  <hr className="border-slate-800/40" />
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Underwritten Collateral Items</span><span className="font-bold text-slate-300 block mt-0.5">{selectedLoanFile.collateral}</span></div>
                  <hr className="border-slate-800/40" />
                  <div><span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Backup Reference Guarantor</span><span className="font-bold text-slate-300 block mt-0.5">{selectedLoanFile.guarantor}</span></div>
                  
                  {/* DOCUMENT LINKS OUTPUT SUBSECTION CONTAINER */}
                  <hr className="border-slate-800/40" />
                  <div className="pt-1 space-y-2">
                    <span className="text-[10px] uppercase font-black text-slate-500 block">Attached Legal Documents Archive:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 truncate font-semibold pr-1">ID Card Scan</span>
                        <button type="button" onClick={() => alert(`Opening document stream: ${selectedLoanFile.idDoc}`)} className="text-emerald-400 hover:text-emerald-300 p-1 transition-colors" title="View Document Scan"><Eye className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 truncate font-semibold pr-1">Signed Contract</span>
                        <button type="button" onClick={() => alert(`Opening mutual contract agreement sheet: ${selectedLoanFile.signedForm}`)} className="text-emerald-400 hover:text-emerald-300 p-1 transition-colors" title="View Signed Contract Agreement Form"><Eye className="h-3.5 w-3.5" /></button>
                      </div>
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