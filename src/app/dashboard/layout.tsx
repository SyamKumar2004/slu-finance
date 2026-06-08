'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  LayoutDashboard, UserPlus, Wallet, BarChart3, AlertTriangle, Settings, LogOut, ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [companyName, setCompanyName] = useState('SLU Finance');
  const [adminName, setAdminName] = useState('Potnuru Syamkumar');

  useEffect(() => {
    const activeLocalSession = localStorage.getItem('slu_session_active');
    const locallySavedName = localStorage.getItem('slu_user_name');
    if (activeLocalSession !== 'true') {
      router.push('/auth/login');
      return;
    }
    if (locallySavedName) setAdminName(locallySavedName);

    // Pull custom branding live from settings
    supabase.from('system_settings').select('company_name').limit(1).maybeSingle().then(({ data }) => {
      if (data?.company_name) setCompanyName(data.company_name);
    });
  }, [pathname, router]);

  const navItems = [
    { path: '/dashboard', label: 'Book Records Desk', icon: LayoutDashboard },
    { path: '/dashboard/onboarding', label: 'New Client Onboarding', icon: UserPlus },
    { path: '/dashboard/funds', label: 'Capital Pool Reserves', icon: Wallet },
    { path: '/dashboard/analytics', label: 'Yield Analytics', icon: BarChart3 },
    { path: '/dashboard/risk', label: 'Risk Collection Radar', icon: AlertTriangle },
    { path: '/dashboard/profile', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50 antialiased font-sans">
      {/* SIDEBAR NAVIGATION SHELL */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-20">
        <div className="p-5">
          <div className="mb-8 px-2 flex items-center gap-2">
            <div className="w-2.5 h-6 bg-emerald-500 rounded-full"></div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight truncate">{companyName}</h1>
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold transition-all ${
                    isActive ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => { localStorage.clear(); router.push('/auth/login'); }} 
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-xs font-bold uppercase transition-all"
          >
            <LogOut className="h-4 w-4" /> Exit Session
          </button>
        </div>
      </aside>

      {/* DASHBOARD CONTENT SPACE */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="mb-8 flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold text-white">Welcome Back, {adminName} 👋</h2>
            <p className="text-xs text-slate-500 font-medium">Platform Role: Master Administrator</p>
          </div>
          <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> Live Operational Mode
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}