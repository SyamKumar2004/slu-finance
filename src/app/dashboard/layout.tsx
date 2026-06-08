'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, UserPlus, Wallet, BarChart3, AlertTriangle, Settings, Menu, X, LogOut } from 'lucide-react';

export default function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Book Records Desk', path: '/dashboard', icon: BookOpen },
    { name: 'New Client Onboarding', path: '/dashboard/onboarding', icon: UserPlus },
    { name: 'Capital Pool Reserves', path: '/dashboard/funds', icon: Wallet },
    { name: 'Yield Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Risk Collection Radar', path: '/dashboard/risk', icon: AlertTriangle },
    { name: 'Admin Settings', path: '/dashboard/profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* MOBILE TOPBAR STATUS BAR */}
      <header className="md:hidden w-full bg-[#0b132b] border-b border-slate-800/80 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm font-black tracking-wider text-white">SLU FINANCE</span>
        </div>
        <button 
          type="button" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION GRID */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#0b132b] border-r border-slate-800/60 p-6 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:transform-none md:flex shrink-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-8">
          <div className="hidden md:flex items-center gap-2.5 px-2">
            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
            <span className="text-sm font-black tracking-widest text-white">SLU FINANCE</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/30'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/40">
          <Link href="/" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-all py-3 bg-rose-950/10 border border-rose-900/20 rounded-xl">
            <LogOut className="h-3.5 w-3.5" /> Exit Session
          </Link>
        </div>
      </aside>

      {/* OVERLAY BACKDROP FOR CLOSING DRAWER ON MOBILE */}
      {isMobileOpen && (
        <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" />
      )}

      {/* FULL RESPONSIVE WORKING CANVAS WINDOW CONTAINER */}
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}