'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, UserPlus, Wallet, BarChart3, AlertTriangle, Settings, Menu, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

export default function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Master Administrator');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('slu_user_name');
      if (savedName) setAdminName(savedName);
    }
  }, []);

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
      
      {/* MOBILE HEADER */}
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
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* SIDEBAR NAVIGATION FRAME */}
      <aside className={`
        fixed inset-y-0 left-0 bg-[#0b132b] border-r border-slate-800/60 p-4 flex flex-col justify-between z-40 transition-all duration-300 ease-in-out
        md:relative md:transform-none md:flex shrink-0
        ${isCollapsed ? 'md:w-20' : 'md:w-68'}
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          <div className="flex items-center justify-between h-12 px-2">
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
                <span className="text-sm font-black tracking-widest text-white">SLU FINANCE</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all ml-auto"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* BALANCED SIDEBAR TEXT SIZES */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              const showText = !isCollapsed || isMobileOpen;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-500/20 font-extrabold text-[13px] md:text-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/30 font-bold text-[13px] md:text-sm'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {showText && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/40">
          <Link href="/" className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-all py-3 bg-rose-950/10 border border-rose-900/20 rounded-xl">
            <LogOut className="h-4 w-4" />
            {(!isCollapsed || isMobileOpen) && <span>Exit Session</span>}
          </Link>
        </div>
      </aside>

      {/* BACKDROP FOR CLOSING DRAWER ON MOBILE */}
      {isMobileOpen && (
        <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" />
      )}

      {/* CORE CANVAS WORKSPACE CONTAINER */}
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}