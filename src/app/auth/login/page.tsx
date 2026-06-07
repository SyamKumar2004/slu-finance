'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function UserSignInPortal() {
  const supabase = createClient();
  const router = useRouter();
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const executeLoginSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
  
    if (authError) {
      alert(`Authentication Reject: ${authError.message}`);
      setLoading(false);
      return;
    }
  
    // Look up the role attribute assigned to this user profile record inside Postgres
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', authData.user?.id)
      .single();
    
    if (profile?.role === 'admin') {
      // Navigate straight to your Master Controls Panel
      router.push('/dashboard');
    } else if (profile?.role === 'client') {
      // Navigate straight to the private client profile space
      router.push('/client/dashboard');
    } else {
      alert('Access Exception: Profile verification configuration error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black tracking-tight text-white">System Gateway</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Personnel Authorization Terminal</p>
        </div>
        <form onSubmit={executeLoginSignature} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Corporate Email</label>
            <div className="relative mt-1">
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-white text-sm" placeholder="user@domain.com" />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase">Access Security Key</label>
              <Link href="/auth/reset" className="text-xs text-emerald-400 font-semibold hover:underline">Forgot Key?</Link>
            </div>
            <div className="relative mt-1">
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-white text-sm font-sans" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            {loading ? 'Processing...' : 'Authenticate Identity'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/60 pt-4">
          New system user registration? <Link href="/auth/signup" className="text-emerald-400 font-bold hover:underline">Register profile here</Link>
        </div>
      </div>
    </div>
  );
}