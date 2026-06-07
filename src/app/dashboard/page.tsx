'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, TrendingUp, AlertTriangle, Users, ArrowRight, UserPlus, 
  ShieldAlert, PhoneCall, Percent, Globe, Wallet, User, LogOut, CheckCircle,
  Trash2, Check, LayoutDashboard, Mail
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
];

export default function ProtectedAdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  // Sidebar state tracking - matching the clean navigation style from image_4aaecf.png
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'funds' | 'charts' | 'risk' | 'profile'>('overview');
  
  const [loans, setLoans] = useState<any[]>([]);
  const [companyCapitalPool, setCompanyCapitalPool] = useState<number>(0);
  const [totalRegisteredUsers, setTotalRegisteredUsers] = useState<number>(0); 
  const [metrics, setMetrics] = useState({ totalLent: 0, totalCollected: 0, pendingDues: 0 });
  const [adminProfileName, setAdminProfileName] = useState<string>('SYSTEM ADMIN');

  // Input states
  const [formData, setFormData] = useState({ 
    clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', 
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

    if (profile?.full_name) setAdminProfileName(profile.full_name);
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
    if (!error && count !== null) setTotalRegisteredUsers(count);

    setMetrics({ totalLent: calculatedLent, totalCollected: calculatedCollected, pendingDues: calculatedLent - calculatedCollected });
  }

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = `${formData.countryCode}${formData.clientPhone}`;

    await supabase.from('live_loans').insert([{
      client_name: formData.clientName,
      client_email: formData.clientEmail,
      client_phone: fullPhoneNumber,
      principal_amount: parseFloat(formData.principalAmount),
      installment_amount: parseFloat(formData.installmentAmount),
      tenure_type: formData.tenure,
      total_cycles: parseInt(formData.totalInstallments),
      interest_rate: parseFloat(formData.interestRate),
      status: 'Pending_Verification'
    }]);

    alert(`Success: Onboarded ${formData.clientName}. Loan entry created as Pending Verification!`);
    setFormData({ clientName: '', clientEmail: '', countryCode: '+91', clientPhone: '', principalAmount: '10000', installmentAmount: '0', tenure: 'Daily', totalInstallments: '100', interestRate: '24' });
    setActiveTab('overview');
    fetchDynamicRealtimeMetrics();
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
    if (!confirm("Completely erase this ledger entry from the system database permanently?")) return;
    const { error } = await supabase.from('live_loans').delete().eq('id', loanId);
    if (!error) { alert("Record dropped successfully."); fetchDynamicRealtimeMetrics(); }
  };

  const highRiskLoans = loans.filter(l => (l.tenure === 'Daily' && l.missedDays > 3) || (l.tenure === 'Monthly' && l.missedDays > 10));

  // Navigation Button Render Helper
  const NavButton = ({ tab, label, icon: Icon, badge }: { tab: typeof activeTab, label: string, icon: any, badge?: number }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-bold transition-all ${
        activeTab === tab 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20' 
          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{badge}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50 antialiased font-sans">
      
      {/* =========================================================================
          PERMANENT SIDEBAR MENU LAYOUT (Inspired by image_4aaecf.png)
         ========================================================================= */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="p-5">
          <div className="mb-8 px-2">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">SLU LEDGER PRO</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Local Finance Panel</p>
          </div>
          <nav className="space-y-1.5">
            <NavButton tab="overview" label="Book Records Desk" icon={LayoutDashboard} />
            <NavButton tab="onboarding" label="New Client Onboarding" icon={UserPlus} />
            <NavButton tab="funds" label="Capital Pool Reserves" icon={Wallet} />
            <NavButton tab="charts" label="Yield Analytics" icon={BarChart3} />
            <NavButton tab="risk" label="Risk Collection Radar" icon={AlertTriangle} badge={highRiskLoans.length} />
            <NavButton tab="profile" label="Admin Profile" icon={User} />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/20">
          <div className="text-left overflow-hidden">
            <p className="text-xs font-black text-slate-200 truncate">{adminProfileName}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Book Manager</p>
          </div>
          <button 
            onClick={() => { supabase.auth.signOut(); router.push('/auth/login'); }} 
            className="p-2 rounded-xl bg-rose-950/30 text-rose-400 border border-rose-900/40 hover:bg-rose-950/80 transition-all"
            title="Log Out Terminal"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE DASHBOARD CONTENT AREA
         ========================================================================= */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl">
        
        {/* VIEW 1: MAIN LEDGER OVERVIEW DESK */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Metric Strip */}
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
                <div><p className="text-xs font-bold text-slate-400 uppercase">Platform Accounts</p><h3 className="text-2xl font-black mt-1 text-teal-400">{totalRegisteredUsers} Users</h3></div>
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><User className="h-5 w-5" /></div>
              </div>
            </section>

            {/* Active Accounts Table List */}
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
                      <tr><td colSpan={7} className="py-8 text-center text-slate-500 font-medium">No ledger sheets logged yet. Move to New Onboarding.</td></tr>
                    ) : loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3.5 pr-2 font-medium">
                          <div className="font-semibold text-slate-100">{loan.name}</div>
                          <div className="text-xs text-slate-500">{loan.phone}</div>
                          <div className="text-[11px] text-slate-400/80 italic">{loan.email}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold uppercase tracking-wider">{loan.tenure}</span>
                        </td>
                        <td className="py-3.5 px-2 font-bold text-slate-100">₹{loan.principal.toLocaleString()}</td>
                        <td className="py-3.5 px-2 font-bold text-emerald-400">₹{loan.collected.toLocaleString()}</td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" placeholder="₹ Amt" 
                              value={collectionAmount[loan.id] || ''} 
                              onChange={e => setCollectionAmount({ ...collectionAmount, [loan.id]: e.target.value })}
                              className="w-20 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white text-center font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button 
                              type="button" onClick={() => handleRecordCollection(loan.id, loan.collected)}
                              className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all"
                            ><Check className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <button
                            type="button" onClick={() => handleToggleStatusComplete(loan.id, loan.status)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase transition-all ${
                              loan.status === 'Settled_Done' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              loan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-amber-500/20 hover:text-amber-400' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {loan.status === 'Settled_Done' ? '✅ Settled' : loan.status === 'Active' ? 'Mark Done' : 'Verify Link Sent'}
                          </button>
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <button type="button" onClick={() => handleDeleteLoanRecord(loan.id)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
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
            VIEW 2: DEDICATED NEW CLIENT ONBOARDING INTERFACE (SPACIOUS FULL PAGE)
           ========================================================================= */}
        {activeTab === 'onboarding' && (
          <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl animate-fadeIn">
            <h2 className="text-xl font-black flex items-center gap-2 mb-1 text-white"><UserPlus className="text-emerald-500" /> New Client Loan Onboarding</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Issue a new loan file entry to local borrowers and register their verification profiles.</p>
            
            <form onSubmit={handleCreateLoan} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Client Full Name</label>
                  <input required type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Enter Full Name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Primary Email Address</label>
                  <div className="relative mt-1">
                    <input required type="email" value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} className="w-full p-3 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500" placeholder="client@example.com" />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>
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
                  <input required type="tel" value={formData.clientPhone} onChange={e => setFormData({...formData, clientPhone: e.target.value})} className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-sm focus:ring-2 focus:ring-emerald-500" placeholder="XXXXXXXXXX" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Principal Loan Amount</label>
                  <input required type="number" value={formData.principalAmount} onChange={e => setFormData({...formData, principalAmount: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Interest Rate (%)</label>
                  <div className="relative mt-1">
                    <input required type="number" step="0.1" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} className="w-full p-3 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500" />
                    <Percent className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Installment Payment (Auto)</label>
                  <input required type="number" value={formData.installmentAmount} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-black text-sm focus:outline-none" readOnly />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Tenure Cycle</label>
                  <select value={formData.tenure} onChange={e => setFormData({...formData, tenure: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-emerald-500">
                    <option value="Daily">Daily Basis</option>
                    <option value="Weekly">Weekly Basis</option>
                    <option value="Monthly">Monthly Basis</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Total Cycles (Installments)</label>
                  <input required type="number" value={formData.totalInstallments} onChange={e => setFormData({...formData, totalInstallments: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm mt-2">
                Generate Verification Loan Terms <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: LIQUID CAPITAL VAULT */}
        {activeTab === 'funds' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-white mb-4">Capital Vault Management</h2>
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center mb-6">
              <span className="text-xs text-slate-400 block uppercase font-bold">Liquid Reserve Base Pool</span>
              <span className="text-3xl font-black text-emerald-400 block mt-2">₹{companyCapitalPool.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* VIEW 4: ANALYTICS DIAGRAM */}
        {activeTab === 'charts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-xl font-black text-white mb-6">Yield Outflow Analytics</h2>
            <div className="flex items-end gap-6 h-64 pt-12 border-b border-l border-slate-800 px-6">
              <div className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                <span className="text-[10px] font-bold text-teal-400">₹{metrics.totalLent}</span>
                <div className="w-12 bg-teal-500 rounded-t-lg" style={{ height: '70%' }}></div>
                <span className="text-xs text-slate-400">Lent Out</span>
              </div>
              <div className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                <span className="text-[10px] font-bold text-emerald-400">₹{metrics.totalCollected}</span>
                <div className="w-12 bg-emerald-500 rounded-t-lg" style={{ height: '30%' }}></div>
                <span className="text-xs text-slate-400">Collected</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: DELINQUENCY RADAR */}
        {activeTab === 'risk' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highRiskLoans.length === 0 ? (
              <div className="col-span-full bg-slate-900 p-12 text-center rounded-2xl border text-slate-400 font-medium border-slate-800">No current payment defaults flagged.</div>
            ) : highRiskLoans.map(loan => (
              <div key={loan.id} className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-white">{loan.name}</h3>
                <p className="text-xs text-rose-400 font-semibold mb-3">{loan.missedDays} Days Delinquent</p>
                <a href={`tel:${loan.phone}`} className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 px-4 rounded-xl text-center block">Call Direct</a>
              </div>
            ))}
          </section>
        )}

        {/* VIEW 6: ADMIN USER MANAGEMENT PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
            <h2 className="text-xl font-black text-white">{adminProfileName}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Super Admin Account</p>
          </div>
        )}

      </main>
    </div>
  );
}