'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, UserPlus, Eye, EyeOff, Globe, Check, X, AlertCircle } from 'lucide-react';

export default function UserSelfRegistrationPortal() {
  const supabase = createClient();
  const router = useRouter();
  
  const [form, setForm] = useState({ name: '', email: '', countryCode: '+91', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRulesPopover, setShowRulesPopover] = useState(false);

  const [passwordMetrics, setPasswordMetrics] = useState({ hasMinLength: false, hasCapital: false, hasLowercase: false, hasNumber: false, hasSpecial: false });
  const [strengthLabel, setStrengthLabel] = useState<'None' | 'Low' | 'Medium' | 'Strong'>('None');

  useEffect(() => {
    const p = form.password;
    const metrics = {
      hasMinLength: p.length >= 12,
      hasCapital: /[A-Z]/.test(p),
      hasLowercase: /[a-z]/.test(p),
      hasNumber: /\d/.test(p),
      hasSpecial: /[@$!%*?&#.,:;_\-+=/*()\[\]{}~^|<>`'"]/.test(p),
    };
    setPasswordMetrics(metrics);
    const totalPassedChecks = Object.values(metrics).filter(Boolean).length;
    if (p.length === 0) setStrengthLabel('None');
    else if (totalPassedChecks <= 2) setStrengthLabel('Low');
    else if (totalPassedChecks <= 4) setStrengthLabel('Medium');
    else if (totalPassedChecks === 5) setStrengthLabel('Strong');
  }, [form.password]);

  const executeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) { alert("Invalid Input: Verify your email layout format."); return; }
    if (form.phone.replace(/\D/g, '').length !== 10) { alert("Validation Fault: Phone requires exactly 10 digits."); return; }
    if (strengthLabel !== 'Strong') { alert("Security Block: Password strength must read Strong."); return; }
    if (form.password !== form.confirmPassword) { alert("Validation Error: Passwords do not match."); return; }

    setLoading(true);
    const fullyCombinedPhoneNumber = `${form.countryCode}${form.phone.replace(/\D/g, '')}`;

    const { error: dbError } = await supabase.from('user_profiles').insert([{
      full_name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone_number: fullyCombinedPhoneNumber,
      password_hash: form.password,
      role: 'admin'
    }]);

    if (dbError) { alert(`Registration Database Error: ${dbError.message}`); setLoading(false); return; }

    localStorage.setItem('slu_session_active', 'true');
    localStorage.setItem('slu_user_name', form.name.trim());
    localStorage.setItem('slu_user_email', form.email.trim().toLowerCase());

    alert("Registration Successful! Profile metrics configured.");
    router.push('/dashboard');
    setLoading(false);
  };

  const renderCheckRow = (isValid: boolean, text: string) => (
    <div className={`flex items-center gap-2 text-xs ${isValid ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
      {isValid ? <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white">Profile Creation</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Register System Account</p>
        </div>
        <form onSubmit={executeRegistration} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Legal Name</label>
            <div className="relative mt-1">
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Potnuru Syamkumar" />
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Email Address</label>
            <div className="relative mt-1">
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="user@example.com" />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Phone Number</label>
            <div className="flex gap-2 mt-1">
              <select value={form.countryCode} onChange={e => setForm({...form, countryCode: e.target.value})} className="pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm appearance-none focus:outline-none"><option value="+91">🇮🇳 +91</option></select>
              <input required type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="9876543210" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Establish Password</label>
              <button type="button" onClick={() => setShowRulesPopover(!showRulesPopover)} className="text-slate-400 hover:text-emerald-400 p-1"><AlertCircle className="h-4 w-4" /></button>
              {showRulesPopover && (
                <div className="absolute right-0 bottom-6 w-64 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl z-50 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase pb-1 border-b border-slate-800">Password Rules:</p>
                  {renderCheckRow(passwordMetrics.hasMinLength, "At least 12 characters")}
                  {renderCheckRow(passwordMetrics.hasCapital, "At least 1 uppercase letter")}
                  {renderCheckRow(passwordMetrics.hasLowercase, "At least 1 lowercase letter")}
                  {renderCheckRow(passwordMetrics.hasNumber, "At least 1 number")}
                  {renderCheckRow(passwordMetrics.hasSpecial, "At least 1 special item")}
                </div>
              )}
            </div>
            <div className="relative mt-1">
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
            <div className="relative mt-1">
              <input required type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading || strengthLabel !== 'Strong'} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold p-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm uppercase">
            <UserPlus className="h-4 w-4" /> {loading ? 'Processing...' : 'Complete System Registration'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/60 pt-4">
          Already have an account? <Link href="/auth/login" className="text-emerald-400 font-bold hover:underline">Sign In here</Link>
        </div>
      </div>
    </div>
  );
}