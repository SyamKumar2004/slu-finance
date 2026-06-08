'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, UserPlus, Wallet, BarChart3, AlertTriangle, Settings, Menu, X } from 'lucide-react';

export default function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { name: 'Book Records Desk', path: '/dashboard', icon: BookOpen },
    { name: 'New Client Onboarding', path: '/dashboard/onboarding', icon: UserPlus },
    { name: 'Capital Pool Reserves', path: '/dashboard/funds', icon: Wallet },
    { name: 'Yield Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Risk Collection Radar', path: '/dashboard/risk', icon: AlertTriangle },
    { name: 'Admin Settings', path: '/dashboard/profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      
      {/* MOBILE TOP BAR NAVIGATION HEADER */}
      <header className="md:hidden w-full bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm font-black tracking-wider text-white">SLU FINANCE</span>
        </div>
        <button 
          type="button" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* RESPONSIBLE FIXED REVENUE SIDEBAR BAR FRAME */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:transform-none md:flex
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-8">
          <div className="hidden md:flex items-center gap-2.5 px-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            <span className="text-md font-black tracking-widest text-white">SLU FINANCE</span>
          </div>

          <nav className="space-y-1.5">
            {navigationLinks.map((link) => {
              const IconComponent = link.icon;
              const isRouteActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isRouteActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 border border-emerald-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                  }`}
                >
                  <IconComponent className={`h-4 w-4 ${isRouteActive ? 'text-white' : 'text-slate-500'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/60 text-center">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-all block py-2 bg-rose-950/10 border border-rose-900/20 rounded-xl">
            Exit Session
          </Link>
        </div>
      </aside>

      {/* MOBILE NAV MENU BACKGROUND OVERLAY PANEL */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" 
        />
      )}

      {/* CORE PORTAL MAIN SURFACE LAYER */}
      <main className="flex-1 w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {children}
      </main>

    </div>
  );
}