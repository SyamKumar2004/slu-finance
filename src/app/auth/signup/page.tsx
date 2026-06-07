'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, UserPlus, Eye, EyeOff, Globe, CheckCircle2, ShieldCheck, Check, X } from 'lucide-react';

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
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Strictly updated 5-point evaluation metric parameters
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
      hasMinLength: p.length >= 12, // Upgraded to enterprise length standard
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

  const executeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (strengthLabel !== 'Strong') {
      alert("Security Block: Your password does not fulfill the strong corporate requirement criteria.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Validation Error: Passwords do not match.");
      return;
    }

    setLoading(true);
    const fullyCombinedPhoneNumber = `${form.countryCode}${form.phone}`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          phone_number: fullyCombinedPhoneNumber
        }
      }
    });

    if (authError) {
      alert(`Registration Exception: ${authError.message}`);
      setLoading(false);
      return;
    }

    if (authData?.user) {
      setIsSuccess(true);
    }
    setLoading(false);
  };

  const renderCheckRow = (isValid: boolean, text: string) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${isValid ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
      {isValid ? <Check className="h-4 w-4 text-emerald-400 shrink-0 animate-scaleIn" /> : <X className="h-4 w-4 text-slate-600 shrink-0" />}
      <span>{text}</span>
    </div>
  );

  // Safely resolve colors outside the JSX array to avoid VS Code template compilation breaking
  const bar1Color = strengthLabel === 'Low' ? 'bg-rose-500' : strengthLabel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
  const bar2Color = strengthLabel === 'Medium' ? 'bg-amber-500' : strengthLabel === 'Strong' ? 'bg-emerald-500' : 'bg-slate-800';
  const bar3Color = strengthLabel === 'Strong' ? 'bg-emerald-500' : 'bg-slate-800';

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 mx-auto rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-white">Verification Sent!</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            A secure link has been sent to <span className="text-emerald-400 font-semibold">{form.email}</span>. 
            Please open your inbox and click the activation link to complete verification and log in.
          </p>
          <div className="pt-4 border-t border-slate-800">
            <Link href="/auth/login" className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-wider">
              Return to Login Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Jane Doe" />
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Email Address</label>
            <div className="relative mt-1">
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="user@example.com" />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Phone Number</label>
            <div className="flex gap-2 mt-1">
              <div className="relative">
                <select value={form.countryCode} onChange={e => setForm({...form, countryCode: e.target.value})} className="h-full pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold appearance-none cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {REGISTRATION_COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <Globe className="absolute right-2 top-4 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 pl-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="XXXXXXXXXX" />
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Establish Password</label>
            <div className="relative mt-1">
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans transition-all" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* UPGRADED SECURE PASSWORD TRACKING INTERFACE */}
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Password Strength:
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide border ${
                  strengthLabel === 'None' ? 'bg-slate-900 text-slate-600 border-slate-800' :
                  strengthLabel === 'Low' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  strengthLabel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {strengthLabel === 'None' ? 'Empty' : strengthLabel}
                </span>
              </div>
              
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                <div className={`h-full flex-1 transition-all duration-300 ${strengthLabel !== 'None' ? bar1Color : 'bg-transparent'}`}></div>
                <div className={`h-full flex-1 transition-all duration-300 ${bar2Color}`}></div>
                <div className={`h-full flex-1 transition-all duration-300 ${bar3Color}`}></div>
              </div>

              <div className="pt-2 border-t border-slate-900/50 space-y-1.5">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Requirements Checklist:</p>
                {renderCheckRow(passwordMetrics.hasMinLength, "At least 12 characters (longer is safer)")}
                {renderCheckRow(passwordMetrics.hasCapital, "At least 1 uppercase letter (A-Z)")}
                {renderCheckRow(passwordMetrics.hasLowercase, "At least 1 lowercase letter (a-z)")}
                {renderCheckRow(passwordMetrics.hasNumber, "At least 1 number (0-9)")}
                {renderCheckRow(passwordMetrics.hasSpecial, "At least 1 special character (!, @, #, etc.)")}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
            <div className="relative mt-1">
              <input required type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full p-3 pl-11 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans transition-all" placeholder="••••••••" />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || strengthLabel !== 'Strong'} 
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold p-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-100 disabled:cursor-not-allowed"
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