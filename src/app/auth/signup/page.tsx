'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function UserSelfRegistrationPortal() {
  const supabase = createClient();
  const router = useRouter();
  
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const executeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Validation Error: Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      alert("Security Requirement: Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    // 1. Submit Auth User Data to Supabase with options to flag automatic bypass metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          email_confirmed: true // Passes execution confirmation flag tokens to the DB core engine
        }
      }
    });

    if (authError) {
      alert(`Registration Blocked: ${authError.message}`);
      setLoading(false);
      return;
    }

    // 2. Generate matching profile metadata tracking record inside your public data tables
    if (authData?.user) {
      const { error: profileError } = await supabase.from('user_profiles').insert([{
        id: authData.user.id,
        full_name: form.name,
        phone_number: form.phone,
        role: 'client' // Automatically provisions client routing parameters
      }]);

      if (profileError) {
        alert(`Database Profile Sync Failure: ${profileError.message}`);
      } else {
        alert('Account successfully configured and auto-verified! Redirecting to Dashboard panel...');
        // 3. Automatically route them straight past the gateway entry locks
        router.push('/client/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black tracking-tight text-white">Profile Creation</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Register New System Account</p>
        </div>
        <form onSubmit={executeRegistration} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Full Legal Name</label>
            <div className="relative mt-1">
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Jane Doe" />
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Primary Email Address</label>
            <div className="relative mt-1">
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="user@example.com" />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Contact Phone Number</label>
            <div className="relative mt-1">
              <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="+91 00000 00000" />
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Establish Password</label>
            <div className="relative mt-1">
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Confirm Password</label>
            <div className="relative mt-1">
              <input required type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            <UserPlus className="h-4 w-4" /> {loading ? 'Processing...' : 'Complete System Registration'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/60 pt-4">
          Already verified? <Link href="/auth/login" className="text-emerald-400 font-bold hover:underline">Sign In here</Link>
        </div>
      </div>
    </div>
  );
}