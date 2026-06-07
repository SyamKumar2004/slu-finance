'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { Mail, ShieldCheck } from 'lucide-react';

export default function PasswordResetTunnel() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const executeResetRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      alert(`Recovery Error: ${error.message}`);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black tracking-tight text-white">Recovery Link</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Reset Access Credentials</p>
            </div>
            <form onSubmit={executeResetRecovery} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Account Recovery Email</label>
                <div className="relative mt-1">
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="user@domain.com" />
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl transition-all shadow-lg text-sm uppercase tracking-wider">
                Transmit Key Token
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4"><ShieldCheck /></div>
            <h3 className="text-xl font-bold text-white">Transmission Successful</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">Recovery path dispatched. Check your inbox to proceed.</p>
          </div>
        )}
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/60 pt-4">
          Return to login? <Link href="/auth/login" className="text-emerald-400 font-bold hover:underline">Click here</Link>
        </div>
      </div>
    </div>
  );
}