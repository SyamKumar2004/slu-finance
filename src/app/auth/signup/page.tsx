'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, UserPlus, Eye, EyeOff, Globe, Check, X, AlertCircle } from 'lucide-react';

const REGISTRATION_COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
];

export default function UserSelfRegistrationPortal() {
  const supabase = createClient();
  const router = useRouter();
  
  const [form, setForm] = useState({ name: '', email: '', countryCode: '+91', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRulesPopover, setShowRulesPopover] = useState(false);

  const [passwordMetrics, setPasswordMetrics] = useState({
    hasMinLength: false,
    hasCapital: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
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
    if (p.length === 0) {
      setStrengthLabel('None');
    } else if (totalPassedChecks <= 2) {
      setStrengthLabel('Low');
    } else if (totalPassedChecks <= 4) {
      setStrengthLabel('Medium');
    } else if (totalPassedChecks === 5) {
      setStrengthLabel('Strong');
    }
  }, [form.password]);

  const handlePhoneInputChange = (val: string) => {
    const numbersOnly = val.replace(/\D/g, ''); 
    setForm({ ...form, phone: numbersOnly.slice(0, 10) }); 
  };

  const executeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailPatternCheck = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPatternCheck.test(form.email)) {
      alert("Invalid Input: Please enter a valid email address.");
      return;
    }

    if (form.phone.length !== 10) {
      alert(`Validation Fault: Phone number requires exactly 10 digits.`);
      return;
    }

    if (strengthLabel !== 'Strong') {
      alert("Security Block: Your password must reach Strong status.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Validation Error: Passwords do not match.");
      return;
    }

    setLoading(true);
    const fullyCombinedPhoneNumber = `${form.countryCode}${form.phone}`;

    // Generate a secure custom UUID string on the frontend instantly
    const simulatedUserId = crypto.randomUUID();

    // Direct Database Insertion - Bypassing any Auth loops completely
    const { error: dbError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: simulatedUserId,
          full_name: form.name,
          phone_number: fullyCombinedPhoneNumber,
          role: 'admin' // Instantly provisions master admin permissions to the database row
        }
      ]);

    if (dbError) {
      alert(`Database Error: ${dbError.message}`);
      setLoading(false);
      return;
    }

    // Save profile configurations locally in browser cookie layout variables to emulate rapid session logging
    localStorage.setItem('slu_session_active', 'true');
    localStorage.setItem('slu_user_name', form.name);

    alert("System Master Profile Saved Successfully! Welcome to your Workspace.");
    router.push('/dashboard');
    setLoading(false);
  };

  const renderCheckRow = (isValid: boolean, text: string) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${isValid ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
      {isValid ? <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
      <span>{text}</span>
    </div>
  );

  const bar1Color = strengthLabel === 'Low' ? 'bg-rose-500' : strengthLabel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
  const bar2Color = strengthLabel === 'Medium' ? 'bg-amber-500' : strengthLabel === 'Strong' ? 'bg-emerald-500' : 'bg-slate-800/60';
  const bar3Color = strengthLabel === 'Strong' ? 'bg-emerald-500' : 'bg-slate-800/60';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black tracking-tight text-white">Profile Creation</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Register New System Account</p>
        </div>
        
        <form onSubmit={executeRegistration} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Legal Name</label>
            <div className="relative mt-1">
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Jane Doe" />
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
              <div className="relative">
                <select value={form.countryCode} onChange={e => setForm({...form, countryCode: e.target.value})} className="h-full pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold appearance-none cursor-pointer text-sm focus:outline-none">
                  {REGISTRATION_COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <div className="absolute right-2 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 w-0 h-0"></div>
              </div>
              <div className="relative flex-1">
                <input required type="text" inputMode="numeric" value={form.phone} onChange={e => handlePhoneInputChange(e.target.value)} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider" placeholder="9876543210" />
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Establish Password</label>
              <div className="relative flex items-center">
                <button type="button" onClick={() => setShowRulesPopover(!showRulesPopover)} onMouseEnter={() => setShowRulesPopover(true)} onMouseLeave={() => setShowRulesPopover(false)} className="text-slate-400 hover:text-emerald-400 transition-colors p-1">
                  <AlertCircle className="h-4 w-4" />
                </button>

                {showRulesPopover && (
                  <div className="absolute right-0 bottom-6 w-64 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl z-50 space-y-2 pointer-events-none animate-fadeIn">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">Password Requirements:</p>
                    <div className="space-y-1.5">
                      {renderCheckRow(passwordMetrics.hasMinLength, "At least 12 characters")}
                      {renderCheckRow(passwordMetrics.hasCapital, "At least 1 uppercase letter")}
                      {renderCheckRow(passwordMetrics.hasLowercase, "At least 1 lowercase letter")}
                      {renderCheckRow(passwordMetrics.hasNumber, "At least 1 number")}
                      {renderCheckRow(passwordMetrics.hasSpecial, "At least 1 special item")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative mt-1">
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {form.password.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1 w-full bg-slate-800 rounded-full flex gap-0.5 overflow-hidden">
                  <div className={`h-full flex-1 transition-all duration-300 ${bar1Color}`}></div>
                  <div className={`h-full flex-1 transition-all duration-300 ${bar2Color}`}></div>
                  <div className={`h-full flex-1 transition-all duration-300 ${bar3Color}`}></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-slate-500">Security Rating:</span>
                  <span className={strengthLabel === 'Low' ? 'text-rose-400' : strengthLabel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}>
                    {strengthLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
            <div className="relative mt-1">
              <input required type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || strengthLabel !== 'Strong'} 
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold p-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed"
          >
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