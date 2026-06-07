'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ShieldAlert, KeyRound } from 'lucide-react';

export default function CustomProfileResetPortal() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const targetEmail = email.trim().toLowerCase();

    // Directly updates password string inside the targeted profile record row safely
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ password_hash: newPassword })
      .eq('email', targetEmail)
      .select();

    if (!error && data && data.length > 0) {
      alert("Success: Security access key credentials updated in database rows instantly!");
      router.push('/auth/login');
    } else {
      alert("Reset Error: No matching corporate email trace found inside system indexes.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2"><ShieldAlert className="text-amber-500" /> Credential Overrides</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Reset System Master Keys</p>
        </div>

        <form onSubmit={handleCredentialReset} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Admin Email</label>
            <div className="relative mt-1">
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="admin@domain.com" />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Establish New Secure Password</label>
            <div className="relative mt-1">
              <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••••••" />
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-3.5 rounded-xl transition-all uppercase tracking-wider text-xs">
            {loading ? 'Overriding Key matrix...' : 'Override Security Access Passkey'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/60">
          Remember keys? <Link href="/auth/login" className="text-emerald-400 font-bold hover:underline">Return to Sign In</Link>
        </div>
      </div>
    </div>
  );
}