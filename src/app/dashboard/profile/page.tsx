'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Settings, User, ShieldCheck } from 'lucide-react';

export default function ProfileSettingsTab() {
  const supabase = createClient();
  const [sys, setSys] = useState({ companyName: 'SLU Finance', interestBuffer: '0' });
  const [admin, setAdmin] = useState({ name: 'Potnuru Syamkumar', email: 'syamkumarpotnuru7@gmail.com', phone: '+917075516605' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('system_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) setSys({ companyName: data.company_name, interestBuffer: data.interest_buffer_percentage.toString() });
    });
    supabase.from('user_profiles').select('*').filter('full_name', 'ilike', `%Syamkumar%`).limit(1).maybeSingle().then(({ data }) => {
      if (data) setAdmin({ name: data.full_name, email: data.email || '', phone: data.phone_number || '' });
    });
  }, []);

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('user_profiles').update({ full_name: admin.name, email: admin.email, phone_number: admin.phone }).filter('full_name', 'ilike', `%Syamkumar%`);
    localStorage.setItem('slu_user_name', admin.name);
    localStorage.setItem('slu_user_email', admin.email);
    alert("Success: Admin profile records updated!");
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div><h3 className="text-md font-black text-white flex items-center gap-2"><Settings className="text-emerald-500 h-4 w-4" /> Platform Configurations</h3></div>
        <form onSubmit={async (e) => { e.preventDefault(); await supabase.from('system_settings').update({ company_name: sys.companyName, interest_buffer_percentage: parseFloat(sys.interestBuffer || '0') }).neq('id', 0); alert("Platform Settings Saved!"); }} className="space-y-4 text-xs font-bold">
          <div><label className="text-slate-400 uppercase">Platform Title</label><input required type="text" value={sys.companyName} onChange={e => setSys({ ...sys, companyName: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white" /></div>
          <div><label className="text-slate-400 uppercase">Buffer Rate (%)</label><input required type="number" step="0.01" value={sys.interestBuffer} onChange={e => setSys({ ...sys, interestBuffer: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white" /></div>
          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs font-black p-3.5 rounded-xl uppercase transition-all">Sync System</button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div><h3 className="text-md font-black text-white flex items-center gap-2"><User className="text-blue-400 h-4 w-4" /> Personal Admin Settings</h3></div>
        <form onSubmit={handleUpdateAdmin} className="space-y-4 text-xs font-bold border-t border-slate-800/60 pt-4">
          <div><label className="text-slate-400 uppercase">Admin Full Name</label><input required type="text" value={admin.name} onChange={e => setAdmin({ ...admin, name: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
          <div><label className="text-slate-400 uppercase">Corporate Email</label><input required type="email" value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
          <div><label className="text-slate-400 uppercase">Mobile Contact Number</label><input required type="text" value={admin.phone} onChange={e => setAdmin({ ...admin, phone: e.target.value })} className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none" /></div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black p-3.5 rounded-xl uppercase transition-all shadow-lg">{loading ? 'Saving...' : 'Update Admin Credentials'}</button>
        </form>
      </div>
    </div>
  );
}