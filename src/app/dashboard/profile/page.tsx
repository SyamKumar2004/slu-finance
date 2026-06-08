'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Settings, User, ShieldCheck, Landmark } from 'lucide-react';

export default function ProfileSettingsTab() {
  const supabase = createClient();
  const [sysRowId, setSysRowId] = useState<number | null>(null);
  const [sys, setSys] = useState({ companyName: 'SLU Finance', interestBuffer: '0' });
  const [admin, setAdmin] = useState({ name: 'Potnuru Syamkumar', email: 'syamkumarpotnuru7@gmail.com', phone: '+917075516605' });
  const [loading, setLoading] = useState(false);
  const [sysLoading, setSysLoading] = useState(false);

  const fetchProfileAndSettings = useCallback(async () => {
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

    // 1. Fetch System Settings safely
    const { data: sysData } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
      
    if (sysData) {
      setSysRowId(Number(sysData.id));
      setSys({ 
        companyName: sysData.company_name, 
        interestBuffer: (sysData.interest_buffer_percentage || 0).toString() 
      });
    }

    // 2. Fetch specific Admin data row using their strict private User UUID
    const { data: adminData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', activeLenderUuid)
      .maybeSingle();

    if (adminData) {
      setAdmin({ 
        name: adminData.full_name, 
        email: adminData.email || '', 
        phone: adminData.phone_number || '' 
      });
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfileAndSettings();
  }, [fetchProfileAndSettings]);

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const activeLenderUuid = localStorage.getItem('slu_user_id') || '00000000-0000-0000-0000-000000000000';

    // BULLETPROOF: Updates ONLY your explicit account row using your unique ID
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        full_name: admin.name.trim(), 
        email: admin.email.trim().toLowerCase(), 
        phone_number: admin.phone.trim() 
      })
      .eq('id', activeLenderUuid);

    if (!error) {
      localStorage.setItem('slu_user_name', admin.name.trim());
      localStorage.setItem('slu_user_email', admin.email.trim().toLowerCase());
      alert("Success: Admin profile records updated live!");
      fetchProfileAndSettings();
    } else {
      alert(`Profile Update Fault: ${error.message}`);
    }
    setLoading(false);
  };

  const handleUpdateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSysLoading(true);

    if (sysRowId === null) {
      alert("Configuration Error: Unable to determine active system settings row index.");
      setSysLoading(false);
      return;
    }

    const { error } = await supabase
      .from('system_settings')
      .update({ 
        company_name: sys.companyName.trim(), 
        interest_buffer_percentage: parseFloat(sys.interestBuffer || '0') 
      })
      .eq('id', sysRowId);

    if (!error) {
      alert("Platform Settings Saved Successfully!");
      fetchProfileAndSettings();
    } else {
      alert(`System Config Fault: ${error.message}`);
    }
    setSysLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2">
      
      {/* SECTION BANNER HEADER */}
      <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            Settings Workspace
          </h2>
          <p className="text-sm text-slate-400 font-bold mt-1">Manage global enterprise configuration parameters and customize profile contact signatures.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider select-none">
          <Landmark className="h-4 w-4" /> Core Node Configured
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* VIEW ONE: SYSTEM PARAMETER CONTROLS */}
        <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-800/60">
            <h3 className="text-lg font-black text-white flex items-center gap-2.5">
              <Settings className="text-emerald-400 h-5 w-5" /> Platform Configurations
            </h3>
          </div>
          
          <form onSubmit={handleUpdateSystem} className="space-y-5 text-sm font-extrabold">
            <div>
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider">Platform Brand Title</label>
              <input required type="text" value={sys.companyName} onChange={e => setSys({ ...sys, companyName: e.target.value })} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-slate-500 shadow-inner" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider">System Interest Buffer Rate (%)</label>
              <input required type="number" step="0.01" value={sys.interestBuffer} onChange={e => setSys({ ...sys, interestBuffer: e.target.value })} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-slate-500 shadow-inner" />
            </div>
            <button type="submit" disabled={sysLoading} className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs font-black p-4 rounded-xl uppercase tracking-wider transition-all shadow-md mt-2">
              {sysLoading ? 'Synchronizing Systems...' : 'Sync System Settings'}
            </button>
          </form>
        </div>

        {/* VIEW TWO: PERSONAL ADMIN CREDENTIAL CONTROL */}
        <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-800/60">
            <h3 className="text-lg font-black text-white flex items-center gap-2.5">
              <User className="text-blue-400 h-5 w-5" /> Personal Admin Settings
            </h3>
          </div>
          
          <form onSubmit={handleUpdateAdmin} className="space-y-5 text-sm font-extrabold">
            <div>
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider">Admin Full Name</label>
              <input required type="text" value={admin.name} onChange={e => setAdmin({ ...admin, name: e.target.value })} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-slate-500 shadow-inner" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider">Corporate Email Endpoint</label>
              <input required type="email" value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-slate-500 shadow-inner" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider">Mobile Contact Number</label>
              <input required type="text" value={admin.phone} onChange={e => setAdmin({ ...admin, phone: e.target.value })} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-slate-500 shadow-inner" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black p-4 rounded-xl uppercase tracking-wider transition-all shadow-lg mt-2">
              {loading ? 'Saving Profile Changes...' : 'Update Admin Credentials'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}