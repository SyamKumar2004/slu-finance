'use client';
import React, { useState } from 'react';
import { Shield, MapPin, Contact } from 'lucide-react';

export default function TermsModal({ onAccept }: { onAccept: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [permissions, setPermissions] = useState({ geo: false, contacts: false });

  const requestGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(prev => ({ ...prev, geo: true })),
        () => alert('Location denied. This may flag transactions as high risk.')
      );
    }
  };

  const requestContacts = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      setPermissions(prev => ({ ...prev, contacts: true }));
    } else {
      alert('Contact Picker API is not natively supported on this browser/device.');
    }
  };

  const handleSubmission = () => {
    if (!agreed) return;
    localStorage.setItem('slu_tc_accepted', 'true');
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <Shield className="h-6 w-6 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Onboarding & Permissions Verification</h2>
        </div>

        <div className="my-4 max-h-40 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-950 p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-900">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">1. Ledger Terms</h3>
          <p className="mb-2">By verifying your profile inside SLU Finance, you recognize a civil obligation to pay the capital sum under the declared terms.</p>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">2. Multi-Channel Notifications</h3>
          <p>You grant explicit consent to receive daily automated transactional updates via SMS and WhatsApp ecosystems.</p>
        </div>

        <div className="space-y-3 py-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Authorize Browser Permissions:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={requestGeolocation} className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium ${permissions.geo ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-700'}`}>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Geolocation</span>
              <span className="text-xs">{permissions.geo ? '✓ Active' : 'Grant'}</span>
            </button>
            <button type="button" onClick={requestContacts} className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium ${permissions.contacts ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-700'}`}>
              <span className="flex items-center gap-2"><Contact className="h-4 w-4" /> Contact Picker</span>
              <span className="text-xs">{permissions.contacts ? '✓ Active' : 'Grant'}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 text-emerald-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400">I confirm compliance with the legal bindings and authorize the platform telemetry systems.</span>
          </label>
          <button onClick={handleSubmission} disabled={!agreed} className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white transition-all hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50">
            Accept and Enter Ledger
          </button>
        </div>
      </div>
    </div>
  );
}