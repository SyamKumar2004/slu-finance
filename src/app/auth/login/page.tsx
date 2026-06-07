'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function CustomDirectLoginPortal() {
  const supabase = createClient();
  const router = useRouter();
  
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSystemLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const matchTarget = identifier.trim().toLowerCase();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`email.eq.${matchTarget},phone_number.eq.${matchTarget}`)
      .maybeSingle();

    if (error) { alert("System Error: Failed to resolve database matrix connection handles."); setLoading(false); return; }

    if (profile && profile.password_hash === password) {
      localStorage.setItem('slu_session_active', 'true');
      localStorage.setItem('slu_user_name', profile.full_name || 'Potnuru Syamkumar');
      localStorage.setItem('slu_user_email', profile.email || 'admin@slufinance.internal');
      alert("Access Granted! Welcome to your secure ledger console.");
      router.push('/dashboard');
    } else {
      alert("Invalid Credentials: Passwords do not match or user routing tracking index not found.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white tracking-tight">System Gateway</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Personnel Authorization Terminal</p>
        </div>
        <form onSubmit={handleSystemLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corporate Email or Phone</label>
            <div className="relative mt-1">
              <input required type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="syamkumarpotnuru7@gmail.com or +91..." />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Security Key</label>
            <div className="relative mt-1">
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm uppercase">
            <LogIn className="h-4 w-4" /> {loading ? 'Authenticating Identity...' : 'Authenticate Identity'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-500">
          New system user registration? <Link href="/auth/signup" className="text-emerald-400 font-bold hover:underline">Register profile here</Link>
          <span className="mx-2">|</span>
          <Link href="/auth/reset" className="text-amber-500 font-bold hover:underline">Forgot Key?</Link>
        </div>
      </div>
    </div>
  );
}