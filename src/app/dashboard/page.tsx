'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, TrendingUp, AlertTriangle, Users, ArrowRight, UserPlus, 
  ShieldAlert, PhoneCall, Percent, Globe, Wallet, User, LogOut, CheckCircle,
  Trash2, DollarSign, Check
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
];

export default function ProtectedAdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'charts' | 'risk' | 'profile'>('overview');
  const [loans, setLoans] = useState<any[]>([]);
  const [companyCapitalPool, setCompanyCapitalPool] = useState<number>(0);
  const [totalRegisteredUsers, setTotalRegisteredUsers] = useState<number>(0); 
  const [metrics, setMetrics] = useState({ totalLent: 0, totalCollected: 0, pendingDues: 0 });
  const [adminProfileName, setAdminProfileName] = useState<string>('SYSTEM ADMIN');

  // Input states
  const [formData, setFormData] = useState({ 
    clientName: '', countryCode: '+91', clientPhone: '', 
    principalAmount: '10000', installmentAmount: '0', 
    tenure: 'Daily', totalInstallments: '100', interestRate: '24' 
  });
  const [capitalForm, setCapitalForm] = useState({ amount: '', source: 'Owner Injection' });
  const [collectionAmount, setCollectionAmount] = useState<{ [key: string]: string }>({});

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
      setFormData(prev => (prev.installmentAmount !== preciseInstallment.toString() ? { ...prev, installmentAmount: preciseInstallment.toString() } : prev));
    }
  }, [formData.principalAmount, formData.interestRate, formData.totalInstallments]);

  async function enforceAdministrativeSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: profile } = await supabase.from('user_profiles').select('full_name, role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      router.push('/auth/login');
      return;
    }

    if (profile?.full_name) {
      setAdminProfileName(profile.full_name);
    }

    fetchDynamicRealtimeMetrics();
  }

  async function fetchDynamicRealtimeMetrics() {
    const { data: rawLoans } = await supabase.from('live_loans').select('*').order('created_at', { ascending: false });
    let loanList: any[] = [];
    let calculatedLent = 0;
    let calculatedCollected = 0;

    if (rawLoans) {
      loanList = rawLoans.map((l: any) => ({
        id: l.id, name: l.client_name, phone: l.client_phone, principal: Number(l.principal_amount),
        installment: Number(l.installment_amount), tenure: l.tenure_type, interest: Number(l.interest_rate),
        status: l.status, missedDays: l.missed_days_count || 0, collected: Number(l.total_collected || 0),
        totalCycles: Number(l.total_cycles || 100)
      }));
      setLoans(loanList);
      
      loanList.forEach(l => {
        if (l.status !== 'Deleted') {
          calculatedLent += l.principal;
          calculatedCollected += l.collected;
        }
      });
    }

    const { data: capitalRows } = await supabase.from('company_capital').select('amount');
    const totalCapitalInjected = capitalRows ? capitalRows.reduce((sum, row) => sum + Number(row.amount), 0) : 0;
    setCompanyCapitalPool(totalCapitalInjected);

    const { count, error } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
    if (!error && count !== null) {
      setTotalRegisteredUsers(count);
    }

    setMetrics({
      totalLent: calculatedLent,
      totalCollected: calculatedCollected,
      pendingDues: calculatedLent - calculatedCollected
    });
  }

  // --- NEW MASTER ADMINISTRATIVE FEATURES ---

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = `${formData.countryCode}${formData.clientPhone}`;

    await supabase.from('live_loans').insert([{
      client_name: formData.clientName, client_phone: fullPhoneNumber,
      principal_amount: parseFloat(formData.principalAmount), installment_amount: parseFloat(formData.installmentAmount),
      tenure_type: formData.tenure, total_cycles: parseInt(formData.totalInstallments),
      interest_rate: parseFloat(formData.interestRate), status: 'Pending_Verification'
    }]);

    alert(`Success: Loan portfolio recorded for processing.`);
    setFormData({ clientName: '', countryCode: '+91', clientPhone: '', principalAmount: '10000', installmentAmount: '0', tenure: 'Daily', totalInstallments: '100', interestRate: '24' });
    fetchDynamicRealtimeMetrics();
  };

  const handleRecordCollection = async (loanId: string, currentCollected: number) => {
    const amt = parseFloat(collectionAmount[loanId] || '0');
    if (isNaN(amt) || amt <= 0) {
      alert("Please specify a valid collection sum amount.");
      return;
    }

    const nextCollectedSum = currentCollected + amt;
    
    const { error } = await supabase
      .from('live_loans')
      .update({ total_collected: nextCollectedSum })
      .eq('id', loanId);

    if (!error) {
      alert(`Payment of ₹${amt.toLocaleString()} safely reconciled to database ledger entries.`);
      setCollectionAmount(prev => ({ ...prev, [loanId]: '' }));
      fetchDynamicRealtimeMetrics();
    }
  };

  const handleToggleStatusComplete = async (loanId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'Active' ? 'Settled_Done' : 'Active';
    const msg = targetStatus === 'Settled_Done' 
      ? "Mark this loan account as fully completed, cleared, and closed?" 
      : "Re-activate this credit row ledger timeline to active monitoring status?";
    
    if (!confirm(msg)) return;

    const { error } = await supabase
      .from('live_loans')
      .update({ status: targetStatus })
      .eq('id', loanId);

    if (!error) {
      fetchDynamicRealtimeMetrics();
    }
  };

  const handleDeleteLoanRecord = async (loanId: string) => {
    if (!confirm("Are you absolutely sure you want to completely erase this loan record from the operational view ledger tables? This action cannot be reversed.")) return;

    const { error } = await supabase
      .from('live_loans')
      .delete()
      .eq('id', loanId);

    if (!error) {
      alert("Ledger target row dropped successfully.");
      fetchDynamicRealtimeMetrics();
    } else {
      alert(`Execution interrupted: ${error.message}`);
    }
  };

  const injectCompanyCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(capitalForm.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    await supabase.from('company_capital').insert([{ amount: parsedAmount, source: capitalForm.source }]);
    alert(`Success: ₹${parsedAmount.toLocaleString()} Injected into Liquid Reserves Pool Assets.`);
    setCapitalForm({ amount: '', source: 'Owner Injection' });
    fetchDynamicRealtimeMetrics();
  };

  const highRiskLoans = loans.filter(l => (l.tenure === 'Daily' && l.missedDays > 3) || (l.tenure === 'Monthly' && l.missedDays > 10));

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-50 antialiased font-sans">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">SLU CONTROL PANEL</h1>
          <p className="text-sm text-slate-500">Autonomous Admin Console</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setActiveTab('overview')} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${activeTab === 'overview' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>Overview</button>
          <button type="button" onClick={() => setActiveTab('funds')} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${activeTab === 'funds' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-800'}`}><Wallet className="h-3.5 w-3.5" /> Company Capital</button>
          <button type="button" onClick={() => setActiveTab('charts')} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${activeTab === 'charts' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-800'}`}><BarChart3 className="h-3.5 w-3.5" /> Analytics</button>
          <button type="button" onClick={() => setActiveTab('risk')} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${activeTab === 'risk' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-900 text-rose-500 border-slate-800'}`}><AlertTriangle className="h-3.5 w-3.5" /> Risk Radar ({highRiskLoans.length})</button>
          <button type="button" onClick={() => setActiveTab('profile')} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${activeTab === 'profile' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 text-slate-400 border-slate-800'}`}><User className="h-3.5 w-3.5" /> Admin Profile</button>
          <button type="button" onClick={() => { supabase.auth.signOut(); router.push('/auth/login'); }} className="p-2.5 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/30 hover:bg-rose-950/80 transition-all"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div><p className="text-xs font-bold text-slate-400 uppercase">Total Capital Lent</p><h3 className="text-2xl font-black mt-1 text-white">₹{metrics.totalLent.toLocaleString()}</h3></div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp /></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div><p className="text-xs font-bold text-slate-400 uppercase">Collected Yield</p><h3 className="text-2xl font-black mt-1 text-emerald-400">₹{metrics.totalCollected.toLocaleString()}</h3></div>
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><BarChart3 /></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div><p className="text-xs font-bold text-slate-400 uppercase">Outstanding Balances</p><h3 className="text-2xl font-black mt-1 text-amber-500">₹{metrics.pendingDues.toLocaleString()}</h3></div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Users /></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div><p className="text-xs font-bold text-slate-400 uppercase">Platform Active Users</p><h3 className="text-2xl font-black mt-1 text-teal-400">{totalRegisteredUsers} Users</h3></div>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><User /></div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm h-fit">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white"><UserPlus className="text-emerald-500" /> New Client Onboarding</h2>
              <form onSubmit={handleCreateLoan} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                  <input required type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="XXXX XXXXXX" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp / Contact Phone</label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative">
                      <select value={formData.countryCode} onChange={e => setFormData({...formData, countryCode: e.target.value})} className="h-full pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold appearance-none cursor-pointer text-sm">
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                      <Globe className="absolute right-2 top-4 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    <input required type="tel" value={formData.clientPhone} onChange={e => setFormData({...formData, clientPhone: e.target.value})} className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-sm" placeholder="XXXXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Interest Rate (%)</label>
                  <div className="relative mt-1">
                    <input required type="number" step="0.1" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} className="w-full p-3 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm" />
                    <Percent className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Principal</label>
                    <input required type="number" value={formData.principalAmount} onChange={e => setFormData({...formData, principalAmount: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Installment (Auto)</label>
                    <input required type="number" value={formData.installmentAmount} className="w-full mt-1 p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-black text-sm" readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Tenure Cycle</label>
                    <select value={formData.tenure} onChange={e => setFormData({...formData, tenure: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm">
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Total Cycles</label>
                    <input required type="number" value={formData.totalInstallments} onChange={e => setFormData({...formData, totalInstallments: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm">
                  Generate Verification Terms <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="xl:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
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
                    {loans.map((loan) => {
                      const isRisk = (loan.tenure === 'Daily' && loan.missedDays > 3) || (loan.tenure === 'Monthly' && loan.missedDays > 10);
                      return (
                        <tr key={loan.id} className={`hover:bg-slate-950/40 transition-colors ${isRisk ? 'bg-rose-500/5' : ''}`}>
                          <td className="py-3.5 pr-2 font-medium">
                            <div className="font-semibold text-slate-100">{loan.name}</div>
                            <div className="text-xs text-slate-500">{loan.phone}</div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold uppercase tracking-wider">{loan.tenure}</span>
                          </td>
                          <td className="py-3.5 px-2 font-bold text-slate-100">₹{loan.principal.toLocaleString()}</td>
                          <td className="py-3.5 px-2 font-bold text-emerald-400">₹{loan.collected.toLocaleString()}</td>
                          
                          {/* QUICK RECONCILE COLUMN */}
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                placeholder="₹ Amt" 
                                value={collectionAmount[loan.id] || ''} 
                                onChange={e => setCollectionAmount({ ...collectionAmount, [loan.id]: e.target.value })}
                                className="w-20 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white text-center font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRecordCollection(loan.id, loan.collected)}
                                className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all"
                                title="Reconcile Payment"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* DYNAMIC SETTLED / ACTIVE STATUS CONTROL */}
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStatusComplete(loan.id, loan.status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider border uppercase transition-all ${
                                loan.status === 'Settled_Done'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                                  : loan.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-amber-600/20 hover:text-amber-400 hover:border-amber-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-emerald-600 hover:text-white'
                              }`}
                            >
                              {loan.status === 'Settled_Done' ? '✅ Settled' : loan.status === 'Active' ? 'Mark Done' : loan.status}
                            </button>
                          </td>

                          {/* DELETE ROW ICON BLOCK */}
                          <td className="py-3.5 pl-2 text-right">
                            <button 
                              type="button" 
                              onClick={() => handleDeleteLoanRecord(loan.id)}
                              className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Ledger Entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'funds' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-black flex items-center gap-2 text-white mb-2"><Wallet className="text-emerald-500" /> Capital Pool Management Vault</h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">Inject operational capital reserves to increase platform lending capability boundaries.</p>
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 mb-6 text-center">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Liquid Capital Pool Net Worth</span>
            <span className="text-4xl font-black text-emerald-400 block mt-2">₹{companyCapitalPool.toLocaleString()}</span>
          </div>
          <form onSubmit={injectCompanyCapital} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Injection Sum (INR)</label>
              <input required type="number" value={capitalForm.amount} onChange={e => setCapitalForm({...capitalForm, amount: e.target.value})} className="w-full mt-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-lg" placeholder="100000" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Funding Channel Vector Source</label>
              <select value={capitalForm.source} onChange={e => setCapitalForm({...capitalForm, source: e.target.value})} className="w-full mt-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-sm">
                <option value="Owner Injection">Primary Owner Capital Injection Pool</option>
                <option value="Angel Investment">Angel Venture Investment Allocation</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm">
              Approve Asset Vault Injection <CheckCircle className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2"><BarChart3 className="text-emerald-500" /> Dynamic Company Analytics Engine</h2>
          <p className="text-xs text-slate-400 mb-8 font-medium">Real-time analytical mapping variables indicating structural capital allocations.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-6 h-80 pt-12 border-b border-l border-slate-800 px-6">
            <div className="flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-emerald-400">₹{companyCapitalPool}</span>
              <div className="w-full bg-emerald-500 rounded-t-xl shadow-lg shadow-emerald-500/20" style={{ height: '95%' }}></div>
              <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Injected Capital</span>
            </div>
            <div className="flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-teal-400">₹{metrics.totalLent}</span>
              <div className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-xl shadow-lg shadow-teal-500/20" style={{ height: `${Math.min(100, (metrics.totalLent / (companyCapitalPool || 1)) * 100)}%` }}></div>
              <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Active Outflows</span>
            </div>
            <div className="flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-blue-400">₹{metrics.totalCollected}</span>
              <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl shadow-lg shadow-blue-500/20" style={{ height: `${Math.min(100, (metrics.totalCollected / (companyCapitalPool || 1)) * 100)}%` }}></div>
              <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Realized Yield</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highRiskLoans.length === 0 ? (
            <div className="col-span-full bg-slate-900 p-12 text-center rounded-2xl border text-slate-400 font-medium border-slate-800">No system escalations detected. Operational pipelines nominal.</div>
          ) : (
            highRiskLoans.map(loan => (
              <div key={loan.id} className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-2"><ShieldAlert className="h-4 w-4" /> High Priority Risk</div>
                <h3 className="text-xl font-bold text-white">{loan.name}</h3>
                <p className="text-xs text-slate-400 mb-4 font-semibold">Delinquent Interval: {loan.missedDays} Days Missed</p>
                <div className="border-t border-slate-800 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Total Obligation:</span><span className="font-bold text-white">₹{loan.principal}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Interest Applied:</span><span className="font-semibold text-slate-300">{loan.interest}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Overdue Installment:</span><span className="font-bold text-rose-500">₹{loan.installment}</span></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <a href={`tel:${loan.phone}`} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-2 transition-all shadow-sm"><PhoneCall className="h-3.5 w-3.5" /> Call Direct</a>
                  <button type="button" onClick={() => alert('Automated WhatsApp Legal Warning Transmitted.')} className="flex-1 bg-slate-950 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-800 transition-all">Send Notice</button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 mx-auto rounded-full flex items-center justify-center mb-4"><User className="h-10 w-10" /></div>
          <h2 className="text-2xl font-black text-white">{adminProfileName}</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Lead Administrative Underwriter</p>
          <div className="border-t border-slate-800 my-6 pt-4 text-left space-y-3 text-sm font-medium">
            <div className="flex justify-between"><span className="text-slate-400">Profile Privilege:</span><span className="text-emerald-400 font-bold">System Super-Admin</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Terminal Security Node:</span><span className="text-blue-400 font-bold">Encrypted SSL Session</span></div>
          </div>
        </div>
      )}
    </div>
  );
}